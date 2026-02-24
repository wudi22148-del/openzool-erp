import pkg from 'pg';
const { Pool } = pkg;

async function createDatabase() {
  // 先连接到 postgres 数据库来创建新数据库
  const adminPool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '123456',
  });

  try {
    console.log('1. 检查数据库是否存在...');

    // 检查数据库是否存在
    const checkDb = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'openzool_erp'"
    );

    if (checkDb.rows.length > 0) {
      console.log('   数据库已存在，先删除...');
      // 断开所有连接
      await adminPool.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = 'openzool_erp'
          AND pid <> pg_backend_pid()
      `);
      await adminPool.query('DROP DATABASE openzool_erp');
    }

    console.log('2. 创建数据库 openzool_erp...');
    await adminPool.query('CREATE DATABASE openzool_erp');
    console.log('   ✅ 数据库创建成功');

    await adminPool.end();

    // 连接到新数据库创建表
    const erpPool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'openzool_erp',
      user: 'postgres',
      password: '123456',
    });

    console.log('\n3. 创建 products 表...');
    await erpPool.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        product_name VARCHAR(255) NOT NULL,
        sku_name VARCHAR(255) NOT NULL,
        warehouse_sku VARCHAR(100) NOT NULL UNIQUE,
        temu_sku VARCHAR(100),
        shein_sku VARCHAR(100),
        length NUMERIC(10, 2),
        width NUMERIC(10, 2),
        height NUMERIC(10, 2),
        weight NUMERIC(10, 2),
        product_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
        tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
        domestic_shipping NUMERIC(10, 2) NOT NULL DEFAULT 0,
        first_leg_shipping NUMERIC(10, 2) DEFAULT 0,
        overseas_shipping NUMERIC(10, 2) NOT NULL DEFAULT 0,
        manager VARCHAR(100),
        stock INTEGER DEFAULT 0,
        profit NUMERIC(10, 2) DEFAULT 0,
        profit_rate NUMERIC(10, 2) DEFAULT 0,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ products 表创建成功');

    console.log('\n4. 创建 daily_sales 表...');
    await erpPool.query(`
      CREATE TABLE daily_sales (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        warehouse_sku VARCHAR(100) NOT NULL,
        sales_quantity INTEGER NOT NULL DEFAULT 0,
        order_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ daily_sales 表创建成功');

    console.log('\n5. 创建 product_profit_calculations 表...');
    await erpPool.query(`
      CREATE TABLE product_profit_calculations (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        warehouse_sku VARCHAR(100) NOT NULL,
        product_cost NUMERIC(10, 2) NOT NULL,
        tax NUMERIC(10, 2) NOT NULL,
        domestic_shipping NUMERIC(10, 2) NOT NULL,
        first_leg_shipping NUMERIC(10, 2) NOT NULL,
        total_cost NUMERIC(10, 2) NOT NULL,
        price_rmb NUMERIC(10, 2) NOT NULL,
        price_jpy NUMERIC(10, 2) NOT NULL,
        shipping_subsidy NUMERIC(10, 2) NOT NULL,
        profit_rmb NUMERIC(10, 2) NOT NULL,
        profit_rate NUMERIC(10, 2) NOT NULL,
        profit_rate_no_subsidy NUMERIC(10, 2) NOT NULL,
        jpy_exchange_rate NUMERIC(10, 6) NOT NULL,
        manager VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id)
      )
    `);
    console.log('   ✅ product_profit_calculations 表创建成功');

    console.log('\n6. 创建索引...');
    await erpPool.query('CREATE INDEX idx_daily_sales_date_sku ON daily_sales(date, warehouse_sku)');
    await erpPool.query('CREATE INDEX idx_daily_sales_date ON daily_sales(date)');
    await erpPool.query('CREATE INDEX idx_products_warehouse_sku ON products(warehouse_sku)');
    await erpPool.query('CREATE INDEX idx_products_manager ON products(manager)');
    console.log('   ✅ 索引创建成功');

    console.log('\n7. 授权给 erp_user...');
    // 创建用户（如果不存在）
    await erpPool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'erp_user') THEN
          CREATE USER erp_user WITH PASSWORD 'erp_password_2026';
        END IF;
      END
      $$;
    `);

    // 授权
    await erpPool.query('GRANT ALL PRIVILEGES ON DATABASE openzool_erp TO erp_user');
    await erpPool.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO erp_user');
    await erpPool.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO erp_user');
    console.log('   ✅ 权限授予成功');

    await erpPool.end();

    console.log('\n✅ 数据库创建完成！');
    console.log('\n数据库信息:');
    console.log('  - 数据库名: openzool_erp');
    console.log('  - 表: products, daily_sales, product_profit_calculations');
    console.log('  - 用户: erp_user');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 创建失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createDatabase();
