import pkg from 'pg';
const { Pool } = pkg;

async function seedData() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'openzool_erp',
    user: 'postgres',
    password: '123456',
  });

  try {
    console.log('开始插入测试数据...\n');

    // 1. 插入产品数据
    console.log('1. 插入产品数据...');
    const managers = ['张三', '李四', '王五', '赵六'];
    const productNames = ['电子产品', '家居用品', '服装配饰', '美妆护肤', '运动户外', '食品饮料'];

    const products = [];
    for (let i = 1; i <= 50; i++) {
      const manager = managers[Math.floor(Math.random() * managers.length)];
      const productName = productNames[Math.floor(Math.random() * productNames.length)];

      products.push({
        productName: `${productName} ${i}`,
        skuName: `SKU-${String(i).padStart(4, '0')}`,
        warehouseSku: `WH-${String(i).padStart(6, '0')}`,
        temuSku: `TEMU-${i}`,
        sheinSku: `SHEIN-${i}`,
        length: (Math.random() * 50 + 10).toFixed(2),
        width: (Math.random() * 50 + 10).toFixed(2),
        height: (Math.random() * 30 + 5).toFixed(2),
        weight: (Math.random() * 1000 + 100).toFixed(2),
        productCost: (Math.random() * 100 + 10).toFixed(2),
        tax: (Math.random() * 10 + 1).toFixed(2),
        domesticShipping: (Math.random() * 20 + 5).toFixed(2),
        firstLegShipping: (Math.random() * 15 + 3).toFixed(2),
        overseasShipping: (Math.random() * 30 + 10).toFixed(2),
        manager,
        stock: Math.floor(Math.random() * 1000 + 50),
        profit: (Math.random() * 50 + 5).toFixed(2),
        profitRate: (Math.random() * 30 + 5).toFixed(2),
      });
    }

    for (const product of products) {
      await pool.query(`
        INSERT INTO products (
          product_name, sku_name, warehouse_sku, temu_sku, shein_sku,
          length, width, height, weight,
          product_cost, tax, domestic_shipping, first_leg_shipping, overseas_shipping,
          manager, stock, profit, profit_rate
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        product.productName, product.skuName, product.warehouseSku, product.temuSku, product.sheinSku,
        product.length, product.width, product.height, product.weight,
        product.productCost, product.tax, product.domesticShipping, product.firstLegShipping, product.overseasShipping,
        product.manager, product.stock, product.profit, product.profitRate
      ]);
    }
    console.log(`   ✅ 已插入 ${products.length} 个产品\n`);

    // 2. 插入销售数据
    console.log('2. 插入销售数据...');
    const today = new Date();
    let salesCount = 0;

    for (let i = 1; i <= 50; i++) {
      const warehouseSku = `WH-${String(i).padStart(6, '0')}`;

      // 为每个产品生成最近30天的销售数据
      for (let day = 0; day < 30; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() - day);
        const dateStr = date.toISOString().split('T')[0];

        // 70%的概率有销量
        if (Math.random() > 0.3) {
          const salesQuantity = Math.floor(Math.random() * 50 + 1);
          const orderNumber = Math.random() > 0.5 ? `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : null;

          await pool.query(`
            INSERT INTO daily_sales (date, warehouse_sku, sales_quantity, order_number)
            VALUES ($1, $2, $3, $4)
          `, [dateStr, warehouseSku, salesQuantity, orderNumber]);

          salesCount++;
        }
      }
    }
    console.log(`   ✅ 已插入 ${salesCount} 条销售记录\n`);

    // 3. 验证数据
    console.log('3. 验证数据...');
    const productCount = await pool.query('SELECT COUNT(*) FROM products');
    const salesCountResult = await pool.query('SELECT COUNT(*) FROM daily_sales');

    console.log(`   - 产品总数: ${productCount.rows[0].count}`);
    console.log(`   - 销售记录总数: ${salesCountResult.rows[0].count}`);
    console.log(`   - 管理员列表: ${managers.join(', ')}\n`);

    console.log('✅ 测试数据插入完成！');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ 插入数据失败:', error);
    await pool.end();
    process.exit(1);
  }
}

seedData();
