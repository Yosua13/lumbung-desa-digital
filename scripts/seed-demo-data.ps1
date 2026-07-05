# PowerShell script to verify database connectivity and explain automatic seeding
$ErrorActionPreference = "Continue"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Database Seeding and Verification" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

Write-Host "Note: The Go Backend API automatically runs schema migrations" -ForegroundColor Yellow
Write-Host "and seeds all demo data (products, users, active invoices)" -ForegroundColor Yellow
Write-Host "on start-up if the database is empty." -ForegroundColor Yellow

# Load Env
if (Test-Path ".env") {
    Get-Content ".env" | Foreach-Object {
        $name, $value = $_.split('=', 2)
        if ($name -and $value -and -not $name.StartsWith("#")) {
            [System.Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim())
        }
    }
}

$dbUrl = [System.Environment]::GetEnvironmentVariable("DATABASE_URL")
if (-not $dbUrl) {
    $dbUrl = "postgres://postgres:postgres@localhost:5432/lumbung_desa?sslmode=disable"
}

Write-Host "`nTesting connection to: $dbUrl ..." -ForegroundColor Cyan

# Test pg connection if psql CLI is available
if (Get-Command psql -ErrorAction SilentlyContinue) {
    psql $dbUrl -c "SELECT 'PostgreSQL Connection Successful!' AS status;"
} else {
    Write-Host "psql CLI not found. Start the Go Backend API using 'make run-backend' or 'go run apps/api/cmd/api/main.go'." -ForegroundColor Yellow
    Write-Host "The API server will connect, run migrations, and seed tables automatically." -ForegroundColor Green
}
