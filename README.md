# OpenZool ERP

一个现代化的企业资源规划（ERP）系统，基于 Vue 3、Vite、TypeScript 和 Ant Design 构建。

## 功能模块

### 已实现功能
- ✅ **产品管理**: CRUD 操作、批量导入、负责人筛选
- ✅ **销售统计**: 动态日期列、订单/数量模式切换、趋势图表
- ✅ **库存管理**: 概览、出入库流水、仓库管理、库存预警（UI）
- ✅ **利润分析**: 仪表板、订单利润、成本设置、分摊管理（UI）
- ✅ **用户管理**: 用户列表和权限管理（UI）

### 技术特性
- 基于订单编号的订单数量计算（按比例分配）
- Excel 导入/导出，支持订单编号
- 分页配置：30/50/200/500 条/页
- 总销量和汇总行四舍五入显示
- 销售数据备注功能

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI 组件**: Ant Design Vue
- **表格组件**: VXE Table
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP 客户端**: Axios
- **图表**: ECharts
- **包管理器**: pnpm

## 系统要求

### 开发环境
- Node.js >= 20.x
- pnpm >= 8.x
- Git

### 生产环境（Windows Server）
- Windows Server 2016 或更高版本
- 至少 4GB RAM
- 至少 20GB 可用磁盘空间
- Node.js 20 LTS
- PostgreSQL 16（推荐）或使用内存存储

## 快速开始

### 本地开发

```bash
# 克隆项目
git clone https://github.com/wudi22148-del/openzool-erp.git
cd openzool-erp

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 访问 http://localhost:5173
```

### 生产部署

#### 方式一：自动部署（推荐）

1. 将项目文件上传到服务器
2. 以管理员身份运行 PowerShell
3. 执行部署脚本：

```powershell
cd C:\path\to\openzool-erp
.\deploy-server.ps1
```

#### 方式二：手动部署

详细步骤请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 服务管理

### 启动服务
```powershell
.\start-services.ps1
```

### 停止服务
```powershell
.\stop-services.ps1
```

### 查看服务状态
```powershell
pm2 status
```

### 查看日志
```powershell
pm2 logs openzool-erp-backend
```

## 默认账号

- **用户名**: vben
- **密码**: 123456

## 项目结构

```
openzool-erp/
├── apps/
│   ├── web-antd/              # 前端应用
│   │   ├── src/
│   │   │   ├── api/           # API 接口
│   │   │   ├── views/         # 页面组件
│   │   │   │   └── erp/       # ERP 模块
│   │   │   ├── router/        # 路由配置
│   │   │   └── utils/         # 工具函数
│   │   └── dist/              # 构建输出
│   └── backend-mock/          # Mock 后端
│       └── api/
│           ├── product/       # 产品 API
│           └── sales/         # 销售 API
├── packages/                  # 共享包
├── deploy-server.ps1          # 自动部署脚本
├── start-services.ps1         # 启动服务脚本
├── stop-services.ps1          # 停止服务脚本
├── nginx.conf                 # Nginx 配置
├── DEPLOYMENT.md              # 详细部署文档
└── IIS-NGINX-GUIDE.md         # IIS/Nginx 配置指南
```

## 配置文件

### 环境变量

开发环境 `.env`:
```env
VITE_APP_TITLE=OpenZool ERP
VITE_APP_NAMESPACE=vben-web-antd
```

生产环境 `.env.production`:
```env
VITE_APP_TITLE=OpenZool ERP
VITE_API_URL=http://你的服务器IP:5555
VITE_APP_NAMESPACE=vben-web-antd
```

## 数据存储

当前版本使用**内存存储**（Mock 数据），数据在服务器重启后会丢失。

### 升级到数据库

推荐使用 PostgreSQL：
1. 安装 PostgreSQL 16
2. 创建数据库和用户
3. 配置数据库连接
4. 迁移数据模型

详细步骤请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 常见问题

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

## 开发指南

### 添加新模块

1. 在 `apps/web-antd/src/views/erp/` 创建模块目录
2. 在 `apps/web-antd/src/router/routes/modules/` 添加路由配置
3. 在 `apps/web-antd/src/api/core/` 添加 API 接口
4. 在 `apps/backend-mock/api/` 添加 Mock 数据

### 代码规范

- 使用 TypeScript
- 遵循 Vue 3 Composition API
- 使用 ESLint 和 Prettier
- 提交前运行 `pnpm lint`

## 性能优化

- 启用 Gzip 压缩
- 配置浏览器缓存
- 使用 CDN 加速静态资源
- 启用 HTTP/2
- 数据库查询优化

## 安全建议

- 修改默认密码
- 启用 HTTPS
- 配置 CORS
- 定期备份数据
- 更新依赖包

## 备份与恢复

### 备份数据
```powershell
# 如果使用 PostgreSQL
pg_dump -U erp_user -d openzool_erp > backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql
```

### 恢复数据
```powershell
psql -U erp_user -d openzool_erp < backup_20240101_120000.sql
```

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目基于 MIT 许可证开源。

## 联系方式

- GitHub: https://github.com/wudi22148-del/openzool-erp
- Issues: https://github.com/wudi22148-del/openzool-erp/issues

## 致谢

本项目基于 [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) 构建。

---

**OpenZool ERP** - 让企业管理更简单
