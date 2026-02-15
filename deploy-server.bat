@echo off
chcp 65001 >nul
echo ========================================
echo   OpenZool ERP 一键部署脚本
echo ========================================
echo.

REM 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 错误: 请以管理员身份运行此脚本！
    pause
    exit /b 1
)

echo [1/10] 检查 Node.js...
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo ✗ Node.js 未安装
    echo 请访问 https://nodejs.org/ 下载并安装 Node.js v20 LTS
    pause
    exit /b 1
)
node --version
echo ✓ Node.js 已安装

echo.
echo [2/10] 检查 Git...
where git >nul 2>&1
if %errorLevel% neq 0 (
    echo ✗ Git 未安装
    echo 请访问 https://git-scm.com/download/win 下载并安装 Git
    pause
    exit /b 1
)
git --version
echo ✓ Git 已安装

echo.
echo [3/10] 检查 pnpm...
where pnpm >nul 2>&1
if %errorLevel% neq 0 (
    echo 正在安装 pnpm...
    call npm install -g pnpm
)
pnpm --version
echo ✓ pnpm 已安装

echo.
echo [4/10] 创建项目目录...
if not exist "C:\projects" mkdir "C:\projects"
cd /d C:\projects
echo ✓ 项目目录已创建

echo.
echo [5/10] 克隆项目...
if exist "openzool-erp" (
    echo 项目已存在，正在更新...
    cd openzool-erp
    git pull
) else (
    echo 正在克隆项目...
    git clone https://github.com/wudi22148-del/openzool-erp.git
    cd openzool-erp
)
echo ✓ 项目代码已获取

echo.
echo [6/10] 安装依赖...
call pnpm install
echo ✓ 依赖安装完成

echo.
echo [7/10] 构建前端...
call pnpm build
echo ✓ 前端构建完成

echo.
echo [8/10] 安装 PM2...
where pm2 >nul 2>&1
if %errorLevel% neq 0 (
    echo 正在安装 PM2...
    call npm install -g pm2
    call npm install -g pm2-windows-service
)
pm2 --version
echo ✓ PM2 已安装

echo.
echo [9/10] 启动后端服务...
call pm2 delete openzool-erp-backend 2>nul
call pm2 start "pnpm run dev:mock" --name "openzool-erp-backend"
call pm2 save
echo ✓ 后端服务已启动

echo.
echo [10/10] 配置防火墙...
netsh advfirewall firewall delete rule name="OpenZool ERP Backend" 2>nul
netsh advfirewall firewall delete rule name="OpenZool ERP Frontend" 2>nul
netsh advfirewall firewall add rule name="OpenZool ERP Backend" dir=in action=allow protocol=TCP localport=5555
netsh advfirewall firewall add rule name="OpenZool ERP Frontend" dir=in action=allow protocol=TCP localport=80
echo ✓ 防火墙配置完成

echo.
echo ========================================
echo   部署完成！
echo ========================================
echo.
echo 服务信息:
echo   后端服务: http://localhost:5555
echo   前端文件: C:\projects\openzool-erp\apps\web-antd\dist
echo.
echo 常用命令:
echo   查看服务状态: pm2 status
echo   查看日志: pm2 logs openzool-erp-backend
echo   重启服务: pm2 restart openzool-erp-backend
echo   停止服务: pm2 stop openzool-erp-backend
echo.
echo 下一步:
echo   1. 安装 Nginx 或配置 IIS 来托管前端
echo   2. 访问 http://你的服务器IP 测试系统
echo.
echo 默认登录账号:
echo   用户名: vben
echo   密码: 123456
echo.
pause
