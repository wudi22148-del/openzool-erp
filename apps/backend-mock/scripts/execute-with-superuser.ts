import pkg from 'pg';
const { Pool } = pkg;

async function executeWithSuperuser() {
  // 使用 postgres 超级用户连接
  const superuserPool = new Pool({
    host: '68.183.230.252',
    port: 5432,
    database: 'openzool_erp',
    user: 'postgres',
    password: '123456',
  });

  try {
    console.log('尝试使用 postgres 超级用户连接...');

    // 测试连接
    await superuserPool.query('SELECT current_user, version()');
    console.log('✓ 数据库连接成功\n');

    // 执行 ALTER TABLE 语句
    console.log('1. 添加 first_leg_shipping 字段...');
    await superuserPool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS first_leg_shipping NUMERIC(10, 2) DEFAULT 0');
    console.log('✓ first_leg_shipping 字段添加成功\n');

    console.log('2. 添加 profit 字段...');
    await superuserPool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS profit NUMERIC(10, 2) DEFAULT 0');
    console.log('✓ profit 字段添加成功\n');

    console.log('3. 添加 profit_rate 字段...');
    await superuserPool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS profit_rate NUMERIC(5, 2) DEFAULT 0');
    console.log('✓ profit_rate 字段添加成功\n');

    // 添加注释
    console.log('4. 添加字段注释...');
    await superuserPool.query("COMMENT ON COLUMN products.first_leg_shipping IS '头程运费'");
    await superuserPool.query("COMMENT ON COLUMN products.profit IS '利润'");
    await superuserPool.query("COMMENT ON COLUMN products.profit_rate IS '利润率'");
    console.log('✓ 字段注释添加成功\n');

    // 验证字段
    console.log('5. 验证字段是否添加成功...');
    const result = await superuserPool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'products'
      AND column_name IN ('first_leg_shipping', 'profit', 'profit_rate')
      ORDER BY column_name
    `);

    console.log('products 表新增字段:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name}: ${row.data_type} (默认值: ${row.column_default})`);
    });

    console.log('\n✅ 数据库更新完成！所有功能现在可以正常使用。');

    await superuserPool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 执行失败:', error.message);
    if (error.code === '28P01') {
      console.error('密码错误，请检查 postgres 用户密码');
    }
    await superuserPool.end();
    process.exit(1);
  }
}

executeWithSuperuser();
