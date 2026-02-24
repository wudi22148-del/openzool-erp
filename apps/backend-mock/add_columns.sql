-- 添加头程运费字段（在国内运费和海外运费之间）
ALTER TABLE products ADD COLUMN IF NOT EXISTS first_leg_shipping NUMERIC(10, 2) DEFAULT 0;

-- 添加利润字段
ALTER TABLE products ADD COLUMN IF NOT EXISTS profit NUMERIC(10, 2) DEFAULT 0;

-- 添加利润率字段
ALTER TABLE products ADD COLUMN IF NOT EXISTS profit_rate NUMERIC(5, 2) DEFAULT 0;
