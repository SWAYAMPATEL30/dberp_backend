# PostgreSQL Database Setup Script for Skyprint ERP
# This script creates the local database for development

# Set PostgreSQL bin path temporarily for this session
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"

# Database configuration
$DB_NAME = "skyprint_erp"
$DB_USER = "postgres"
$DB_PASSWORD = "4218"

Write-Host "========================================"
Write-Host "  Skyprint ERP - Database Setup"
Write-Host "========================================"
Write-Host ""

# Set PGPASSWORD environment variable to avoid password prompt
$env:PGPASSWORD = $DB_PASSWORD

try {
    # Check if database already exists
    Write-Host "Checking if database exists..."
    $dbExists = & psql -U $DB_USER -lqt | Select-String -Pattern "^\s*$DB_NAME\s"
    
    if ($dbExists) {
        Write-Host "Database '$DB_NAME' already exists!"
    } else {
        # Create database
        Write-Host "Creating database: $DB_NAME"
        & psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[SUCCESS] Database created successfully!"
        } else {
            Write-Host "[ERROR] Failed to create database"
            exit 1
        }
    }
    
    Write-Host ""
    Write-Host "========================================"
    Write-Host "Database Setup Complete!"
    Write-Host "========================================"
    Write-Host ""
    Write-Host "Connection Details:"
    Write-Host "  Database: $DB_NAME"
    Write-Host "  User: $DB_USER"
    Write-Host "  Host: localhost"
    Write-Host "  Port: 5432"
    Write-Host ""
    Write-Host "Next Steps:"
    Write-Host "  1. Run: npx prisma migrate dev --name init"
    Write-Host "  2. Run: npx prisma db seed"
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] $_"
    exit 1
} finally {
    # Clear password from environment
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
