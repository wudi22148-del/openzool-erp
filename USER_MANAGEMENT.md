# 用户管理模块开发完成

## 功能概述

已成功实现用户管理模块，包含三种角色权限：

### 角色定义

1. **管理员 (admin)**
   - 拥有所有权限
   - 可以访问用户管理模块
   - 可以查看和管理所有数据

2. **主管 (supervisor)**
   - 可以使用所有功能模块
   - 可以访问用户管理模块
   - 可以查看和管理所有数据
   - 与管理员权限相同

3. **运营 (operator)**
   - 不能访问用户管理模块
   - 只能查看自己管理的产品数据
   - 只能查看自己管理的销售数据
   - 必须指定管理人名称

## 已实现功能

### 后端 API

1. **用户数据库表** (`users`)
   - 字段：id, username, password, real_name, email, phone, role, manager_name, status
   - 角色约束：admin, supervisor, operator
   - 状态约束：active, inactive

2. **用户管理 API**
   - `GET /api/users/list` - 获取用户列表（支持分页、搜索、筛选）
   - `GET /api/users/:id` - 获取用户详情
   - `POST /api/users/create` - 创建用户
   - `PUT /api/users/:id` - 更新用户
   - `DELETE /api/users/:id` - 删除用户

3. **权限控制**
   - 用户管理模块访问控制（仅管理员和主管可访问）
   - 数据过滤：运营角色只能看到自己管理的数据
   - 登录验证：支持数据库用户登录

4. **数据过滤**
   - 产品列表 API：根据用户角色自动过滤数据
   - 销售统计 API：根据用户角色自动过滤数据

### 前端页面

1. **用户管理页面** (`/user`)
   - 用户列表展示（表格）
   - 搜索筛选（关键词、角色、状态）
   - 新增用户（弹窗表单）
   - 编辑用户（弹窗表单）
   - 删除用户（确认对话框）
   - 角色标签显示（不同颜色）
   - 状态标签显示

2. **表单验证**
   - 必填项验证
   - 运营角色必须指定管理人
   - 用户名唯一性验证

## 数据库初始化

默认管理员账号：
- 用户名：admin
- 密码：123456
- 角色：管理员

## 使用说明

### 创建用户

1. 登录管理员或主管账号
2. 进入用户管理页面
3. 点击"新增用户"按钮
4. 填写用户信息：
   - 用户名（必填，唯一）
   - 密码（必填）
   - 姓名（必填）
   - 邮箱（可选）
   - 手机号（可选）
   - 角色（必填）
   - 管理人（运营角色必填）
   - 状态（必填）
5. 点击确定创建

### 权限说明

- **管理员/主管**：可以看到所有产品和销售数据
- **运营**：只能看到管理人为自己的产品和销售数据

### 测试步骤

1. 使用 admin/123456 登录
2. 进入用户管理页面
3. 创建一个主管用户（supervisor）
4. 创建一个运营用户（operator），指定管理人
5. 退出登录，使用运营账号登录
6. 查看产品和销售页面，验证只能看到自己管理的数据
7. 尝试访问用户管理页面，验证无权限访问

## 技术实现

- 数据库：PostgreSQL
- 后端：Nitro (H3)
- 前端：Vue 3 + Ant Design Vue
- 权限控制：JWT Token + 角色验证
- 数据过滤：SQL WHERE 条件 + 中间件

## 文件清单

### 后端文件
- `api/db/users.ts` - 用户数据库操作
- `api/users/list.ts` - 获取用户列表
- `api/users/[id].get.ts` - 获取用户详情
- `api/users/create.post.ts` - 创建用户
- `api/users/[id].put.ts` - 更新用户
- `api/users/[id].delete.ts` - 删除用户
- `api/users/_middleware.ts` - 用户管理权限中间件
- `utils/permission.ts` - 权限控制工具函数
- `scripts/create-users-table.sql` - 用户表创建脚本
- `scripts/create-users-table.ts` - 用户表创建执行脚本

### 前端文件
- `views/erp/user/index.vue` - 用户管理页面

### 修改的文件
- `api/auth/login.post.ts` - 支持数据库用户登录
- `api/product/list.ts` - 添加权限过滤
- `api/sales/statistics.ts` - 添加权限过滤
