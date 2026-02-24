import { readFileSync } from 'fs';
import { join } from 'path';
import pool from '../api/db/config';

async function executeSchemaUpdates() {
  try {
    console.log('开始执行数据库架构更新...');

    // 读取SQL文件
    const sqlPath = join(__dirname, 'database-schema-updates.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // 分割SQL语句（按分号分割，但忽略注释）
    const statements = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`共有 ${statements.length} 条SQL语句需要执行`);

    // 逐条执行SQL语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n执行第 ${i + 1} 条语句...`);
      console.log(statement.substring(0, 100) + '...');

      try {
        await pool.query(statement);
        console.log(`✓ 第 ${i + 1} 条语句执行成功`);
      } catch (error: any) {
        // 如果是"已存在"的错误，可以忽略
        if (error.code === '42701' || error.code === '42P07') {
          console.log(`⚠ 第 ${i + 1} 条语句: 对象已存在，跳过`);
        } else {
          console.error(`✗ 第 ${i + 1} 条语句执行失败:`, error.message);
          throw error;
        }
      }
    }

    console.log('\n✓ 所有数据库架构更新执行完成！');

    // 验证字段是否添加成功
    console.log('\n验证新字段...');
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'products'
      AND column_name IN ('first_leg_shipping', 'profit', 'profit_rate')
    `);

    console.log('products表中的新字段:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // 验证新表是否创建成功
    const tableResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'product_profit_calculations'
    `);

    if (tableResult.rows.length > 0) {
      console.log('\n✓ product_profit_calculations 表创建成功');
    } else {
      console.log('\n✗ product_profit_calculations 表未找到');
    }

    process.exit(0);
  } catch (error: any) {
    console.error('\n执行失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

executeSchemaUpdates();
