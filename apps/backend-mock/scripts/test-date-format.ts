import pkg from 'pg';
const { Pool } = pkg;

async function testDateFormat() {
  const pool = new Pool({
    host: '68.183.230.252',
    port: 5432,
    database: 'openzool_erp',
    user: 'erp_user',
    password: 'erp_password_2026',
  });

  try {
    console.log('测试日期格式转换...\n');

    // 查询16号的数据
    const result = await pool.query(`
      SELECT date, warehouse_sku, sales_quantity
      FROM daily_sales
      WHERE date = '2026-02-16'
      LIMIT 5
    `);

    console.log('数据库中的原始日期:');
    result.rows.forEach(row => {
      console.log('  原始date:', row.date);
      console.log('  toISOString():', new Date(row.date).toISOString());
      console.log('  split后:', new Date(row.date).toISOString().split('T')[0]);
      console.log('  字段名:', `date_${new Date(row.date).toISOString().split('T')[0].replace(/-/g, '_')}`);
      console.log('---');
    });

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 查询失败:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testDateFormat();
