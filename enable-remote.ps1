# Enable Remote Management on Server - Simple Version
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

# 1. Start WinRM Service
Write-Host "[1/5] Starting WinRM Service..." -ForegroundColor Yellow
try {
    Set-Service -Name WinRM -StartupType Automatic -ErrorAction Stop
    Start-Service -Name WinRM -ErrorAction Stop
    Write-Host "OK" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    pause
    exit 1
}

# 2. Configure WinRM Listener
Write-Host ""
Write-Host "[2/5] Configuring WinRM Listener..." -ForegroundColor Yellow
winrm quickconfig -quiet -force
Write-Host "OK" -ForegroundColor Green

# 3. Configure Authentication
Write-Host ""
Write-Host "[3/5] Configuring Authentication..." -ForegroundColor Yellow
winrm set winrm/config/service/auth '@{Basic="true"}'
winrm set winrm/config/service '@{AllowUnencrypted="true"}'
winrm set winrm/config/client '@{TrustedHosts="*"}'
Set-Item WSMan:\localhost\Client\TrustedHosts -Value "*" -Force
Write-Host "OK" -ForegroundColor Green

# 4. Configure Firewall
Write-Host ""
Write-Host "[4/5] Configuring Firewall..." -ForegroundColor Yellow
netsh advfirewall firewall delete rule name="WinRM HTTP" 2>$null
netsh advfirewall firewall delete rule name="WinRM HTTPS" 2>$null
netsh advfirewall firewall add rule name="WinRM HTTP" dir=in action=allow protocol=TCP localport=5985 | Out-Null
netsh advfirewall firewall add rule name="WinRM HTTPS" dir=in action=allow protocol=TCP localport=5986 | Out-Null
Write-Host "OK" -ForegroundColor Green

# 5. Test WinRM
Write-Host ""
Write-Host "[5/5] Testing WinRM..." -ForegroundColor Yellow
try {
    $testResult = Test-WSMan -ComputerName localhost -ErrorAction Stop
    Write-Host "OK - WinRM is working!" -ForegroundColor Green
}
catch {
    Write-Host "WARNING - Test failed but configuration is complete" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Remote Management Enabled!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Server is ready for remote deployment!" -ForegroundColor Yellow
Write-Host "Run auto-deploy.ps1 on your local computer." -ForegroundColor Yellow
Write-Host ""
pause
