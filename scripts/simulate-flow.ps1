# PowerShell script to simulate the entire Warung Supplier Credit workflow
$ErrorActionPreference = "Stop"

$API_URL = "http://localhost:8080/api"

# Temporary wallet addresses for simulation
$warungWallet = "GDWARUNG" + (Get-Random -Minimum 100000 -Maximum 999999) + "0000000000000000000000000000000000000001"
$supplierWallet = "GBSUPPLIER" + (Get-Random -Minimum 100000 -Maximum 999999) + "000000000000000000000000000000000000001"
$funderWallet = "GBFUNDER" + (Get-Random -Minimum 100000 -Maximum 999999) + "0000000000000000000000000000000000000001"

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "   Starting Warung Supplier Credit End-to-End Workflow Simulation" -ForegroundColor Cyan
Write-Host "======================================================================`n" -ForegroundColor Cyan

# Check if server is running
try {
    $test = Invoke-RestMethod -Uri "$API_URL/products" -Method Get
    Write-Host "[OK] Connected to local API server." -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Could not connect to API server at $API_URL. Make sure your Go backend is running!" -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------------------------
# STEP 1: Connect and Link Wallets
# ------------------------------------------------------------------------------
Write-Host "`n[STEP 1] Connecting wallets and linking to Seeded Demo Profiles..." -ForegroundColor Yellow

# Link Warung
$linkWarung = Invoke-RestMethod -Uri "$API_URL/auth/link-demo-wallet" -Method Post -ContentType "application/json" -Body (ConvertFrom-JsonKey @{
    wallet_address = $warungWallet
    target_name = "Bu Sari"
})
Write-Host "-> Warung linked: $($linkWarung.user.name) (Wallet: $($linkWarung.user.wallet_address))" -ForegroundColor Gray

# Link Supplier
$linkSupplier = Invoke-RestMethod -Uri "$API_URL/auth/link-demo-wallet" -Method Post -ContentType "application/json" -Body (ConvertFrom-JsonKey @{
    wallet_address = $supplierWallet
    target_name = "Aneka Makmur Jaya"
})
Write-Host "-> Supplier linked: $($linkSupplier.user.name) (Wallet: $($linkSupplier.user.wallet_address))" -ForegroundColor Gray

# Link Funder
$linkFunder = Invoke-RestMethod -Uri "$API_URL/auth/link-demo-wallet" -Method Post -ContentType "application/json" -Body (ConvertFrom-JsonKey @{
    wallet_address = $funderWallet
    target_name = "Koperasi Mitra Sejahtera"
})
Write-Host "-> Funder linked: $($linkFunder.user.name) (Wallet: $($linkFunder.user.wallet_address))" -ForegroundColor Gray

# ------------------------------------------------------------------------------
# STEP 2: Create Credit Request
# ------------------------------------------------------------------------------
Write-Host "`n[STEP 2] Bu Sari (Warung) purchases stock from catalog on Credit..." -ForegroundColor Yellow
# Order: 2 units of Rojo Lele Rice (150,000 * 2 = 300,000)
$orderBody = @{
    supplier_id = 1
    items = @(
        @{ product_id = 1; quantity = 2 }
    )
}
$orderJson = $orderBody | ConvertTo-Json -Depth 5
$orderRes = Invoke-RestMethod -Uri "$API_URL/credit-requests" -Method Post -Headers @{ "X-Wallet-Address" = $warungWallet } -ContentType "application/json" -Body $orderJson
$requestID = $orderRes.request_id
Write-Host "-> Credit Request created. ID: $requestID, Total Amount: Rp300.000" -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 3: Supplier Approves Request
# ------------------------------------------------------------------------------
Write-Host "`n[STEP 3] Supplier approves order and creates Soroban Smart Contract Escrow..." -ForegroundColor Yellow
$approveRes = Invoke-RestMethod -Uri "$API_URL/supplier/requests/$requestID/approve" -Method Post -Headers @{ "X-Wallet-Address" = $supplierWallet }
$invoiceID = $approveRes.invoice_id
$onChainID = $approveRes.contract_invoice_id
Write-Host "-> Supplier approved credit request $requestID." -ForegroundColor Gray
Write-Host "-> Soroban Invoice Created. On-Chain Escrow ID: $onChainID" -ForegroundColor Green
Write-Host "-> Transaction Hash: $($approveRes.tx_hash)" -ForegroundColor Gray

# ------------------------------------------------------------------------------
# STEP 4: Funder Funds the Invoice
# ------------------------------------------------------------------------------
Write-Host "`n[STEP 4] Funder locks funds into the Soroban Escrow contract..." -ForegroundColor Yellow
# Submit empty body first to get unsigned XDR, then submit signed XDR
$fundPrep = Invoke-RestMethod -Uri "$API_URL/admin/invoices/$invoiceID/fund" -Method Post -Headers @{ "X-Wallet-Address" = $funderWallet } -ContentType "application/json" -Body "{}"
Write-Host "-> Unsigned XDR Prepared for Funder: $($fundPrep.unsigned_xdr.substring(0, 30))..." -ForegroundColor Gray

# Simulate client transaction submission
$fundRes = Invoke-RestMethod -Uri "$API_URL/admin/invoices/$invoiceID/fund" -Method Post -Headers @{ "X-Wallet-Address" = $funderWallet } -ContentType "application/json" -Body (ConvertFrom-JsonKey @{
    signed_xdr = "MOCK_SIGNED_XDR_DATA"
})
Write-Host "-> Funder funded escrow! Status: Funded" -ForegroundColor Green
Write-Host "-> Transaction Hash: $($fundRes.tx_hash)" -ForegroundColor Gray

# ------------------------------------------------------------------------------
# STEP 5: Supplier Marks as Shipped
# ------------------------------------------------------------------------------
Write-Host "`n[STEP 5] Supplier ships products to Warung..." -ForegroundColor Yellow
$shipRes = Invoke-RestMethod -Uri "$API_URL/supplier/invoices/$invoiceID/mark-shipped" -Method Post -Headers @{ "X-Wallet-Address" = $supplierWallet } -ContentType "application/json" -Body (ConvertFrom-JsonKey @{
    signed_xdr = "MOCK_SIGNED_XDR_DATA"
})
Write-Host "-> Invoice status updated to: Shipped" -ForegroundColor Green
Write-Host "-> Transaction Hash: $($shipRes.tx_hash)" -ForegroundColor Gray

# ------------------------------------------------------------------------------
# STEP 6: Warung Confirms Delivery (Releases Escrow)
# ------------------------------------------------------------------------------
Write-Host "`n[STEP 6] Bu Sari confirms delivery. Escrow funds released to Supplier..." -ForegroundColor Yellow
$deliverRes = Invoke-RestMethod -Uri "$API_URL/invoices/$invoiceID/confirm-delivery" -Method Post -Headers @{ "X-Wallet-Address" = $warungWallet } -ContentType "application/json" -Body (ConvertFrom-JsonKey @{
    signed_xdr = "MOCK_SIGNED_XDR_DATA"
})
Write-Host "-> Delivery confirmed! Escrow released to supplier." -ForegroundColor Green
Write-Host "-> Invoice status updated to: Repaying (Repayment schedule initialized)" -ForegroundColor Gray

# ------------------------------------------------------------------------------
# STEP 7: Warung Pays First Installment
# ------------------------------------------------------------------------------
Write-Host "`n[STEP 7] Bu Sari pays first installment (Rp60.000 of Rp300.000)..." -ForegroundColor Yellow
$payRes = Invoke-RestMethod -Uri "$API_URL/invoices/$invoiceID/pay-installment" -Method Post -Headers @{ "X-Wallet-Address" = $warungWallet } -ContentType "application/json" -Body (ConvertFrom-JsonKey @{
    amount = 60000
    signed_xdr = "MOCK_SIGNED_XDR_DATA"
})
Write-Host "-> Installment paid! Plafon restored. Reputation score increased." -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 8: Inspect Final Reputation & Plafon
# ------------------------------------------------------------------------------
Write-Host "`n[STEP 8] Fetching Bu Sari's updated dashboard details..." -ForegroundColor Yellow
$dash = Invoke-RestMethod -Uri "$API_URL/warung/dashboard" -Headers @{ "X-Wallet-Address" = $warungWallet } -Method Get
Write-Host "-> Plafon Limit: $($dash.credit_limit)" -ForegroundColor Gray
Write-Host "-> Plafon Available: $($dash.available_limit)" -ForegroundColor Green
Write-Host "-> Reputation Score: $($dash.reputation_score) / 1000" -ForegroundColor Green

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "   End-to-End Workflow Simulation Completed Successfully!" -ForegroundColor Green
Write-Host "======================================================================`n" -ForegroundColor Cyan

# Utility helper to serialize simple key-value hash map
function ConvertFrom-JsonKey($hashtable) {
    return $hashtable | ConvertTo-Json -Compress
}
