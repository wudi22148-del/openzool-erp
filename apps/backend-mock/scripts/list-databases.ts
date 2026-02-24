import pkg from 'pg';
const { Pool } = pkg;

async function listDatabases() {
  // Connect to postgres database (default) to list all databases
  const pool = new Pool({
    host: '68.183.230.252',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '123456',
  });

  try {
    console.log('连接到PostgreSQL服务器...\n');

    const result = await pool.query(`
      SELECT datname FROM pg_database
      WHERE datistemplate = false
      ORDER BY datname;
    `);

    console.log('可用的数据库列表:');
    result.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.datname}`);
    });

    console.log('\n✅ 查询完成');
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 查询失败:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

listDatabases();
