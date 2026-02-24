import pkg from 'pg';
const { Pool } = pkg;

async function testInsert() {
  const pool = new Pool({
    host: '68.183.230.252',
    port: 5432,
    database: 'openzool_erp',
    user: 'erp_user',
    password: 'erp_password_2026',
  });

  try {
    console.log('测试插入产品数据...\n');

    // 测试插入一条简单的产品数据
    const result = await pool.query(`
      INSERT INTO products (
        product_name, sku_name, warehouse_sku,
        product_cost, tax, domestic_shipping, overseas_shipping,
        manager
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      '测试产品',
      '测试SKU',
      'TEST-001',
      10.5,
      2.0,
      3.0,
      5.0,
      '测试负责人'
    ]);

    console.log('✅ 插入成功！');
    console.log('插入的数据:', result.rows[0]);

    // 查询验证
    const checkResult = await pool.query('SELECT COUNT(*) FROM products');
    console.log('\n当前产品总数:', checkResult.rows[0].count);

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 插入失败:', error.message);
    console.error('错误详情:', error);
    await pool.end();
    process.exit(1);
  }
}

testInsert();
