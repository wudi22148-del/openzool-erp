import pkg from 'pg';
const { Pool } = pkg;

async function checkFeb16Data() {
  const pool = new Pool({
    host: '68.183.230.252',
    port: 5432,
    database: 'openzool_erp',
    user: 'erp_user',
    password: 'erp_password_2026',
  });

  try {
    console.log('检查2月16日的数据...\n');

    // 检查16号数据
    const feb16Result = await pool.query(`
      SELECT date, COUNT(*) as count, SUM(sales_quantity) as total_qty
      FROM daily_sales
      WHERE date = '2026-02-16'
      GROUP BY date
    `);

    if (feb16Result.rows.length > 0) {
      console.log('✅ 2月16日数据存在:');
      feb16Result.rows.forEach(row => {
        console.log(`  日期: ${row.date}, 记录数: ${row.count}, 总销量: ${row.total_qty}`);
      });

      // 查看16号的前10条数据
      const sampleResult = await pool.query(`
        SELECT date, warehouse_sku, sales_quantity, order_number
        FROM daily_sales
        WHERE date = '2026-02-16'
        ORDER BY warehouse_sku
        LIMIT 10
      `);

      console.log('\n2月16日前10条数据:');
      sampleResult.rows.forEach(row => {
        console.log(`  ${row.date} | ${row.warehouse_sku} | 数量: ${row.sales_quantity}`);
      });
    } else {
      console.log('❌ 2月16日没有数据');
    }

    // 检查所有日期范围
    console.log('\n所有日期的数据统计:');
    const allDatesResult = await pool.query(`
      SELECT date, COUNT(*) as count, SUM(sales_quantity) as total_qty
      FROM daily_sales
      GROUP BY date
      ORDER BY date DESC
      LIMIT 20
    `);

    allDatesResult.rows.forEach(row => {
      console.log(`  ${row.date} | 记录数: ${row.count} | 总销量: ${row.total_qty}`);
    });

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 查询失败:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkFeb16Data();
