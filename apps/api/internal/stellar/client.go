package stellar

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/stellar/go/clients/horizonclient"
	"github.com/stellar/go/keypair"
	"github.com/stellar/go/strkey"
	"github.com/stellar/go/txnbuild"
	"github.com/stellar/go/xdr"
)

type StellarClient struct {
	HorizonURL        string
	NetworkPassphrase string
	ContractID        string
}

func New(horizonURL, passphrase, contractID string) *StellarClient {
	return &StellarClient{
		HorizonURL:        horizonURL,
		NetworkPassphrase: passphrase,
		ContractID:        contractID,
	}
}

func (c *StellarClient) GetSequence(address string) (int64, error) {
	client := horizonclient.DefaultTestNetClient
	if !strings.Contains(c.HorizonURL, "testnet") {
		client = &horizonclient.Client{
			HorizonURL: c.HorizonURL,
			HTTP:       http.DefaultClient,
		}
	}
	accountRequest := horizonclient.AccountRequest{AccountID: address}
	account, err := client.AccountDetail(accountRequest)
	if err != nil {
		return 0, fmt.Errorf("failed to get account detail: %w", err)
	}
	seq, err := account.GetSequenceNumber()
	if err != nil {
		return 0, fmt.Errorf("failed to get sequence number: %w", err)
	}
	return int64(seq), nil
}

func (c *StellarClient) BuildInvokeTransactionXDR(sourceAddress string, functionName string, args []xdr.ScVal) (string, error) {
	seq, err := c.GetSequence(sourceAddress)
	if err != nil {
		return "", fmt.Errorf("failed to fetch sequence: %w", err)
	}

	contractBytes, err := strkey.Decode(strkey.VersionByteContract, c.ContractID)
	if err != nil {
		return "", fmt.Errorf("invalid contract id: %w", err)
	}
	var contractID xdr.ContractId
	copy(contractID[:], contractBytes)

	contractAddress := xdr.ScAddress{
		Type:       xdr.ScAddressTypeScAddressTypeContract,
		ContractId: &contractID,
	}

	sym := xdr.ScSymbol(functionName)
	op := &txnbuild.InvokeHostFunction{
		HostFunction: xdr.HostFunction{
			Type: xdr.HostFunctionTypeHostFunctionTypeInvokeContract,
			InvokeContract: &xdr.InvokeContractArgs{
				ContractAddress: contractAddress,
				FunctionName:    sym,
				Args:            args,
			},
		},
		SourceAccount: sourceAddress,
	}

	sourceAccount := txnbuild.SimpleAccount{
		AccountID: sourceAddress,
		Sequence:  seq,
	}

	tx, err := txnbuild.NewTransaction(txnbuild.TransactionParams{
		SourceAccount:        &sourceAccount,
		IncrementSequenceNum: true,
		Operations:           []txnbuild.Operation{op},
		BaseFee:              txnbuild.MinBaseFee * 5, // Buffering fee for Soroban
		Preconditions:        txnbuild.Preconditions{TimeBounds: txnbuild.NewInfiniteTimeout()},
	})
	if err != nil {
		return "", fmt.Errorf("failed to build transaction: %w", err)
	}

	xdrStr, err := tx.Base64()
	if err != nil {
		return "", fmt.Errorf("failed to encode transaction to base64: %w", err)
	}

	return xdrStr, nil
}

func (c *StellarClient) SubmitTransaction(signedXDR string) (string, error) {
	client := horizonclient.DefaultTestNetClient
	if !strings.Contains(c.HorizonURL, "testnet") {
		client = &horizonclient.Client{
			HorizonURL: c.HorizonURL,
			HTTP:       http.DefaultClient,
		}
	}
	resp, err := client.SubmitTransactionXDR(signedXDR)
	if err != nil {
		hErr := horizonclient.GetError(err)
		if hErr != nil {
			return "", fmt.Errorf("horizon error: %s, result XDR: %s", hErr.Problem.Title, hErr.Problem.Extras["result_xdr"])
		}
		return "", fmt.Errorf("failed to submit tx: %w", err)
	}
	return resp.Hash, nil
}

func (c *StellarClient) SignAndSubmit(unsignedXDR string, secretKey string) (string, error) {
	genericTx, err := txnbuild.TransactionFromXDR(unsignedXDR)
	if err != nil {
		return "", fmt.Errorf("failed to parse XDR: %w", err)
	}

	tx, ok := genericTx.Transaction()
	if !ok {
		return "", fmt.Errorf("XDR is not a transaction")
	}

	kp, err := keypair.ParseFull(secretKey)
	if err != nil {
		return "", fmt.Errorf("failed to parse secret key: %w", err)
	}

	_, err = tx.Sign(c.NetworkPassphrase, kp)
	if err != nil {
		return "", fmt.Errorf("failed to sign transaction: %w", err)
	}

	signedXDR, err := tx.Base64()
	if err != nil {
		return "", fmt.Errorf("failed to get signed XDR: %w", err)
	}

	return c.SubmitTransaction(signedXDR)
}

// Helpers for ScVal creation
func ScValSymbol(s string) xdr.ScVal {
	sym := xdr.ScSymbol(s)
	return xdr.ScVal{
		Type: xdr.ScValTypeScvSymbol,
		Sym:  &sym,
	}
}

func ScValAddress(addr string) (xdr.ScVal, error) {
	var scAddr xdr.ScAddress
	if strings.HasPrefix(addr, "C") {
		contractBytes, err := strkey.Decode(strkey.VersionByteContract, addr)
		if err != nil {
			return xdr.ScVal{}, err
		}
		var contractID xdr.ContractId
		copy(contractID[:], contractBytes)
		scAddr = xdr.ScAddress{
			Type:       xdr.ScAddressTypeScAddressTypeContract,
			ContractId: &contractID,
		}
	} else {
		var accountID xdr.AccountId
		err := accountID.SetAddress(addr)
		if err != nil {
			return xdr.ScVal{}, err
		}
		scAddr = xdr.ScAddress{
			Type:      xdr.ScAddressTypeScAddressTypeAccount,
			AccountId: &accountID,
		}
	}
	return xdr.ScVal{
		Type:    xdr.ScValTypeScvAddress,
		Address: &scAddr,
	}, nil
}

func ScValU32(v uint32) xdr.ScVal {
	u := xdr.Uint32(v)
	return xdr.ScVal{
		Type: xdr.ScValTypeScvU32,
		U32:  &u,
	}
}

func ScValU64(v uint64) xdr.ScVal {
	u := xdr.Uint64(v)
	return xdr.ScVal{
		Type: xdr.ScValTypeScvU64,
		U64:  &u,
	}
}

func ScValI128(v int64) xdr.ScVal {
	var hi int64 = 0
	if v < 0 {
		hi = -1
	}
	parts := xdr.Int128Parts{
		Hi: xdr.Int64(hi),
		Lo: xdr.Uint64(v),
	}
	return xdr.ScVal{
		Type: xdr.ScValTypeScvI128,
		I128: &parts,
	}
}
