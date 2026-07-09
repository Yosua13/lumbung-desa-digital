# Warung Supplier Credit

Invoice financing demo untuk stok warung: UI tetap Rupiah-facing, Stellar/Soroban menjadi settlement dan trust layer di belakang layar.

Project ini disarankan dijalankan dengan dua environment:

- Frontend React/Vite: Windows PowerShell.
- Smart contract Stellar/Soroban: Ubuntu/WSL.

## 1. Frontend di Windows

Buka PowerShell di folder project Windows:

```powershell
cd D:\project_yosua\stellar\warung-supplier-credit
pnpm install
pnpm run dev
```

URL default:

```text
http://localhost:3000
```

Build/typecheck frontend:

```powershell
cd D:\project_yosua\stellar\warung-supplier-credit
pnpm run lint
pnpm run build
```

Jika PowerShell tidak mengenali `pnpm`, aktifkan Corepack atau install pnpm:

```powershell
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version
```

## 2. Environment Frontend

Buat `.env.local` dari `.env.example`:

```powershell
cd D:\project_yosua\stellar\warung-supplier-credit
Copy-Item .env.example .env.local
```

Untuk mode demo tanpa live contract:

```env
VITE_ENABLE_LIVE_STELLAR="false"
VITE_STELLAR_NETWORK="testnet"
VITE_STELLAR_RPC_URL="https://soroban-testnet.stellar.org"
VITE_STELLAR_HORIZON_URL="https://horizon-testnet.stellar.org"
VITE_WSC_POOL_ESCROW_CONTRACT_ID=""
```

Setelah deploy contract dari Ubuntu/WSL, isi contract ID:

```env
VITE_ENABLE_LIVE_STELLAR="true"
VITE_WSC_POOL_ESCROW_CONTRACT_ID="CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

Catatan:

- `VITE_WSC_POOL_ESCROW_CONTRACT_ID` adalah contract ID/address Soroban yang diawali huruf `C`.
- Wallet Freighter user tidak dimasukkan ke env. Wallet user dibaca saat klik `Hubungkan`.
- Nama wallet/identity Stellar CLI seperti `wsc-testnet` tidak dimasukkan ke env frontend karena itu hanya alias lokal di Ubuntu/WSL untuk deploy contract.

## 3. Smart Contract di Ubuntu/WSL

Buka Ubuntu/WSL, lalu masuk ke folder project dari mount Windows:

```bash
cd /mnt/d/project_yosua/stellar/warung-supplier-credit
```

Setup Rust, Stellar CLI, network, dan source account testnet:

```bash
bash scripts/stellar/setup-ubuntu.sh
```

Build, deploy contract, dan generate TypeScript bindings:

```bash
bash scripts/stellar/build-deploy-bindings.sh
```

Script akan membuat `.env.stellar.local` berisi contract ID hasil deploy. Salin nilainya ke `.env.local` frontend di Windows.

Runbook lengkap: [docs/runbooks/soroban-stellar-testnet.md](docs/runbooks/soroban-stellar-testnet.md)

## 4. Freighter Testnet

1. Install Freighter browser extension di browser Windows.
2. Pilih network `Testnet`.
3. Fund akun testnet melalui Freighter/Friendbot jika diperlukan.
4. Jalankan frontend, masuk dashboard, lalu klik `Hubungkan`.

## 5. Dokumen Teknis

- Audit arsitektur: [docs/architecture-audit.md](docs/architecture-audit.md)
- Runbook Soroban: [docs/runbooks/soroban-stellar-testnet.md](docs/runbooks/soroban-stellar-testnet.md)
