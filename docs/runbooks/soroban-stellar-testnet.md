# Soroban + Stellar Testnet Runbook

Runbook ini sengaja dipisah dari frontend:

- Frontend dijalankan di Windows/PowerShell.
- Smart contract Soroban dijalankan di Ubuntu/WSL.

Tujuannya agar command Rust/Stellar CLI tidak dieksekusi di PowerShell Windows dan command frontend tidak membingungkan setup Ubuntu.

## 0. Struktur Environment

| Kebutuhan | Tempat Jalan | Command Shell |
| --- | --- | --- |
| React/Vite frontend | Windows | PowerShell |
| Freighter browser extension | Windows browser | UI browser |
| Rust, Stellar CLI, Soroban build/deploy | Ubuntu/WSL | Bash, tanpa pnpm |
| Contract ID hasil deploy | Disalin ke frontend env | `.env.local` |

## 1. Frontend di Windows

Buka PowerShell:

```powershell
cd D:\project_yosua\stellar\warung-supplier-credit
pnpm install
pnpm run dev
```

Frontend akan berjalan di:

```text
http://localhost:3000
```

Verifikasi frontend:

```powershell
pnpm run lint
pnpm run build
```

Jika `pnpm` belum tersedia di Windows:

```powershell
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version
```

## 2. Env Frontend di Windows

Buat file env lokal:

```powershell
cd D:\project_yosua\stellar\warung-supplier-credit
Copy-Item .env.example .env.local
```

Sebelum contract deploy, boleh pakai mode demo:

```env
VITE_ENABLE_LIVE_STELLAR="false"
VITE_STELLAR_NETWORK="testnet"
VITE_STELLAR_RPC_URL="https://soroban-testnet.stellar.org"
VITE_STELLAR_HORIZON_URL="https://horizon-testnet.stellar.org"
VITE_WSC_POOL_ESCROW_CONTRACT_ID=""
```

Setelah contract deploy dari Ubuntu/WSL, update:

```env
VITE_ENABLE_LIVE_STELLAR="true"
VITE_WSC_POOL_ESCROW_CONTRACT_ID="CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

Penting:

- `VITE_WSC_POOL_ESCROW_CONTRACT_ID` wajib diisi jika frontend ingin menampilkan link contract dan menjalankan live Stellar/Soroban flow.
- Contract ID dan contract address pada Soroban merujuk ke hal yang sama: ID/address contract yang biasanya diawali `C`.
- Address wallet Freighter user tidak perlu dimasukkan ke env karena user connect melalui tombol `Hubungkan`.
- Nama wallet Stellar CLI seperti `wsc-testnet` tidak masuk env frontend. Itu hanya alias lokal di Ubuntu/WSL untuk signing/deploy.

## 3. Setup Ubuntu/WSL untuk Soroban

Buka Ubuntu/WSL:

```bash
cd /mnt/d/project_yosua/stellar/warung-supplier-credit
```

Jalankan setup:

```bash
bash scripts/stellar/setup-ubuntu.sh
```

Script tersebut menjalankan langkah inti berikut:

```bash
sudo apt-get update
sudo apt-get install -y build-essential curl pkg-config libssl-dev
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
rustup update stable
rustup default stable
rustup target add wasm32v1-none
cargo install --locked stellar-cli
stellar network add --rpc-url https://soroban-testnet.stellar.org --network-passphrase "Test SDF Network ; September 2015" testnet
stellar keys generate --network testnet wsc-testnet
stellar keys fund --network testnet wsc-testnet
```

Jika ingin memakai nama wallet/identity CLI berbeda:

```bash
export STELLAR_SOURCE_ACCOUNT="nama-wallet-anda"
bash scripts/stellar/setup-ubuntu.sh
```

## 4. Build, Deploy, dan Generate Bindings

Masih di Ubuntu/WSL:

```bash
cd /mnt/d/project_yosua/stellar/warung-supplier-credit
bash scripts/stellar/build-deploy-bindings.sh
```

Script menjalankan alur inti:

```bash
cd contracts
stellar contract build
stellar contract upload --source-account wsc-testnet --network testnet --wasm ./target/wasm32v1-none/release/pool_escrow.wasm
stellar contract deploy --source-account wsc-testnet --network testnet --wasm-hash <WASM_HASH>
stellar contract bindings typescript --network testnet --id <CONTRACT_ID> --output-dir ./packages/pool_escrow --overwrite
```

Output penting:

- `CONTRACT_ID`: address contract Soroban, diawali `C`.
- `packages/pool_escrow`: TypeScript bindings hasil generate.
- `.env.stellar.local`: env helper berisi contract ID.

Salin isi `.env.stellar.local` ke `.env.local` frontend di Windows.

Contoh:

```bash
cat .env.stellar.local
```

Lalu di PowerShell Windows:

```powershell
notepad D:\project_yosua\stellar\warung-supplier-credit\.env.local
```

## 5. Generate Bindings dari Contract ID yang Sudah Ada

Jika contract sudah deploy dan Anda hanya ingin generate ulang bindings:

```bash
cd /mnt/d/project_yosua/stellar/warung-supplier-credit
export WSC_POOL_ESCROW_CONTRACT_ID="CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
bash scripts/stellar/generate-bindings.sh
```

Jika frontend Windows nanti ingin memasang binding package hasil generate sebagai dependency, jalankan di PowerShell Windows:

```powershell
cd D:\project_yosua\stellar\warung-supplier-credit
pnpm add file:./packages/pool_escrow
```

Jika memakai network selain default testnet:

```bash
export STELLAR_NETWORK="testnet"
export WSC_POOL_ESCROW_CONTRACT_ID="CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
bash scripts/stellar/generate-bindings.sh
```

## 6. Freighter Testnet di Windows

1. Install Freighter extension.
2. Pilih network `Testnet`.
3. Fund akun Testnet via Friendbot/Freighter.
4. Jalankan frontend di Windows.
5. Klik `Hubungkan` pada dashboard.

Yang masuk env:

- Contract ID/address contract: ya, masukkan ke `VITE_WSC_POOL_ESCROW_CONTRACT_ID`.
- RPC/Horizon URL: ya, masukkan ke env frontend.
- Nama wallet Stellar CLI: tidak untuk frontend; optional hanya di Ubuntu via `STELLAR_SOURCE_ACCOUNT`.
- Address public Freighter user: tidak perlu env; didapat saat user connect.
- Secret/private key/seed phrase: jangan pernah dimasukkan ke env frontend atau commit repo.

## 7. Verifikasi Akhir

Windows PowerShell:

```powershell
cd D:\project_yosua\stellar\warung-supplier-credit
pnpm run lint
pnpm run build
pnpm run dev
```

Ubuntu/WSL:

```bash
cd /mnt/d/project_yosua/stellar/warung-supplier-credit
stellar --version
stellar network ls
stellar keys ls
```

Pada dashboard frontend, cek:

- Freighter connected.
- Network match `Test SDF Network ; September 2015`.
- Contract link muncul jika `VITE_WSC_POOL_ESCROW_CONTRACT_ID` terisi.
- Admin > Stellar menampilkan explorer URL untuk transaction hash.
