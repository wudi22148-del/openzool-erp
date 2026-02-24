-- 产品利润计算功能所需的数据库修改
-- 请联系数据库管理员执行此脚本

-- 1. 在 products 表添加字段
ALTER TABLE products ADD COLUMN IF NOT EXISTS first_leg_shipping NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS profit NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS profit_rate NUMERIC(5, 2) DEFAULT 0;

-- 2. 创建产品利润计算表（如果不存在）
CREATE TABLE IF NOT EXISTS product_profit_calculations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  warehouse_sku VARCHAR(100) NOT NULL,
  product_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
  domestic_shipping NUMERIC(10, 2) NOT NULL DEFAULT 0,
  first_leg_shipping NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price_rmb NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price_jpy NUMERIC(10, 2) NOT NULL DEFAULT 0,
  shipping_subsidy NUMERIC(10, 2) NOT NULL DEFAULT 0,
  profit_rmb NUMERIC(10, 2) NOT NULL DEFAULT 0,
  profit_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  profit_rate_no_subsidy NUMERIC(5, 2) NOT NULL DEFAULT 0,
  jpy_exchange_rate NUMERIC(10, 4) NOT NULL DEFAULT 0,
  manager VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. product_id已经是UNIQUE，不需要额外索引

-- 4. 添加注释
COMMENT ON COLUMN products.first_leg_shipping IS '头程运费';
COMMENT ON COLUMN products.profit IS '利润';
COMMENT ON COLUMN products.profit_rate IS '利润率';
COMMENT ON TABLE product_profit_calculations IS '产品利润计算表';
