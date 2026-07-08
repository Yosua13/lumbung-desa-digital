# Warung Supplier Credit

Invoice financing demo untuk stok warung: UI tetap Rupiah-facing, Stellar/Soroban menjadi settlement dan trust layer di belakang layar.

## Jalankan Web App

```bash
pnpm install
pnpm run dev
```

URL default: `http://localhost:3000`

## Environment

Salin `.env.example` ke `.env.local` atau `.env`, lalu isi contract ID setelah deploy Soroban:

```bash
VITE_ENABLE_LIVE_STELLAR="false"
VITE_STELLAR_NETWORK="testnet"
VITE_STELLAR_RPC_URL="https://soroban-testnet.stellar.org"
VITE_STELLAR_HORIZON_URL="https://horizon-testnet.stellar.org"
VITE_WSC_POOL_ESCROW_CONTRACT_ID=""
```

## Freighter Testnet

1. Install Freighter browser extension.
2. Pilih Stellar Testnet.
3. Masuk ke dashboard WSC dan klik `Hubungkan`.

## Soroban dan Bindings

Jalankan dari Ubuntu/WSL:

```bash
pnpm run contracts:setup:ubuntu
pnpm run contracts:deploy:testnet
```

Runbook lengkap: `docs/runbooks/soroban-stellar-testnet.md`

Audit arsitektur: `docs/architecture-audit.md`
