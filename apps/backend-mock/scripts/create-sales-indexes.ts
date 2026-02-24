import pkg from 'pg';
const { Pool } = pkg;

async function createIndexes() {
  const pool = new Pool({
    host: '68.183.230.252',
    port: 5432,
    database: 'openzool_erp',
    user: 'postgres',
    password: '123456',
  });

  try {
    console.log('开始创建数据库索引...\n');

    // 1. daily_sales 表的复合索引
    console.log('1. 创建 daily_sales(date, warehouse_sku) 复合索引...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_daily_sales_date_sku ON daily_sales(date, warehouse_sku)');
    console.log('✓ 复合索引创建成功\n');

    // 2. daily_sales 表的日期索引
    console.log('2. 创建 daily_sales(date) 索引...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_daily_sales_date ON daily_sales(date)');
    console.log('✓ 日期索引创建成功\n');

    // 3. products 表的 warehouse_sku 索引
    console.log('3. 创建 products(warehouse_sku) 索引...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_warehouse_sku ON products(warehouse_sku)');
    console.log('✓ warehouse_sku 索引创建成功\n');

    // 4. products 表的 manager 索引
    console.log('4. 创建 products(manager) 索引...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_manager ON products(manager)');
    console.log('✓ manager 索引创建成功\n');

    // 验证索引
    console.log('5. 验证索引创建...');
    const result = await pool.query(`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename IN ('daily_sales', 'products')
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);

    console.log('\n已创建的索引:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.tablename}.${row.indexname}`);
    });

    console.log('\n✅ 所有索引创建完成！');

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 创建索引失败:', error.message);
    await pool.end();
    process.exit(1);
  }
}

createIndexes();
