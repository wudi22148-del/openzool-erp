# OpenZool ERP 自动部署脚本
# 在服务器上以管理员身份运行此脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OpenZool ERP 自动部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置错误处理
$ErrorActionPreference = "Stop"

# 配置变量
$projectDir = "C:\projects\openzool-erp"
$backendPort = 5555
$frontendPort = 80

# 1. 检查管理员权限
Write-Host "[1/10] 检查管理员权限..." -ForegroundColor Yellow
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "错误: 请以管理员身份运行此脚本！" -ForegroundColor Red
    exit 1
}
Write-Host "✓ 管理员权限确认" -ForegroundColor Green

# 2. 检查 Node.js
Write-Host "`n[2/10] 检查 Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js 已安装: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js 未安装" -ForegroundColor Red
    Write-Host "请访问 https://nodejs.org/ 下载并安装 Node.js v20 LTS" -ForegroundColor Yellow
    exit 1
}

# 3. 检查 Git
Write-Host "`n[3/10] 检查 Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✓ Git 已安装: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git 未安装" -ForegroundColor Red
    Write-Host "请访问 https://git-scm.com/download/win 下载并安装 Git" -ForegroundColor Yellow
    exit 1
}

# 4. 安装 pnpm
Write-Host "`n[4/10] 检查 pnpm..." -ForegroundColor Yellow
try {
    $pnpmVersion = pnpm --version
    Write-Host "✓ pnpm 已安装: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "正在安装 pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    Write-Host "✓ pnpm 安装完成" -ForegroundColor Green
}

# 5. 克隆或更新项目
Write-Host "`n[5/10] 获取项目代码..." -ForegroundColor Yellow
if (Test-Path $projectDir) {
    Write-Host "项目目录已存在，正在更新..." -ForegroundColor Yellow
    cd $projectDir
    git pull
    Write-Host "✓ 代码更新完成" -ForegroundColor Green
} else {
    Write-Host "正在克隆项目..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "C:\projects" -Force | Out-Null
    cd C:\projects
    git clone https://github.com/wudi22148-del/openzool-erp.git
    Write-Host "✓ 项目克隆完成" -ForegroundColor Green
}

# 6. 安装依赖
Write-Host "`n[6/10] 安装项目依赖..." -ForegroundColor Yellow
cd $projectDir
pnpm install
Write-Host "✓ 依赖安装完成" -ForegroundColor Green

# 7. 构建前端
Write-Host "`n[7/10] 构建前端项目..." -ForegroundColor Yellow
pnpm build
Write-Host "✓ 前端构建完成" -ForegroundColor Green

# 8. 安装 PM2
Write-Host "`n[8/10] 检查 PM2..." -ForegroundColor Yellow
try {
    $pm2Version = pm2 --version
    Write-Host "✓ PM2 已安装: $pm2Version" -ForegroundColor Green
} catch {
    Write-Host "正在安装 PM2..." -ForegroundColor Yellow
    npm install -g pm2
    npm install -g pm2-windows-service
    Write-Host "✓ PM2 安装完成" -ForegroundColor Green
}

# 9. 启动后端服务
Write-Host "`n[9/10] 启动后端服务..." -ForegroundColor Yellow
cd $projectDir

# 停止旧服务（如果存在）
pm2 delete openzool-erp-backend -s 2>$null

# 启动新服务
pm2 start "pnpm run dev:mock" --name "openzool-erp-backend"
pm2 save

Write-Host "✓ 后端服务启动完成" -ForegroundColor Green

# 10. 配置防火墙
Write-Host "`n[10/10] 配置防火墙..." -ForegroundColor Yellow
try {
    # 删除旧规则（如果存在）
    netsh advfirewall firewall delete rule name="OpenZool ERP Backend" 2>$null
    netsh advfirewall firewall delete rule name="OpenZool ERP Frontend" 2>$null

    # 添加新规则
    netsh advfirewall firewall add rule name="OpenZool ERP Backend" dir=in action=allow protocol=TCP localport=$backendPort | Out-Null
    netsh advfirewall firewall add rule name="OpenZool ERP Frontend" dir=in action=allow protocol=TCP localport=$frontendPort | Out-Null

    Write-Host "✓ 防火墙配置完成" -ForegroundColor Green
} catch {
    Write-Host "⚠ 防火墙配置失败，请手动配置" -ForegroundColor Yellow
}

# 完成
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  部署完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "服务信息:" -ForegroundColor Yellow
Write-Host "  后端服务: http://localhost:$backendPort" -ForegroundColor White
Write-Host "  前端文件: $projectDir\apps\web-antd\dist" -ForegroundColor White
Write-Host ""
Write-Host "常用命令:" -ForegroundColor Yellow
Write-Host "  查看服务状态: pm2 status" -ForegroundColor White
Write-Host "  查看日志: pm2 logs openzool-erp-backend" -ForegroundColor White
Write-Host "  重启服务: pm2 restart openzool-erp-backend" -ForegroundColor White
Write-Host "  停止服务: pm2 stop openzool-erp-backend" -ForegroundColor White
Write-Host ""
Write-Host "下一步:" -ForegroundColor Yellow
Write-Host "  1. 安装 Nginx 或 IIS 来托管前端静态文件" -ForegroundColor White
Write-Host "  2. 配置反向代理指向后端服务" -ForegroundColor White
Write-Host "  3. 访问 http://你的服务器IP 测试系统" -ForegroundColor White
Write-Host ""
Write-Host "默认登录账号:" -ForegroundColor Yellow
Write-Host "  用户名: vben" -ForegroundColor White
Write-Host "  密码: 123456" -ForegroundColor White
Write-Host ""
