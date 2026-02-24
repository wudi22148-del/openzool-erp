import { Pool } from 'pg';

const pool = new Pool({
  host: '68.183.230.252',
  port: 5432,
  database: 'openzool_erp',
  user: 'erp_user',
  password: 'erp_password_2026',
});

async function addColumns() {
  const client = await pool.connect();
  try {
    console.log('开始修改数据库表结构...');

    // 添加头程运费字段
    await client.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS first_leg_shipping NUMERIC(10, 2) DEFAULT 0
    `);
    console.log('✓ 添加头程运费字段成功');

    // 添加利润字段
    await client.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS profit NUMERIC(10, 2) DEFAULT 0
    `);
    console.log('✓ 添加利润字段成功');

    // 添加利润率字段
    await client.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS profit_rate NUMERIC(5, 2) DEFAULT 0
    `);
    console.log('✓ 添加利润率字段成功');

    console.log('数据库表结构修改完成！');
  } catch (error) {
    console.error('修改失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addColumns();
