# Enable Remote Management on Server
# Run this ONCE on the server to enable remote deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Enable Remote Management" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Please run as Administrator!" -ForegroundColor Red
    pause
    exit 1
}

# 1. Enable WinRM
Write-Host "[1/4] Enabling WinRM..." -ForegroundColor Yellow
try {
    Enable-PSRemoting -Force -SkipNetworkProfileCheck
    Write-Host "OK" -ForegroundColor Green
}
catch {
    Write-Host "WARNING: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 2. Start WinRM Service
Write-Host ""
Write-Host "[2/4] Starting WinRM Service..." -ForegroundColor Yellow
Set-Service -Name WinRM -StartupType Automatic
Start-Service -Name WinRM
Write-Host "OK" -ForegroundColor Green

# 3. Configure WinRM
Write-Host ""
Write-Host "[3/4] Configuring WinRM..." -ForegroundColor Yellow
Set-Item WSMan:\localhost\Client\TrustedHosts -Value "*" -Force
winrm set winrm/config/service/auth '@{Basic="true"}'
winrm set winrm/config/service '@{AllowUnencrypted="true"}'
winrm set winrm/config/client '@{TrustedHosts="*"}'
Write-Host "OK" -ForegroundColor Green

# 4. Configure Firewall
Write-Host ""
Write-Host "[4/4] Configuring Firewall..." -ForegroundColor Yellow
netsh advfirewall firewall delete rule name="WinRM HTTP" 2>$null
netsh advfirewall firewall delete rule name="WinRM HTTPS" 2>$null
netsh advfirewall firewall add rule name="WinRM HTTP" dir=in action=allow protocol=TCP localport=5985
netsh advfirewall firewall add rule name="WinRM HTTPS" dir=in action=allow protocol=TCP localport=5986
Write-Host "OK" -ForegroundColor Green

# Test WinRM
Write-Host ""
Write-Host "Testing WinRM..." -ForegroundColor Yellow
$testResult = Test-WSMan -ComputerName localhost -ErrorAction SilentlyContinue
if ($testResult) {
    Write-Host "OK - WinRM is working!" -ForegroundColor Green
}
else {
    Write-Host "WARNING - WinRM test failed, but configuration is complete" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Remote Management Enabled!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Now you can deploy remotely from your local machine!" -ForegroundColor Yellow
Write-Host "Run auto-deploy.ps1 on your local computer." -ForegroundColor Yellow
Write-Host ""
pause
