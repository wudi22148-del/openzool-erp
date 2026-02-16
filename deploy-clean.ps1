# OpenZool ERP Clean Deploy Script
# Clean old build files and redeploy

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OpenZool ERP Clean Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# Set Node.js memory limit
$env:NODE_OPTIONS = "--max-old-space-size=8192"

# 1. Stop running services
Write-Host "[1/5] Stopping services..." -ForegroundColor Yellow
try {
    pm2 stop openzool-erp-backend 2>$null
    pm2 delete openzool-erp-backend 2>$null
    Write-Host "OK - Services stopped" -ForegroundColor Green
}
catch {
    Write-Host "SKIP - No running services" -ForegroundColor Yellow
}

# 2. Clean build files
Write-Host ""
Write-Host "[2/5] Cleaning build files..." -ForegroundColor Yellow
$distPath = "apps\web-antd\dist"
if (Test-Path $distPath) {
    Remove-Item -Path $distPath -Recurse -Force
    Write-Host "OK - Build files cleaned" -ForegroundColor Green
}
else {
    Write-Host "SKIP - No build files to clean" -ForegroundColor Yellow
}

# Clean node_modules in problematic packages
Write-Host ""
Write-Host "Cleaning problematic package caches..." -ForegroundColor Yellow
$packagesToClean = @(
    "packages\@core\ui-kit\layout-ui\node_modules",
    "packages\@core\ui-kit\layout-ui\.turbo"
)
foreach ($pkg in $packagesToClean) {
    if (Test-Path $pkg) {
        Remove-Item -Path $pkg -Recurse -Force
        Write-Host "Cleaned: $pkg" -ForegroundColor Gray
    }
}

# 3. Reinstall dependencies for problematic package
Write-Host ""
Write-Host "[3/5] Reinstalling dependencies..." -ForegroundColor Yellow
Set-Location "packages\@core\ui-kit\layout-ui"
pnpm install
Set-Location "..\..\..\..\"
Write-Host "OK - Dependencies reinstalled" -ForegroundColor Green

# 4. Build frontend with increased memory
Write-Host ""
Write-Host "[4/5] Building frontend (with 8GB memory limit)..." -ForegroundColor Yellow
$env:NODE_OPTIONS = "--max-old-space-size=8192"
pnpm build
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - Frontend build completed" -ForegroundColor Green
}
else {
    Write-Host "ERROR - Frontend build failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Trying alternative build method..." -ForegroundColor Yellow
    # Try building only web-antd
    pnpm --filter @vben/web-antd build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK - Alternative build succeeded" -ForegroundColor Green
    }
    else {
        Write-Host "ERROR - Build failed. Please check memory and try again" -ForegroundColor Red
        exit 1
    }
}

# 5. Start services
Write-Host ""
Write-Host "[5/5] Starting services..." -ForegroundColor Yellow
Set-Location apps\backend-mock
pm2 start "pnpm start" --name "openzool-erp-backend"
pm2 save
Set-Location ..\..
Write-Host "OK - Services started" -ForegroundColor Green

# Show service status
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploy Completed" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service Status:" -ForegroundColor Yellow
pm2 status

Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:5672" -ForegroundColor White
Write-Host "  Backend: http://localhost:3004" -ForegroundColor White
Write-Host ""
Write-Host "Default Login:" -ForegroundColor Yellow
Write-Host "  Username: vben" -ForegroundColor White
Write-Host "  Password: 123456" -ForegroundColor White
Write-Host ""
