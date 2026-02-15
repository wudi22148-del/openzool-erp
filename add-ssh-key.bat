@echo off
chcp 65001 >nul
echo ========================================
echo   添加 SSH 公钥到服务器
echo ========================================
echo.

REM 创建 .ssh 目录
if not exist "%USERPROFILE%\.ssh" mkdir "%USERPROFILE%\.ssh"

REM 添加公钥到 authorized_keys
echo ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIINHw6Zk3v7pcJgAYlfVtSurNf1oUmFj//GQDiRpauvf your_email@example.com >> "%USERPROFILE%\.ssh\authorized_keys"

echo ✓ SSH 公钥已添加到 authorized_keys
echo.
echo 文件位置: %USERPROFILE%\.ssh\authorized_keys
echo.

REM 设置正确的权限
icacls "%USERPROFILE%\.ssh\authorized_keys" /inheritance:r
icacls "%USERPROFILE%\.ssh\authorized_keys" /grant:r "%USERNAME%:F"

echo ✓ 权限已设置
echo.
echo 现在可以使用 SSH 密钥连接到此服务器了
echo.
pause
