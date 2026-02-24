import pool from '../api/db/config';

async function createProfitTable() {
  try {
    console.log('开始创建利润计算表...');

    // 只创建新表，不修改 products 表
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS product_profit_calculations (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL UNIQUE,
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
    `;

    await pool.query(createTableSQL);
    console.log('✓ product_profit_calculations 表创建成功');

    // 验证表是否创建成功
    const verifyResult = await pool.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'product_profit_calculations'
      ORDER BY ordinal_position
    `);

    console.log('\n表结构验证:');
    console.log(`共有 ${verifyResult.rows.length} 个字段`);
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    console.log('\n✓ 利润计算表创建完成！');
    console.log('\n注意：products 表的字段需要数据库管理员添加');
    console.log('当前利润计算功能可以正常使用，但利润数据暂时不会同步到产品管理页面');

    process.exit(0);
  } catch (error: any) {
    console.error('\n执行失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createProfitTable();
