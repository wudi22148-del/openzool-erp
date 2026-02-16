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
try {
    Set-Item WSMan:\localhost\Client\TrustedHosts -Value $serverIP -Force -ErrorAction Stop
    Write-Host "✓ 信任主机配置完成" -ForegroundColor Green
} catch {
    Write-Host "⚠ 信任主机配置失败，尝试继续..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "正在连接到服务器..." -ForegroundColor Yellow

try {
    # 创建远程会话
    $session = New-PSSession -ComputerName $serverIP -Credential $credential -ErrorAction Stop

    Write-Host "✓ 连接成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "正在服务器上执行部署..." -ForegroundColor Yellow
    Write-Host ""

    # 在远程服务器上执行部署命令
    Invoke-Command -Session $session -ScriptBlock {
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  开始部署 OpenZool ERP" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""

        # 下载部署脚本
        Write-Host "[1/2] 下载部署脚本..." -ForegroundColor Yellow
        Set-Location C:\
        Invoke-WebRequest -Uri "https://raw.githubusercontent.com/wudi22148-del/openzool-erp/main/server-deploy.ps1" -OutFile "server-deploy.ps1"
        Write-Host "✓ 部署脚本已下载" -ForegroundColor Green

        # 设置执行策略并运行
        Write-Host ""
        Write-Host "[2/2] 执行部署脚本..." -ForegroundColor Yellow
        Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

        # 执行部署脚本
        & "C:\server-deploy.ps1"
    }

    # 关闭会话
    Remove-PSSession -Session $session

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  部署完成！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "访问地址:" -ForegroundColor Yellow
    Write-Host "  后端 API: http://$serverIP:3004" -ForegroundColor White
    Write-Host "  前端: http://$serverIP (需配置 Nginx/IIS)" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  连接失败" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "错误信息: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "可能的原因:" -ForegroundColor Yellow
    Write-Host "  1. 服务器未启用 PowerShell 远程管理 (WinRM)" -ForegroundColor White
    Write-Host "  2. 防火墙阻止了 WinRM 端口 (5985/5986)" -ForegroundColor White
    Write-Host "  3. 网络连接问题" -ForegroundColor White
    Write-Host ""
    Write-Host "解决方案:" -ForegroundColor Yellow
    Write-Host "  请使用远程桌面连接到服务器手动部署" -ForegroundColor White
    Write-Host "  1. 按 Win+R，输入 mstsc" -ForegroundColor White
    Write-Host "  2. 连接到: $serverIP" -ForegroundColor White
    Write-Host "  3. 在服务器上打开 PowerShell（管理员）" -ForegroundColor White
    Write-Host "  4. 执行以下命令:" -ForegroundColor White
    Write-Host ""
    Write-Host "     cd C:\" -ForegroundColor Cyan
    Write-Host "     Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/wudi22148-del/openzool-erp/main/server-deploy.ps1' -OutFile 'server-deploy.ps1'" -ForegroundColor Cyan
    Write-Host "     Set-ExecutionPolicy Bypass -Scope Process -Force" -ForegroundColor Cyan
    Write-Host "     .\server-deploy.ps1" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
