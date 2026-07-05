# PowerShell script to deploy contract on Stellar Testnet and generate TypeScript bindings
$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Deploying Escrow Contract to Stellar Testnet" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Check if stellar CLI is installed
if (-not (Get-Command stellar -ErrorAction SilentlyContinue)) {
    Write-Error "Stellar CLI ('stellar') is not installed or not in System PATH. Please install it first."
    exit 1
}

# Source account (admin) details from environment or generate new
$adminSecret = $env:ADMIN_SECRET_KEY
if (-not $adminSecret) {
    Write-Host "ADMIN_SECRET_KEY environment variable is not set. Generating a new testnet wallet..." -ForegroundColor Yellow
    # Create a temporary wallet for deployment
    stellar keys generate deployer --network testnet
    $adminSecret = stellar keys show deployer
    Write-Host "Generated deployer key. Please save this secret key in your .env: $adminSecret" -ForegroundColor Green
} else {
    # Import existing secret key
    stellar keys add deployer --secret-key $adminSecret --overwrite --network testnet
}

$wasmPath = "contracts/warung_supplier_credit/target/wasm32-unknown-unknown/release/warung_supplier_credit.optimized.wasm"
if (-not (Test-Path $wasmPath)) {
    $wasmPath = "contracts/warung_supplier_credit/target/wasm32-unknown-unknown/release/warung_supplier_credit.wasm"
    if (-not (Test-Path $wasmPath)) {
        Write-Error "Contract WASM file not found. Run ./scripts/build-contract.ps1 first."
        exit 1
    }
}

# Deploy WASM
Write-Host "Uploading WASM code to testnet..." -ForegroundColor Cyan
$contractID = stellar contract deploy --wasm $wasmPath --source deployer --network testnet
Write-Host "Contract Deployed Successfully! ID: $contractID" -ForegroundColor Green

# Generate Bindings
Write-Host "Generating TypeScript bindings for React integration..." -ForegroundColor Cyan
stellar contract bindings typescript --wasm $wasmPath --output-dir packages/contract-bindings --id $contractID --network testnet --overwrite
Write-Host "TypeScript bindings created under: packages/contract-bindings/" -ForegroundColor Green

# Update .env example information
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Paste the Contract ID into your .env file: CONTRACT_ID=$contractID" -ForegroundColor Green
Write-Host "2. Copy the token/asset address you wish to use (e.g., native XLM contract or USDC mock) into: ASSET_CONTRACT_ID" -ForegroundColor Green
