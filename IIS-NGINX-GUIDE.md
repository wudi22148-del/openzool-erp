# OpenZool ERP - IIS 配置指南

## 使用 IIS 部署前端

### 1. 启用 IIS

```powershell
# 以管理员身份运行 PowerShell
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment
Enable-WindowsOptionalFeature -Online -FeatureName IIS-NetFxExtensibility45
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HealthAndDiagnostics
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpLogging
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Security
Enable-WindowsOptionalFeature -Online -FeatureName IIS-RequestFiltering
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Performance
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerManagementTools
Enable-WindowsOptionalFeature -Online -FeatureName IIS-StaticContent
Enable-WindowsOptionalFeature -Online -FeatureName IIS-DefaultDocument
Enable-WindowsOptionalFeature -Online -FeatureName IIS-DirectoryBrowsing
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpCompressionStatic
```

### 2. 安装 URL Rewrite 模块

下载并安装 URL Rewrite 模块:
https://www.iis.net/downloads/microsoft/url-rewrite

### 3. 安装 Application Request Routing (ARR)

下载并安装 ARR 模块（用于反向代理）:
https://www.iis.net/downloads/microsoft/application-request-routing

安装后，启用代理功能：
1. 打开 IIS 管理器
2. 选择服务器节点
3. 双击 "Application Request Routing Cache"
4. 点击右侧 "Server Proxy Settings"
5. 勾选 "Enable proxy"
6. 点击 "Apply"

### 4. 创建网站

```powershell
# 导入 IIS 模块
Import-Module WebAdministration

# 创建应用程序池
New-WebAppPool -Name "OpenZoolERP"
Set-ItemProperty IIS:\AppPools\OpenZoolERP -Name managedRuntimeVersion -Value ""

# 创建网站
New-Website -Name "OpenZoolERP" `
    -Port 80 `
    -PhysicalPath "C:\projects\openzool-erp\apps\web-antd\dist" `
    -ApplicationPool "OpenZoolERP"

# 启动网站
Start-Website -Name "OpenZoolERP"
```

### 5. 配置 web.config

在 `C:\projects\openzool-erp\apps\web-antd\dist` 目录下创建 `web.config` 文件：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <!-- URL Rewrite 规则 -->
        <rewrite>
            <rules>
                <!-- API 反向代理 -->
                <rule name="API Proxy" stopProcessing="true">
                    <match url="^api/(.*)" />
                    <action type="Rewrite" url="http://localhost:5555/api/{R:1}" />
                </rule>

                <!-- SPA 路由支持 -->
                <rule name="SPA Routes" stopProcessing="true">
                    <match url=".*" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="/" />
                </rule>
            </rules>
        </rewrite>

        <!-- 静态内容压缩 -->
        <urlCompression doStaticCompression="true" doDynamicCompression="true" />

        <!-- 静态文件缓存 -->
        <staticContent>
            <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
        </staticContent>

        <!-- MIME 类型 -->
        <staticContent>
            <mimeMap fileExtension=".json" mimeType="application/json" />
            <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
            <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
        </staticContent>

        <!-- 默认文档 -->
        <defaultDocument>
            <files>
                <clear />
                <add value="index.html" />
            </files>
        </defaultDocument>
    </system.webServer>
</configuration>
```

### 6. 配置防火墙

```powershell
# 允许 HTTP
netsh advfirewall firewall add rule name="IIS HTTP" dir=in action=allow protocol=TCP localport=80

# 允许 HTTPS（如果需要）
netsh advfirewall firewall add rule name="IIS HTTPS" dir=in action=allow protocol=TCP localport=443
```

### 7. 测试访问

打开浏览器访问: `http://你的服务器IP`

## 使用 Nginx 部署前端（推荐）

### 1. 下载 Nginx for Windows

访问: http://nginx.org/en/download.html
下载稳定版本（Stable version）

### 2. 解压并配置

```powershell
# 解压到 C:\nginx
Expand-Archive -Path nginx-*.zip -DestinationPath C:\

# 复制配置文件
Copy-Item "C:\projects\openzool-erp\nginx.conf" -Destination "C:\nginx\conf\nginx.conf" -Force
```

### 3. 启动 Nginx

```powershell
cd C:\nginx
start nginx

# 或者使用 PM2 管理
pm2 start nginx.exe --name "nginx"
```

### 4. 常用命令

```powershell
# 测试配置
nginx -t

# 重新加载配置
nginx -s reload

# 停止 Nginx
nginx -s stop

# 快速停止
nginx -s quit
```

### 5. 设置开机自启

```powershell
# 使用 PM2
pm2 startup
pm2 save

# 或者创建 Windows 服务
# 下载 NSSM: https://nssm.cc/download
nssm install nginx "C:\nginx\nginx.exe"
nssm start nginx
```

## 性能优化建议

### IIS 优化
1. 启用静态内容压缩
2. 配置输出缓存
3. 启用内核模式缓存
4. 调整应用程序池回收设置

### Nginx 优化
1. 调整 worker_processes 数量
2. 启用 gzip 压缩
3. 配置浏览器缓存
4. 使用 HTTP/2（需要 HTTPS）

## 故障排查

### IIS 问题
```powershell
# 查看 IIS 日志
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\*.log" -Tail 50

# 重启 IIS
iisreset
```

### Nginx 问题
```powershell
# 查看错误日志
Get-Content "C:\nginx\logs\error.log" -Tail 50

# 查看访问日志
Get-Content "C:\nginx\logs\access.log" -Tail 50
```

## SSL/HTTPS 配置（可选）

### 获取 SSL 证书
1. 使用 Let's Encrypt 免费证书
2. 购买商业证书
3. 使用自签名证书（仅测试）

### IIS SSL 配置
1. 在 IIS 管理器中导入证书
2. 为网站添加 HTTPS 绑定
3. 配置 HTTP 到 HTTPS 重定向

### Nginx SSL 配置
在 nginx.conf 中添加：
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate C:/nginx/ssl/cert.pem;
    ssl_certificate_key C:/nginx/ssl/key.pem;

    # ... 其他配置
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```
