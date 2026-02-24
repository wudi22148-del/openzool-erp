import pkg from 'pg';
const { Pool } = pkg;

async function checkTables() {
  const pool = new Pool({
    host: '68.183.230.252',
    port: 5432,
    database: 'readme_to_recover',
    user: 'postgres',
    password: '123456',
  });

  try {
    console.log('检查 readme_to_recover 数据库...\n');

    // 列出所有表
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('数据库中的表:');
    tablesResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name}`);
    });

    // 检查关键表的记录数
    console.log('\n关键表的记录数:');

    const tables = ['products', 'daily_sales', 'profit_calculations'];
    for (const table of tables) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ${table}: ${countResult.rows[0].count} 条记录`);
      } catch (e: any) {
        console.log(`  ${table}: 表不存在或查询失败`);
      }
    }

    console.log('\n✅ 检查完成');
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 检查失败:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkTables();
