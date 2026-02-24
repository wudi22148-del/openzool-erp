-- ============================================
-- 产品利润计算功能 - 完整数据库更新脚本
-- 需要使用 postgres 超级用户或表所有者执行
-- ============================================

-- 1. 在 products 表添加字段
ALTER TABLE products ADD COLUMN IF NOT EXISTS first_leg_shipping NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS profit NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS profit_rate NUMERIC(5, 2) DEFAULT 0;

-- 2. 添加字段注释
COMMENT ON COLUMN products.first_leg_shipping IS '头程运费';
COMMENT ON COLUMN products.profit IS '利润';
COMMENT ON COLUMN products.profit_rate IS '利润率';

-- 3. 验证字段是否添加成功
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('first_leg_shipping', 'profit', 'profit_rate')
ORDER BY column_name;

-- 4. 显示成功消息
DO $$
BEGIN
    RAISE NOTICE '✓ products 表字段添加完成';
    RAISE NOTICE '✓ 所有功能现在可以正常使用';
END $$;
