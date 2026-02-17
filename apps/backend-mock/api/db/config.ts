import { Pool } from 'pg';

// 数据库连接配置
const pool = new Pool({
  host: '68.183.230.252',
  port: 5432,
  database: 'openzool_erp',
  user: 'erp_user',
  password: 'erp_password_2026',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  query_timeout: 30000,
});

// 测试连接
pool.on('connect', () => {
  console.log('数据库连接成功');
});

pool.on('error', (err) => {
  console.error('数据库连接错误:', err);
});

export default pool;
