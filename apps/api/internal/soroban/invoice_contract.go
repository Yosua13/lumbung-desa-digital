package soroban

import (
	"fmt"

	"lumbung-desa-digital/apps/api/internal/stellar"
	"github.com/stellar/go/xdr"
)

func BuildCreateInvoice(c *stellar.StellarClient, source, warung, supplier string, amount int64, instCount uint32, due uint64) (string, error) {
	valWarung, err := stellar.ScValAddress(warung)
	if err != nil {
		return "", fmt.Errorf("invalid warung address: %w", err)
	}

	valSupplier, err := stellar.ScValAddress(supplier)
	if err != nil {
		return "", fmt.Errorf("invalid supplier address: %w", err)
	}

	valAmount := stellar.ScValI128(amount)
	valInstCount := stellar.ScValU32(instCount)
	valDue := stellar.ScValU64(due)

	args := []xdr.ScVal{valWarung, valSupplier, valAmount, valInstCount, valDue}

	return c.BuildInvokeTransactionXDR(source, "create_invoice", args)
}

func BuildApproveInvoice(c *stellar.StellarClient, source string, invoiceID uint64) (string, error) {
	valID := stellar.ScValU64(invoiceID)
	args := []xdr.ScVal{valID}

	return c.BuildInvokeTransactionXDR(source, "approve_invoice", args)
}

func BuildFundInvoice(c *stellar.StellarClient, source, funder string, invoiceID uint64) (string, error) {
	valID := stellar.ScValU64(invoiceID)
	valFunder, err := stellar.ScValAddress(funder)
	if err != nil {
		return "", fmt.Errorf("invalid funder address: %w", err)
	}

	args := []xdr.ScVal{valID, valFunder}

	return c.BuildInvokeTransactionXDR(source, "fund_invoice", args)
}

func BuildMarkShipped(c *stellar.StellarClient, source string, invoiceID uint64) (string, error) {
	valID := stellar.ScValU64(invoiceID)
	args := []xdr.ScVal{valID}

	return c.BuildInvokeTransactionXDR(source, "mark_shipped", args)
}

func BuildConfirmDelivery(c *stellar.StellarClient, source string, invoiceID uint64) (string, error) {
	valID := stellar.ScValU64(invoiceID)
	args := []xdr.ScVal{valID}

	return c.BuildInvokeTransactionXDR(source, "confirm_delivery", args)
}

func BuildReleaseToSupplier(c *stellar.StellarClient, source string, invoiceID uint64) (string, error) {
	valID := stellar.ScValU64(invoiceID)
	args := []xdr.ScVal{valID}

	return c.BuildInvokeTransactionXDR(source, "release_to_supplier", args)
}

func BuildPayInstallment(c *stellar.StellarClient, source, payer string, invoiceID uint64, amount int64) (string, error) {
	valID := stellar.ScValU64(invoiceID)
	valPayer, err := stellar.ScValAddress(payer)
	if err != nil {
		return "", fmt.Errorf("invalid payer address: %w", err)
	}
	valAmount := stellar.ScValI128(amount)

	args := []xdr.ScVal{valID, valPayer, valAmount}

	return c.BuildInvokeTransactionXDR(source, "pay_installment", args)
}

func BuildOpenDispute(c *stellar.StellarClient, source string, invoiceID uint64) (string, error) {
	valID := stellar.ScValU64(invoiceID)
	args := []xdr.ScVal{valID}

	return c.BuildInvokeTransactionXDR(source, "open_dispute", args)
}

func BuildResolveDispute(c *stellar.StellarClient, source string, invoiceID uint64, releaseToSupplier bool) (string, error) {
	valID := stellar.ScValU64(invoiceID)
	
	// Create ScVal for bool
	valRelease := xdr.ScVal{
		Type: xdr.ScValTypeScvBool,
		B:    &releaseToSupplier,
	}

	args := []xdr.ScVal{valID, valRelease}

	return c.BuildInvokeTransactionXDR(source, "resolve_dispute", args)
}
