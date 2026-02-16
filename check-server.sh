#!/bin/bash

SERVER="68.183.230.252"
USER="Administrator"
PASS="make0.0.0"

echo "正在连接到服务器 $SERVER ..."

# 创建临时 SSH 配置
cat > /tmp/ssh_config_temp << EOF
Host target
    HostName $SERVER
    User $USER
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    PubkeyAuthentication no
    PasswordAuthentication yes
EOF

# 尝试连接并检查环境
echo "检查服务器环境..."
ssh -F /tmp/ssh_config_temp target "echo 连接成功 && ver && where node && where git && where docker" 2>&1

# 清理临时文件
rm -f /tmp/ssh_config_temp
