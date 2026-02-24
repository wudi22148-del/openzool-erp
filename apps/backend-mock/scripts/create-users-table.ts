import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

async function createUsersTable() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'openzool_erp',
    user: 'postgres',
    password: '123456',
  });

  try {
    console.log('开始创建用户表...\n');

    // 读取SQL文件
    const sqlPath = join(__dirname, 'create-users-table.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // 执行SQL
    await pool.query(sql);

    console.log('✓ 用户表创建成功\n');

    // 验证表是否创建成功
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('用户表字段:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建用户表失败:', error);
    await pool.end();
    process.exit(1);
  }
}

createUsersTable();
