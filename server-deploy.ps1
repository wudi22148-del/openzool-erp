# OpenZool ERP 服务器部署脚本
# 请在服务器上以管理员身份运行此脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OpenZool ERP 服务器部署" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查管理员权限
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "错误: 请以管理员身份运行此脚本！" -ForegroundColor Red
    pause
    exit 1
}

# 2. 检查并安装 Git
Write-Host "[1/8] 检查 Git..." -ForegroundColor Yellow
$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
    Write-Host "Git 未安装，请先安装 Git: https://git-scm.com/download/win" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "✓ Git 已安装: $(git --version)" -ForegroundColor Green

# 3. 检查并安装 Node.js
Write-Host "`n[2/8] 检查 Node.js..." -ForegroundColor Yellow
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "Node.js 未安装，请先安装 Node.js: https://nodejs.org/" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "✓ Node.js 已安装: $(node --version)" -ForegroundColor Green

# 4. 创建项目目录
Write-Host "`n[3/8] 创建项目目录..." -ForegroundColor Yellow
if (!(Test-Path "C:\projects")) {
    New-Item -ItemType Directory -Path "C:\projects" | Out-Null
}
Set-Location "C:\projects"
Write-Host "✓ 项目目录已创建" -ForegroundColor Green

# 5. 克隆或更新项目
Write-Host "`n[4/8] 获取项目代码..." -ForegroundColor Yellow
if (Test-Path "openzool-erp") {
    Write-Host "项目已存在，正在更新..." -ForegroundColor Yellow
    Set-Location "openzool-erp"
    git pull
} else {
    Write-Host "正在克隆项目..." -ForegroundColor Yellow
    git clone https://github.com/wudi22148-del/openzool-erp.git
    Set-Location "openzool-erp"
}
Write-Host "✓ 项目代码已获取" -ForegroundColor Green

# 6. 安装 pnpm
Write-Host "`n[5/8] 安装 pnpm..." -ForegroundColor Yellow
$pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $pnpm) {
    npm install -g pnpm
}
Write-Host "✓ pnpm 已安装: $(pnpm --version)" -ForegroundColor Green

# 7. 安装依赖并构建
Write-Host "`n[6/8] 安装依赖..." -ForegroundColor Yellow
pnpm install
Write-Host "✓ 依赖安装完成" -ForegroundColor Green

Write-Host "`n[7/8] 构建前端..." -ForegroundColor Yellow
pnpm build
Write-Host "✓ 前端构建完成" -ForegroundColor Green

# 8. 安装并配置 PM2
Write-Host "`n[8/8] 配置服务..." -ForegroundColor Yellow
$pm2 = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2) {
    npm install -g pm2
}

# 停止旧服务
pm2 delete openzool-erp-backend -s 2>$null

# 启动后端服务
Set-Location "C:\projects\openzool-erp\apps\backend-mock"
pm2 start "pnpm start" --name "openzool-erp-backend"
pm2 save

Write-Host "✓ 后端服务已启动" -ForegroundColor Green

# 配置防火墙
Write-Host "`n配置防火墙..." -ForegroundColor Yellow
netsh advfirewall firewall delete rule name="OpenZool ERP Backend" 2>$null
netsh advfirewall firewall delete rule name="OpenZool ERP Frontend" 2>$null
netsh advfirewall firewall add rule name="OpenZool ERP Backend" dir=in action=allow protocol=TCP localport=3004 | Out-Null
netsh advfirewall firewall add rule name="OpenZool ERP Frontend" dir=in action=allow protocol=TCP localport=80 | Out-Null
Write-Host "✓ 防火墙配置完成" -ForegroundColor Green

# 完成
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  部署完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "服务信息:" -ForegroundColor Yellow
Write-Host "  后端 API: http://68.183.230.252:3004" -ForegroundColor White
Write-Host "  前端文件: C:\projects\openzool-erp\apps\web-antd\dist" -ForegroundColor White
Write-Host ""
Write-Host "查看服务状态:" -ForegroundColor Yellow
Write-Host "  pm2 status" -ForegroundColor White
Write-Host "  pm2 logs openzool-erp-backend" -ForegroundColor White
Write-Host ""
Write-Host "下一步:" -ForegroundColor Yellow
Write-Host "  1. 安装 Nginx 或配置 IIS 托管前端" -ForegroundColor White
Write-Host "  2. 访问 http://68.183.230.252 测试系统" -ForegroundColor White
Write-Host ""
Write-Host "默认登录账号:" -ForegroundColor Yellow
Write-Host "  用户名: vben" -ForegroundColor White
Write-Host "  密码: 123456" -ForegroundColor White
Write-Host ""

pause
