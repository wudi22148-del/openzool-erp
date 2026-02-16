# OpenZool ERP 部署脚本
$serverIP = "68.183.230.252"
$username = "Administrator"
$password = ConvertTo-SecureString "make0.0.0" -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential($username, $password)

Write-Host "正在连接到服务器 $serverIP ..." -ForegroundColor Green

# 测试连接
try {
    $session = New-PSSession -ComputerName $serverIP -Credential $credential -ErrorAction Stop
    Write-Host "连接成功！" -ForegroundColor Green

    # 检查系统信息
    Write-Host "`n检查服务器环境..." -ForegroundColor Yellow
    Invoke-Command -Session $session -ScriptBlock {
        Write-Host "操作系统: $((Get-WmiObject Win32_OperatingSystem).Caption)"
        Write-Host "系统版本: $((Get-WmiObject Win32_OperatingSystem).Version)"
        Write-Host "系统架构: $env:PROCESSOR_ARCHITECTURE"

        # 检查是否安装了必要的软件
        Write-Host "`n检查已安装软件..."
        $node = Get-Command node -ErrorAction SilentlyContinue
        if ($node) {
            Write-Host "Node.js: $(node --version)" -ForegroundColor Green
        } else {
            Write-Host "Node.js: 未安装" -ForegroundColor Red
        }

        $git = Get-Command git -ErrorAction SilentlyContinue
        if ($git) {
            Write-Host "Git: $(git --version)" -ForegroundColor Green
        } else {
            Write-Host "Git: 未安装" -ForegroundColor Red
        }

        $docker = Get-Command docker -ErrorAction SilentlyContinue
        if ($docker) {
            Write-Host "Docker: $(docker --version)" -ForegroundColor Green
        } else {
            Write-Host "Docker: 未安装" -ForegroundColor Red
        }
    }

    Remove-PSSession -Session $session
    Write-Host "`n环境检查完成！" -ForegroundColor Green

} catch {
    Write-Host "连接失败: $_" -ForegroundColor Red
    Write-Host "请检查:" -ForegroundColor Yellow
    Write-Host "1. 服务器是否开启了 PowerShell 远程管理 (Enable-PSRemoting)" -ForegroundColor Yellow
    Write-Host "2. 防火墙是否允许 WinRM (端口 5985/5986)" -ForegroundColor Yellow
    Write-Host "3. 网络连接是否正常" -ForegroundColor Yellow
}
