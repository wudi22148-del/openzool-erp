# 数据库架构更新说明

## 问题说明

当前数据库用户 `erp_user` 没有 ALTER TABLE 权限，无法修改表结构。需要数据库管理员使用具有足够权限的账户执行SQL更新。

## 执行方式

### 方式一：使用 psql 命令行（推荐）

```bash
# 使用超级用户或表所有者账户执行
psql -h 68.183.230.252 -p 5432 -U postgres -d openzool_erp -f database-schema-updates.sql
```

### 方式二：使用数据库管理工具

使用 pgAdmin、DBeaver 或其他数据库管理工具，以具有足够权限的用户身份连接数据库，然后执行 `database-schema-updates.sql` 文件中的SQL语句。

## SQL脚本内容

脚本位置：`apps/backend-mock/scripts/database-schema-updates.sql`

脚本将执行以下操作：

1. **在 products 表添加三个新字段：**
   - `first_leg_shipping` (头程运费)
   - `profit` (利润)
   - `profit_rate` (利润率)

2. **创建新表 product_profit_calculations：**
   - 用于存储产品利润计算的详细数据
   - 包含 UNIQUE 约束确保每个产品只有一条计算记录

## 当前状态

✅ **应用程序已实现兼容模式**
- 后端代码已经实现了兼容性处理
- 即使数据库字段不存在，应用也能正常运行
- 新字段会返回默认值 0

⚠️ **功能限制**
- 产品管理页面暂时无法显示利润数据
- 利润计算功能可以正常使用，但数据无法持久化到 products 表

## 执行后的效果

执行SQL脚本后：
- ✅ 产品管理页面将显示利润和利润率
- ✅ 利润计算保存后会同步更新到产品管理
- ✅ 所有功能完全正常

## 验证方法

执行完SQL脚本后，可以运行以下查询验证：

```sql
-- 验证 products 表新字段
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('first_leg_shipping', 'profit', 'profit_rate');

-- 验证新表是否创建
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'product_profit_calculations';
```

## 联系方式

如有问题，请联系系统开发人员。
