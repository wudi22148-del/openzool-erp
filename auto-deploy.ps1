# Auto Deploy to Server from Local
# This script will automatically deploy to the server after enable-remote.ps1 is run

$serverIP = "68.183.230.252"
$username = "Administrator"
$password = ConvertTo-SecureString "make0.0.0" -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential($username, $password)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Auto Deploy to Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server: $serverIP" -ForegroundColor Yellow
Write-Host ""

# Configure trusted hosts
Write-Host "Configuring connection..." -ForegroundColor Yellow
Set-Item WSMan:\localhost\Client\TrustedHosts -Value $serverIP -Force -ErrorAction SilentlyContinue

Write-Host "Connecting to server..." -ForegroundColor Yellow

try {
    # Create remote session
    $session = New-PSSession -ComputerName $serverIP -Credential $credential -ErrorAction Stop

    Write-Host "Connected!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Deploying..." -ForegroundColor Yellow
    Write-Host ""

    # Execute deployment on server
    Invoke-Command -Session $session -ScriptBlock {
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  Server Deployment Started" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""

        # Download and run deployment script
        Set-Location C:\
        Invoke-WebRequest -Uri "https://raw.githubusercontent.com/wudi22148-del/openzool-erp/main/server-deploy.ps1" -OutFile "server-deploy.ps1"
        Set-ExecutionPolicy Bypass -Scope Process -Force
        & "C:\server-deploy.ps1"
    }

    Remove-PSSession -Session $session

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Deployment Completed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access URLs:" -ForegroundColor Yellow
    Write-Host "  Backend: http://$serverIP:3004" -ForegroundColor White
    Write-Host "  Frontend: http://$serverIP (after Nginx setup)" -ForegroundColor White
    Write-Host ""
    Write-Host "Default Login:" -ForegroundColor Yellow
    Write-Host "  Username: vben" -ForegroundColor White
    Write-Host "  Password: 123456" -ForegroundColor White
    Write-Host ""

}
catch {
    Write-Host ""
    Write-Host "Connection Failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please make sure you have run enable-remote.ps1 on the server first!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Steps:" -ForegroundColor Yellow
    Write-Host "1. Remote desktop to $serverIP" -ForegroundColor White
    Write-Host "2. Open PowerShell (Admin)" -ForegroundColor White
    Write-Host "3. Run:" -ForegroundColor White
    Write-Host "   cd C:\" -ForegroundColor Cyan
    Write-Host "   Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/wudi22148-del/openzool-erp/main/enable-remote.ps1' -OutFile 'enable-remote.ps1'" -ForegroundColor Cyan
    Write-Host "   .\enable-remote.ps1" -ForegroundColor Cyan
    Write-Host ""
}
