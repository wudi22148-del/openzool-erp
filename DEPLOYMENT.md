# OpenZool ERP 部署指南

## 服务器要求
- Windows Server 2016 或更高版本
- 至少 4GB RAM
- 至少 20GB 可用磁盘空间
- 开放端口：80 (HTTP), 443 (HTTPS), 5432 (PostgreSQL)

## 部署步骤

### 1. 安装必要软件

#### 1.1 安装 Node.js (v20 LTS)
```powershell
# 下载并安装 Node.js
# 访问: https://nodejs.org/
# 下载 Windows Installer (.msi) 64-bit
# 安装后验证
node --version
npm --version
```

#### 1.2 安装 Git
```powershell
# 下载并安装 Git for Windows
# 访问: https://git-scm.com/download/win
# 安装后验证
git --version
```

#### 1.3 安装 PostgreSQL 16
```powershell
# 下载并安装 PostgreSQL
# 访问: https://www.postgresql.org/download/windows/
# 安装时设置密码（建议: postgres123）
# 安装后验证
psql --version
```

#### 1.4 安装 pnpm
```powershell
npm install -g pnpm
pnpm --version
```

### 2. 克隆项目

```powershell
# 创建项目目录
cd C:\
mkdir projects
cd projects

# 克隆项目
git clone https://github.com/wudi22148-del/openzool-erp.git
cd openzool-erp
```

### 3. 配置数据库

```powershell
# 连接到 PostgreSQL
psql -U postgres

# 创建数据库和用户
CREATE DATABASE openzool_erp;
CREATE USER erp_user WITH PASSWORD 'erp_password_2024';
GRANT ALL PRIVILEGES ON DATABASE openzool_erp TO erp_user;
\q
```

### 4. 安装依赖

```powershell
cd C:\projects\openzool-erp
pnpm install
```

### 5. 配置环境变量

创建 `apps/web-antd/.env.production` 文件：
```env
# 应用标题
VITE_APP_TITLE=OpenZool ERP

# API 地址（生产环境）
VITE_API_URL=http://你的服务器IP:5555

# 应用命名空间
VITE_APP_NAMESPACE=vben-web-antd

# Store 加密密钥
VITE_APP_STORE_SECURE_KEY=openzool-erp-secure-key-2024
```

### 6. 构建项目

```powershell
# 构建前端
cd C:\projects\openzool-erp
pnpm build

# 构建完成后，dist 目录包含前端静态文件
```

### 7. 安装 PM2（进程管理器）

```powershell
npm install -g pm2
npm install -g pm2-windows-service

# 安装 PM2 为 Windows 服务
pm2-service-install
```

### 8. 启动后端服务

```powershell
cd C:\projects\openzool-erp

# 使用 PM2 启动后端
pm2 start "pnpm run dev:mock" --name "openzool-erp-backend"

# 查看状态
pm2 status

# 查看日志
pm2 logs openzool-erp-backend

# 保存 PM2 配置
pm2 save
```

### 9. 配置 Nginx（可选，推荐）

如果使用 Nginx 作为反向代理：

下载 Nginx for Windows: http://nginx.org/en/download.html

配置文件 `nginx.conf`:
```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    # 前端静态文件
    location / {
        root C:/projects/openzool-erp/apps/web-antd/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:5555;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

启动 Nginx:
```powershell
cd C:\nginx
start nginx
```

### 10. 配置防火墙

```powershell
# 允许 HTTP 端口
netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=TCP localport=80

# 允许 HTTPS 端口
netsh advfirewall firewall add rule name="HTTPS" dir=in action=allow protocol=TCP localport=443

# 允许后端端口
netsh advfirewall firewall add rule name="ERP Backend" dir=in action=allow protocol=TCP localport=5555
```

## 访问系统

浏览器访问: `http://你的服务器IP`

默认账号:
- 用户名: vben
- 密码: 123456

## 常用命令

```powershell
# 查看服务状态
pm2 status

# 重启服务
pm2 restart openzool-erp-backend

# 停止服务
pm2 stop openzool-erp-backend

# 查看日志
pm2 logs openzool-erp-backend

# 清除日志
pm2 flush
```

## 故障排查

### 1. 端口被占用
```powershell
# 查看端口占用
netstat -ano | findstr :5555

# 结束进程
taskkill /PID 进程ID /F
```

### 2. 服务无法启动
```powershell
# 查看详细日志
pm2 logs openzool-erp-backend --lines 100
```

### 3. 前端无法访问后端
- 检查防火墙设置
- 检查 .env.production 中的 API 地址
- 检查后端服务是否正常运行

## 更新部署

```powershell
# 停止服务
pm2 stop openzool-erp-backend

# 拉取最新代码
cd C:\projects\openzool-erp
git pull

# 安装依赖
pnpm install

# 重新构建
pnpm build

# 重启服务
pm2 restart openzool-erp-backend
```

## 备份数据

```powershell
# 备份数据库
pg_dump -U erp_user -d openzool_erp > backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql

# 恢复数据库
psql -U erp_user -d openzool_erp < backup_20240101_120000.sql
```
