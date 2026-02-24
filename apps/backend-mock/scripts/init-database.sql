-- ============================================
-- ERP系统数据库初始化脚本
-- 数据库: openzool_erp
-- ============================================

-- 1. 创建产品表
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  sku_name VARCHAR(255) NOT NULL,
  warehouse_sku VARCHAR(100) NOT NULL UNIQUE,
  temu_sku VARCHAR(100),
  shein_sku VARCHAR(100),
  length NUMERIC(10, 2),
  width NUMERIC(10, 2),
  height NUMERIC(10, 2),
  weight NUMERIC(10, 2),
  product_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
  domestic_shipping NUMERIC(10, 2) NOT NULL DEFAULT 0,
  first_leg_shipping NUMERIC(10, 2) DEFAULT 0,
  overseas_shipping NUMERIC(10, 2) NOT NULL DEFAULT 0,
  manager VARCHAR(50),
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  profit NUMERIC(10, 2) DEFAULT 0,
  profit_rate NUMERIC(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 创建每日销售表
CREATE TABLE IF NOT EXISTS daily_sales (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  warehouse_sku VARCHAR(100) NOT NULL,
  sales_quantity INTEGER NOT NULL DEFAULT 0,
  order_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_warehouse_sku FOREIGN KEY (warehouse_sku)
    REFERENCES products(warehouse_sku) ON DELETE CASCADE
);

-- 3. 创建产品利润计算表
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

-- 4. 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_products_manager ON products(manager);
CREATE INDEX IF NOT EXISTS idx_products_warehouse_sku ON products(warehouse_sku);
CREATE INDEX IF NOT EXISTS idx_daily_sales_date ON daily_sales(date);
CREATE INDEX IF NOT EXISTS idx_daily_sales_warehouse_sku ON daily_sales(warehouse_sku);
CREATE INDEX IF NOT EXISTS idx_daily_sales_date_sku ON daily_sales(date, warehouse_sku);

-- 5. 添加表注释
COMMENT ON TABLE products IS '产品信息表';
COMMENT ON TABLE daily_sales IS '每日销售数据表';
COMMENT ON TABLE product_profit_calculations IS '产品利润计算表';

-- 6. 添加字段注释
COMMENT ON COLUMN products.first_leg_shipping IS '头程运费';
COMMENT ON COLUMN products.profit IS '利润';
COMMENT ON COLUMN products.profit_rate IS '利润率';
COMMENT ON COLUMN products.warehouse_sku IS '仓库SKU（唯一标识）';
COMMENT ON COLUMN daily_sales.date IS '销售日期';
COMMENT ON COLUMN daily_sales.sales_quantity IS '销售数量';
COMMENT ON COLUMN daily_sales.order_number IS '订单号';

-- 7. 显示成功消息
DO $$
BEGIN
    RAISE NOTICE '✓ 数据库表创建完成';
    RAISE NOTICE '✓ 索引创建完成';
    RAISE NOTICE '✓ 数据库初始化成功';
END $$;
