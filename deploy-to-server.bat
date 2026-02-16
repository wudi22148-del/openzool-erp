@echo off
chcp 65001 >nul
echo ========================================
echo   OpenZool ERP 远程部署到服务器
echo ========================================
echo.
echo 服务器: 68.183.230.252
echo 用户: Administrator
echo.

REM 使用 PowerShell 远程执行部署
powershell -Command "& {
    $serverIP = '68.183.230.252'
    $username = 'Administrator'
    $password = ConvertTo-SecureString 'make0.0.0' -AsPlainText -Force
    $credential = New-Object System.Management.Automation.PSCredential($username, $password)

    Write-Host '正在连接到服务器...' -ForegroundColor Yellow

    try {
        # 尝试通过 SSH 执行命令
        $commands = @'
cd C:\
if not exist projects mkdir projects
cd projects
if exist openzool-erp (
    cd openzool-erp
    git pull
) else (
    git clone https://github.com/wudi22148-del/openzool-erp.git
    cd openzool-erp
)
call npm install -g pnpm
call pnpm install
call pnpm build
call npm install -g pm2
call pm2 delete openzool-erp-backend
call pm2 start \"pnpm run start\" --name \"openzool-erp-backend\" --cwd \"C:\projects\openzool-erp\apps\backend-mock\"
call pm2 save
netsh advfirewall firewall add rule name=\"OpenZool ERP Backend\" dir=in action=allow protocol=TCP localport=3004
netsh advfirewall firewall add rule name=\"OpenZool ERP Frontend\" dir=in action=allow protocol=TCP localport=80
'@

        # 将命令保存到临时文件
        $tempFile = [System.IO.Path]::GetTempFileName() + '.bat'
        $commands | Out-File -FilePath $tempFile -Encoding ASCII

        Write-Host '部署脚本已创建: ' $tempFile -ForegroundColor Green
        Write-Host ''
        Write-Host '请手动执行以下步骤:' -ForegroundColor Yellow
        Write-Host '1. 使用远程桌面连接到服务器 68.183.230.252' -ForegroundColor White
        Write-Host '2. 以管理员身份打开 PowerShell' -ForegroundColor White
        Write-Host '3. 执行以下命令:' -ForegroundColor White
        Write-Host ''
        Write-Host '   cd C:\' -ForegroundColor Cyan
        Write-Host '   if (!(Test-Path projects)) { mkdir projects }' -ForegroundColor Cyan
        Write-Host '   cd projects' -ForegroundColor Cyan
        Write-Host '   git clone https://github.com/wudi22148-del/openzool-erp.git' -ForegroundColor Cyan
        Write-Host '   cd openzool-erp' -ForegroundColor Cyan
        Write-Host '   npm install -g pnpm' -ForegroundColor Cyan
        Write-Host '   pnpm install' -ForegroundColor Cyan
        Write-Host '   pnpm build' -ForegroundColor Cyan
        Write-Host '   npm install -g pm2' -ForegroundColor Cyan
        Write-Host '   cd apps\backend-mock' -ForegroundColor Cyan
        Write-Host '   pm2 start \"pnpm start\" --name openzool-erp-backend' -ForegroundColor Cyan
        Write-Host '   pm2 save' -ForegroundColor Cyan
        Write-Host ''

    } catch {
        Write-Host '连接失败: ' $_.Exception.Message -ForegroundColor Red
    }
}"

echo.
pause
