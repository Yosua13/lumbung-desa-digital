# Soroban + Stellar Testnet Runbook

Runbook ini dijalankan dari Ubuntu/WSL, bukan PowerShell Windows, karena Rust target dan Stellar CLI paling stabil di Linux.

## 1. Setup Awal Ubuntu

```bash
cd /mnt/d/project_yosua/stellar/warung-supplier-credit
pnpm run contracts:setup:ubuntu
```

Script menjalankan:

```bash
sudo apt-get update
sudo apt-get install -y build-essential curl pkg-config libssl-dev
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
rustup update stable
rustup default stable
rustup target add wasm32v1-none
cargo install --locked stellar-cli
stellar network add --global testnet --rpc-url https://soroban-testnet.stellar.org --network-passphrase "Test SDF Network ; September 2015"
stellar keys generate --global wsc-testnet --network testnet
stellar keys fund wsc-testnet --network testnet
```

## 2. Build, Deploy, dan Generate Bindings

```bash
cd /mnt/d/project_yosua/stellar/warung-supplier-credit
pnpm run contracts:deploy:testnet
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

- `CONTRACT_ID`
- `packages/pool_escrow`
- `.env.stellar.local`

Salin nilai dari `.env.stellar.local` ke `.env` atau `.env.local` bila ingin mengaktifkan live Stellar mode.

## 3. Generate Bindings dari Contract ID yang Sudah Ada

```bash
export WSC_POOL_ESCROW_CONTRACT_ID="<CONTRACT_ID>"
pnpm run bindings:pool
pnpm add file:./packages/pool_escrow
```

## 4. Freighter Testnet

1. Install Freighter extension.
2. Pilih Stellar Testnet di Freighter.
3. Fund akun Testnet via Friendbot/Freighter.
4. Jalankan web app dan klik `Hubungkan` pada dashboard.

## 5. Verifikasi

```bash
pnpm install
pnpm run build
pnpm run dev
```

Pada dashboard, cek:

- Freighter connected.
- Network match `Test SDF Network ; September 2015`.
- Contract link muncul jika `VITE_WSC_POOL_ESCROW_CONTRACT_ID` terisi.
- Admin > Stellar menampilkan explorer URL untuk transaction hash.
