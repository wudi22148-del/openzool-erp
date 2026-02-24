import pkg from 'pg';
const { Pool } = pkg;

async function readReadme() {
  const pool = new Pool({
    host: '68.183.230.252',
    port: 5432,
    database: 'readme_to_recover',
    user: 'postgres',
    password: '123456',
  });

  try {
    console.log('读取 readme 表内容...\n');

    const result = await pool.query('SELECT * FROM readme');

    console.log('readme 表内容:');
    console.log(JSON.stringify(result.rows, null, 2));

    console.log('\n✅ 读取完成');
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 读取失败:', error.message);
    await pool.end();
    process.exit(1);
  }
}

readReadme();
