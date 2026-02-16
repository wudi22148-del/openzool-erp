# 本地 PowerShell 远程部署脚本
# 在本地电脑上运行此脚本，将自动连接到服务器并部署

$serverIP = "68.183.230.252"
$username = "Administrator"
$password = ConvertTo-SecureString "make0.0.0" -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential($username, $password)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  远程部署 OpenZool ERP 到服务器" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "服务器: $serverIP" -ForegroundColor Yellow
Write-Host "用户: $username" -ForegroundColor Yellow
Write-Host ""

# 配置信任主机
Write-Host "配置信任主机..." -ForegroundColor Yellow
Set-Item WSMan:\localhost\Client\TrustedHosts -Value $serverIP -Force
Write-Host "OK" -ForegroundColor Green

Write-Host ""
Write-Host "正在连接到服务器..." -ForegroundColor Yellow

try {
    # 创建远程会话
    $session = New-PSSession -ComputerName $serverIP -Credential $credential

    Write-Host "OK - 连接成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "正在服务器上执行部署..." -ForegroundColor Yellow
    Write-Host ""

    # 在远程服务器上执行部署命令
    Invoke-Command -Session $session -ScriptBlock {
        Write-Host "开始部署..." -ForegroundColor Cyan

        # 下载部署脚本
        Write-Host "下载部署脚本..." -ForegroundColor Yellow
        Set-Location C:\
        Invoke-WebRequest -Uri "https://raw.githubusercontent.com/wudi22148-del/openzool-erp/main/server-deploy.ps1" -OutFile "server-deploy.ps1"
        Write-Host "OK" -ForegroundColor Green

        # 执行部署脚本
        Write-Host "执行部署..." -ForegroundColor Yellow
        Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
        & "C:\server-deploy.ps1"
    }

    # 关闭会话
    Remove-PSSession -Session $session

    Write-Host ""
    Write-Host "部署完成！" -ForegroundColor Green
    Write-Host "访问: http://$serverIP:3004" -ForegroundColor White

}
catch {
    Write-Host ""
    Write-Host "连接失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "请使用远程桌面手动部署:" -ForegroundColor Yellow
    Write-Host "  mstsc -> $serverIP" -ForegroundColor White
}
