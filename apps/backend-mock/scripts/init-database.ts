import pool from '../api/db/config';
import { readFileSync } from 'fs';
import { join } from 'path';

async function initDatabase() {
  const client = await pool.connect();

  try {
    console.log('开始初始化数据库...');

    // 读取SQL文件
    const sqlPath = join(__dirname, 'init-database.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // 执行SQL
    await client.query(sql);

    console.log('✓ 数据库初始化成功');

    // 验证表是否创建成功
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('\n已创建的表:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 执行初始化
initDatabase().catch(console.error);
