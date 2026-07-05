# PowerShell script to compile and optimize the Soroban Smart Contract
$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Compiling Soroban Rust Contract..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Navigate to contract directory
cd contracts/warung_supplier_credit

# Compile cargo target wasm32-unknown-unknown
cargo build --target wasm32-unknown-unknown --release

if ($LASTEXITCODE -ne 0) {
    Write-Error "Rust cargo compilation failed!"
    exit 1
}

Write-Host "Rust compilation succeeded! Target generated." -ForegroundColor Green
Write-Host "Optimizing contract wasm size using Stellar CLI..." -ForegroundColor Cyan

# Optimize wasm size for mainnet/testnet constraints
if (Get-Command stellar -ErrorAction SilentlyContinue) {
    stellar contract optimize --wasm target/wasm32-unknown-unknown/release/warung_supplier_credit.wasm
    Write-Host "Optimization successful: warung_supplier_credit.optimized.wasm generated!" -ForegroundColor Green
} else {
    Write-Host "Stellar CLI not found. Compilation output: target/wasm32-unknown-unknown/release/warung_supplier_credit.wasm" -ForegroundColor Yellow
}

cd ../..
Write-Host "Build contract process finished." -ForegroundColor Green
