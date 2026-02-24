import pkg from 'pg';
const { Pool } = pkg;

async function checkData() {
  const pool = new Pool({
    host: '68.183.230.252',
    port: 5432,
    database: 'openzool_erp',
    user: 'erp_user',
    password: 'erp_password_2026',
  });

  try {
    console.log('检查日销数据...\n');

    // 1. 检查2月16-17日的数据
    console.log('1. 检查2月16-17日的数据统计:');
    const dateStats = await pool.query(`
      SELECT date, COUNT(*) as count, SUM(sales_quantity) as total_qty
      FROM daily_sales
      WHERE date >= '2026-02-16' AND date <= '2026-02-17'
      GROUP BY date
      ORDER BY date DESC
    `);

    console.log('日期统计:');
    dateStats.rows.forEach(row => {
      console.log(`  ${row.date.toISOString().split('T')[0]}: ${row.count}条记录, 总销量: ${row.total_qty}`);
    });

    // 2. 检查16号的具体数据（前10条）
    console.log('\n2. 2月16日的前10条数据:');
    const feb16Data = await pool.query(`
      SELECT date, warehouse_sku, sales_quantity, order_number
      FROM daily_sales
      WHERE date = '2026-02-16'
      ORDER BY warehouse_sku
      LIMIT 10
    `);

    feb16Data.rows.forEach(row => {
      console.log(`  ${row.date.toISOString().split('T')[0]} | ${row.warehouse_sku} | 数量: ${row.sales_quantity} | 订单: ${row.order_number || 'N/A'}`);
    });

    // 3. 检查当前排序逻辑
    console.log('\n3. 当前排序逻辑测试（近30天销量前10的产品）:');
    const sortTest = await pool.query(`
      SELECT
        p.warehouse_sku,
        p.product_name,
        SUM(ds.sales_quantity) as total_sales
      FROM products p
      INNER JOIN daily_sales ds ON p.warehouse_sku = ds.warehouse_sku
      WHERE ds.date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY p.id, p.warehouse_sku, p.product_name
      ORDER BY total_sales DESC
      LIMIT 10
    `);

    console.log('排序结果（按总销量降序）:');
    sortTest.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.warehouse_sku} | ${row.product_name} | 总销量: ${row.total_sales}`);
    });

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n查询失败:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkData();
