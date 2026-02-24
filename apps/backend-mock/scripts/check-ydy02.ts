import pkg from 'pg';
const { Pool } = pkg;

async function checkYdy02Data() {
  const pool = new Pool({
    host: '68.183.230.252',
    port: 5432,
    database: 'openzool_erp',
    user: 'erp_user',
    password: 'erp_password_2026',
  });

  try {
    console.log('检查 ydy02 的日期数据...\n');

    const result = await pool.query(`
      SELECT date, warehouse_sku, sales_quantity, order_number
      FROM daily_sales
      WHERE warehouse_sku = 'ydy02'
      ORDER BY date DESC
      LIMIT 50
    `);

    console.log('ydy02 的销售记录:');
    const dateCount = {};
    result.rows.forEach(row => {
      const dateStr = row.date.toISOString().split('T')[0];
      if (!dateCount[dateStr]) {
        dateCount[dateStr] = 0;
      }
      dateCount[dateStr]++;
    });

    console.log('\n按日期统计:');
    Object.keys(dateCount).sort().reverse().forEach(date => {
      console.log(`  ${date}: ${dateCount[date]} 条记录`);
    });

    console.log('\n前10条原始数据:');
    result.rows.slice(0, 10).forEach(row => {
      console.log(`  ${row.date.toISOString()} | ${row.warehouse_sku} | 数量: ${row.sales_quantity}`);
    });

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 查询失败:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkYdy02Data();
