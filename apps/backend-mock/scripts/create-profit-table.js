import { Pool } from 'pg';

const pool = new Pool({
  host: '68.183.230.252',
  port: 5432,
  database: 'openzool_erp',
  user: 'erp_user',
  password: 'erp_password_2026',
});

async function createProfitTable() {
  const client = await pool.connect();
  try {
    console.log('开始创建产品利润计算表...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS product_profit_calculations (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
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
      )
    `);
    console.log('✓ 产品利润计算表创建成功');

    // 创建索引
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_profit_product_id ON product_profit_calculations(product_id)
    `);
    console.log('✓ 索引创建成功');

    console.log('数据库表创建完成！');
  } catch (error) {
    console.error('创建失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createProfitTable();
