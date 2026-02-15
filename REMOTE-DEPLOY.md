# 远程部署指南

## 方式一：使用提供的脚本（最简单）

### 步骤 1: 在服务器上添加 SSH 公钥（可选）

如果你想使用 SSH 密钥认证，在服务器上运行：

1. 将 `add-ssh-key.bat` 上传到服务器
2. 以管理员身份运行该脚本

### 步骤 2: 一键部署

1. 将 `deploy-server.bat` 上传到服务器
2. 以管理员身份运行该脚本
3. 等待部署完成

## 方式二：手动部署

### 1. 安装必要软件

#### 安装 Node.js
- 访问: https://nodejs.org/
- 下载 Windows Installer (.msi) 64-bit (v20 LTS)
- 安装并重启终端

#### 安装 Git
- 访问: https://git-scm.com/download/win
- 下载并安装

### 2. 克隆项目

打开 PowerShell（管理员）：

```powershell
# 创建项目目录
cd C:\
mkdir projects
cd projects

# 克隆项目
git clone https://github.com/wudi22148-del/openzool-erp.git
cd openzool-erp
```

### 3. 安装依赖

```powershell
# 安装 pnpm
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 4. 构建项目

```powershell
pnpm build
```

### 5. 安装 PM2

```powershell
npm install -g pm2
npm install -g pm2-windows-service
```

### 6. 启动服务

```powershell
# 启动后端
pm2 start "pnpm run dev:mock" --name "openzool-erp-backend"
pm2 save

# 查看状态
pm2 status
```

### 7. 配置防火墙

```powershell
# 允许后端端口
netsh advfirewall firewall add rule name="OpenZool ERP Backend" dir=in action=allow protocol=TCP localport=5555

# 允许前端端口
netsh advfirewall firewall add rule name="OpenZool ERP Frontend" dir=in action=allow protocol=TCP localport=80
```

### 8. 配置 Web 服务器

#### 选项 A: 使用 Nginx（推荐）

1. 下载 Nginx: http://nginx.org/en/download.html
2. 解压到 `C:\nginx`
3. 复制项目中的 `nginx.conf` 到 `C:\nginx\conf\`
4. 启动 Nginx:
   ```powershell
   cd C:\nginx
   start nginx
   ```

#### 选项 B: 使用 IIS

参考 `IIS-NGINX-GUIDE.md` 中的详细步骤

## 方式三：远程 PowerShell 部署（如果启用了 WinRM）

在本地电脑运行：

```powershell
# 配置信任主机（仅首次）
Set-Item WSMan:\localhost\Client\TrustedHosts -Value "68.183.230.252" -Force

# 创建凭据
$password = ConvertTo-SecureString "make0.0.0" -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential("Administrator", $password)

# 连接到服务器
$session = New-PSSession -ComputerName 68.183.230.252 -Credential $credential

# 在服务器上执行部署
Invoke-Command -Session $session -ScriptBlock {
    # 安装 Chocolatey（包管理器）
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

    # 安装软件
    choco install -y nodejs-lts git

    # 刷新环境变量
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    # 克隆项目
    cd C:\
    if (!(Test-Path "projects")) { mkdir projects }
    cd projects

    if (Test-Path "openzool-erp") {
        cd openzool-erp
        git pull
    } else {
        git clone https://github.com/wudi22148-del/openzool-erp.git
        cd openzool-erp
    }

    # 安装 pnpm
    npm install -g pnpm

    # 安装依赖
    pnpm install

    # 构建
    pnpm build

    # 安装 PM2
    npm install -g pm2

    # 启动服务
    pm2 delete openzool-erp-backend -s
    pm2 start "pnpm run dev:mock" --name "openzool-erp-backend"
    pm2 save

    # 配置防火墙
    netsh advfirewall firewall add rule name="OpenZool ERP Backend" dir=in action=allow protocol=TCP localport=5555
    netsh advfirewall firewall add rule name="OpenZool ERP Frontend" dir=in action=allow protocol=TCP localport=80
}

# 断开连接
Remove-PSSession $session
```

## 验证部署

1. 检查后端服务：
   ```powershell
   pm2 status
   pm2 logs openzool-erp-backend
   ```

2. 测试后端 API：
   - 浏览器访问: http://68.183.230.252:5555

3. 测试前端（如果配置了 Nginx/IIS）：
   - 浏览器访问: http://68.183.230.252

## 故障排查

### 问题 1: 无法连接到服务器
- 检查服务器防火墙设置
- 检查云服务商的安全组规则
- 确认服务器 IP 地址正确

### 问题 2: PM2 服务无法启动
```powershell
# 查看详细日志
pm2 logs openzool-erp-backend --lines 100

# 手动测试启动
cd C:\projects\openzool-erp
pnpm run dev:mock
```

### 问题 3: 端口被占用
```powershell
# 查看端口占用
netstat -ano | findstr :5555

# 结束进程
taskkill /PID 进程ID /F
```

## 下一步

1. 配置域名（可选）
2. 配置 SSL 证书（推荐）
3. 设置定期备份
4. 配置监控和告警

## 联系支持

如遇到问题，请提供：
- 错误日志（pm2 logs）
- 系统信息（systeminfo）
- 网络配置（ipconfig）
