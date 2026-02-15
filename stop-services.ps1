# OpenZool ERP 服务停止脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OpenZool ERP 服务停止" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 停止后端服务
Write-Host "[1/2] 停止后端服务..." -ForegroundColor Yellow
try {
    pm2 stop openzool-erp-backend
    Write-Host "✓ 后端服务已停止" -ForegroundColor Green
} catch {
    Write-Host "⚠ 后端服务停止失败或未运行" -ForegroundColor Yellow
}

# 停止 Nginx
Write-Host "`n[2/2] 停止 Nginx..." -ForegroundColor Yellow
if (Test-Path "C:\nginx\nginx.exe") {
    try {
        cd C:\nginx
        .\nginx.exe -s quit
        Write-Host "✓ Nginx 已停止" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Nginx 停止失败或未运行" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ Nginx 未安装，跳过" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  所有服务已停止" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
