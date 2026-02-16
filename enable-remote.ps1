# Enable Remote Management on Server
# Run this ONCE on the server to enable remote deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Enable Remote Management" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Enable WinRM
Write-Host "[1/3] Enabling WinRM..." -ForegroundColor Yellow
Enable-PSRemoting -Force
Write-Host "OK" -ForegroundColor Green

# 2. Configure WinRM
Write-Host ""
Write-Host "[2/3] Configuring WinRM..." -ForegroundColor Yellow
Set-Item WSMan:\localhost\Client\TrustedHosts -Value "*" -Force
winrm set winrm/config/service/auth '@{Basic="true"}'
winrm set winrm/config/service '@{AllowUnencrypted="true"}'
Write-Host "OK" -ForegroundColor Green

# 3. Configure Firewall
Write-Host ""
Write-Host "[3/3] Configuring Firewall..." -ForegroundColor Yellow
netsh advfirewall firewall add rule name="WinRM HTTP" dir=in action=allow protocol=TCP localport=5985
netsh advfirewall firewall add rule name="WinRM HTTPS" dir=in action=allow protocol=TCP localport=5986
Write-Host "OK" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Remote Management Enabled!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Now you can deploy remotely from your local machine!" -ForegroundColor Yellow
Write-Host ""
