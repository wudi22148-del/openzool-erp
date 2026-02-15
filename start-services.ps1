# OpenZool ERP 快速启动脚本
# 用于启动所有服务

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OpenZool ERP 服务启动" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectDir = "C:\projects\openzool-erp"

# 检查项目目录
if (-not (Test-Path $projectDir)) {
    Write-Host "错误: 项目目录不存在: $projectDir" -ForegroundColor Red
    Write-Host "请先运行 deploy-server.ps1 进行部署" -ForegroundColor Yellow
    exit 1
}

# 启动后端服务
Write-Host "[1/2] 启动后端服务..." -ForegroundColor Yellow
cd $projectDir

try {
    # 检查服务是否已运行
    $status = pm2 list | Select-String "openzool-erp-backend"

    if ($status -match "online") {
        Write-Host "后端服务已在运行中" -ForegroundColor Green
        pm2 restart openzool-erp-backend
        Write-Host "✓ 后端服务已重启" -ForegroundColor Green
    } else {
        pm2 start "pnpm run dev:mock" --name "openzool-erp-backend"
        pm2 save
        Write-Host "✓ 后端服务已启动" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ 后端服务启动失败: $_" -ForegroundColor Red
    exit 1
}

# 启动 Nginx（如果已安装）
Write-Host "`n[2/2] 检查 Nginx..." -ForegroundColor Yellow
if (Test-Path "C:\nginx\nginx.exe") {
    try {
        # 检查 Nginx 是否运行
        $nginxProcess = Get-Process nginx -ErrorAction SilentlyContinue

        if ($nginxProcess) {
            Write-Host "Nginx 已在运行中" -ForegroundColor Green
            cd C:\nginx
            .\nginx.exe -s reload
            Write-Host "✓ Nginx 配置已重新加载" -ForegroundColor Green
        } else {
            cd C:\nginx
            Start-Process nginx.exe -WindowStyle Hidden
            Write-Host "✓ Nginx 已启动" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠ Nginx 启动失败: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ Nginx 未安装，跳过" -ForegroundColor Yellow
    Write-Host "  提示: 可以使用 IIS 或手动安装 Nginx" -ForegroundColor Gray
}

# 显示服务状态
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  服务状态" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

pm2 list

Write-Host "`n访问地址:" -ForegroundColor Yellow
Write-Host "  前端: http://localhost" -ForegroundColor White
Write-Host "  后端: http://localhost:5555" -ForegroundColor White
Write-Host ""
Write-Host "默认账号:" -ForegroundColor Yellow
Write-Host "  用户名: vben" -ForegroundColor White
Write-Host "  密码: 123456" -ForegroundColor White
Write-Host ""
