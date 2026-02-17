# OpenZool ERP Deploy Script for Windows
# Upload built frontend to Ubuntu server via SCP

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OpenZool ERP Deploy to Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Configuration
$serverIP = "68.183.230.252"
$serverUser = "root"
$serverPassword = "make0.0.0"
$projectRoot = $PSScriptRoot
$distPath = "$projectRoot\apps\web-antd\dist"
$distZip = "$projectRoot\apps\web-antd\dist.zip"

# Check if dist exists
if (-not (Test-Path $distPath)) {
    Write-Host "ERROR: Build output not found at $distPath" -ForegroundColor Red
    Write-Host "Please run build.ps1 first!" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/4] Preparing deployment package..." -ForegroundColor Yellow

# Create zip if not exists
if (-not (Test-Path $distZip)) {
    Write-Host "Creating dist.zip..." -ForegroundColor Gray
    Compress-Archive -Path "$distPath\*" -DestinationPath $distZip -Force
}

$zipSize = (Get-Item $distZip).Length / 1MB
Write-Host "OK - Package ready: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Green

Write-Host ""
Write-Host "[2/4] Uploading to server..." -ForegroundColor Yellow
Write-Host "Server: $serverIP" -ForegroundColor Gray

# Use pscp (PuTTY SCP) if available, otherwise use WinSCP or manual instructions
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"

if (Test-Path $pscpPath) {
    # Upload using pscp (with -batch to auto-accept host key)
    & $pscpPath -batch -pw $serverPassword $distZip "${serverUser}@${serverIP}:/tmp/dist.zip"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Upload failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "OK - Upload completed" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "PuTTY pscp not found. Please upload manually:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Install PuTTY and run this script again" -ForegroundColor White
    Write-Host "  Download: https://www.putty.org/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Option 2: Use WinSCP to upload:" -ForegroundColor White
    Write-Host "  1. Open WinSCP" -ForegroundColor Gray
    Write-Host "  2. Connect to: $serverIP (user: $serverUser)" -ForegroundColor Gray
    Write-Host "  3. Upload: $distZip" -ForegroundColor Gray
    Write-Host "  4. To: /tmp/dist.zip" -ForegroundColor Gray
    Write-Host ""
    Write-Host "After upload, run these commands on server:" -ForegroundColor Yellow
    Write-Host "  cd /var/www/openzool-erp" -ForegroundColor Cyan
    Write-Host "  unzip -o /tmp/dist.zip" -ForegroundColor Cyan
    Write-Host "  rm /tmp/dist.zip" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "[3/4] Extracting files on server..." -ForegroundColor Yellow

# Use plink (PuTTY) to execute commands on server
$plinkPath = "C:\Program Files\PuTTY\plink.exe"

if (Test-Path $plinkPath) {
    $commands = @"
cd /var/www/openzool-erp
unzip -o /tmp/dist.zip
rm /tmp/dist.zip
chown -R www-data:www-data /var/www/openzool-erp
"@

    $commands | & $plinkPath -batch -pw $serverPassword "${serverUser}@${serverIP}"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Extraction failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "OK - Files extracted" -ForegroundColor Green
} else {
    Write-Host "SKIP - Please run commands manually (see above)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[4/4] Configuring Nginx..." -ForegroundColor Yellow

$nginxConfig = @"
server {
    listen 80;
    server_name zoolco.com www.zoolco.com 68.183.230.252;

    root /var/www/openzool-erp;
    index index.html;

    # Frontend
    location / {
        try_files `$uri `$uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:5320/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_cache_bypass `$http_upgrade;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
"@

# Save nginx config locally
$nginxConfigPath = "$projectRoot\nginx-openzool.conf"
$nginxConfig | Out-File -FilePath $nginxConfigPath -Encoding UTF8

Write-Host "Nginx config saved to: $nginxConfigPath" -ForegroundColor Gray

if (Test-Path $plinkPath) {
    # Upload and apply nginx config
    & $pscpPath -pw $serverPassword $nginxConfigPath "${serverUser}@${serverIP}:/etc/nginx/sites-available/openzool-erp"

    $nginxCommands = @"
ln -sf /etc/nginx/sites-available/openzool-erp /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
"@

    $nginxCommands | & $plinkPath -batch -pw $serverPassword "${serverUser}@${serverIP}"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK - Nginx configured and reloaded" -ForegroundColor Green
    } else {
        Write-Host "WARNING - Nginx configuration may have issues" -ForegroundColor Yellow
    }
} else {
    Write-Host "SKIP - Please configure Nginx manually" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run on server:" -ForegroundColor Yellow
    Write-Host "  nano /etc/nginx/sites-available/openzool-erp" -ForegroundColor Cyan
    Write-Host "  (paste the config from $nginxConfigPath)" -ForegroundColor Gray
    Write-Host "  ln -sf /etc/nginx/sites-available/openzool-erp /etc/nginx/sites-enabled/" -ForegroundColor Cyan
    Write-Host "  nginx -t && systemctl reload nginx" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deployment Completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application:" -ForegroundColor Yellow
Write-Host "  Frontend: http://zoolco.com" -ForegroundColor White
Write-Host "  Backend API: http://zoolco.com/api" -ForegroundColor White
Write-Host ""
Write-Host "Default Login:" -ForegroundColor Yellow
Write-Host "  Username: vben" -ForegroundColor White
Write-Host "  Password: 123456" -ForegroundColor White
Write-Host ""
