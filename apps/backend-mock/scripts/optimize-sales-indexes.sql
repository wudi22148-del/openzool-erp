-- 优化日销统计查询性能的数据库索引

-- 1. 为 daily_sales 表添加复合索引，加速按日期和SKU查询
CREATE INDEX IF NOT EXISTS idx_daily_sales_date_sku ON daily_sales(date, warehouse_sku);

-- 2. 为 daily_sales 表添加日期索引，加速日期范围查询
CREATE INDEX IF NOT EXISTS idx_daily_sales_date ON daily_sales(date);

-- 3. 为 products 表添加 warehouse_sku 索引，加速SKU关联查询
CREATE INDEX IF NOT EXISTS idx_products_warehouse_sku ON products(warehouse_sku);

-- 4. 为 products 表添加 manager 索引，加速管理人筛选
CREATE INDEX IF NOT EXISTS idx_products_manager ON products(manager);

-- 验证索引创建
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('daily_sales', 'products')
ORDER BY tablename, indexname;
