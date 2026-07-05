package config

import (
	"os"
)

type Config struct {
	Port                     string
	DatabaseURL              string
	StellarRPCURL            string
	HorizonURL               string
	NetworkPassphrase        string
	ContractID               string
	AssetContractID          string
	AdminSecretKey           string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/lumbung_desa?sslmode=disable"
	}

	rpcURL := os.Getenv("STELLAR_RPC_URL")
	if rpcURL == "" {
		rpcURL = "https://soroban-testnet.stellar.org"
	}

	horizonURL := os.Getenv("HORIZON_URL")
	if horizonURL == "" {
		horizonURL = "https://horizon-testnet.stellar.org"
	}

	passphrase := os.Getenv("STELLAR_NETWORK_PASSPHRASE")
	if passphrase == "" {
		passphrase = "Test SDF Network ; September 2015"
	}

	contractID := os.Getenv("CONTRACT_ID")
	assetContractID := os.Getenv("ASSET_CONTRACT_ID")
	adminSecret := os.Getenv("ADMIN_SECRET_KEY")

	return &Config{
		Port:              port,
		DatabaseURL:       dbURL,
		StellarRPCURL:     rpcURL,
		HorizonURL:        horizonURL,
		NetworkPassphrase: passphrase,
		ContractID:        contractID,
		AssetContractID:   assetContractID,
		AdminSecretKey:    adminSecret,
	}
}
