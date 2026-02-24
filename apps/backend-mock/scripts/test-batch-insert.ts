import pkg from 'pg';
const { Pool } = pkg;

async function testBatchInsert() {
  const pool = new Pool({
    host: '68.183.230.252',
    port: 5432,
    database: 'openzool_erp',
    user: 'erp_user',
    password: 'erp_password_2026',
  });

  try {
    console.log('测试批量插入产品数据...\n');

    // 模拟从Excel导入的数据格式
    const products = [
      {
        productName: '测试产品1',
        skuName: '测试SKU1',
        warehouseSku: 'TEST-001',
        temuSku: '',
        sheinSku: '',
        specs: {
          length: '10',
          width: '20',
          height: '30',
          weight: '0.5',
        },
        productCost: 50,
        tax: 5,
        domesticShipping: 10,
        firstLegShipping: 15,
        overseasShipping: 20,
        manager: '张三',
        stock: 100,
        imageUrl: '',
      },
    ];

    // 构建批量插入的 SQL
    const values: any[] = [];
    const placeholders: string[] = [];

    products.forEach((product, index) => {
      const offset = index * 17;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}, $${offset + 17})`
      );

      values.push(
        product.productName,
        product.skuName,
        product.warehouseSku,
        product.temuSku || null,
        product.sheinSku || null,
        product.specs?.length || null,
        product.specs?.width || null,
        product.specs?.height || null,
        product.specs?.weight || null,
        product.productCost,
        product.tax,
        product.domesticShipping,
        product.firstLegShipping || 0,
        product.overseasShipping,
        product.manager,
        product.stock || 0,
        product.imageUrl || null
      );
    });

    const sql = `
      INSERT INTO products (
        product_name, sku_name, warehouse_sku, temu_sku, shein_sku,
        length, width, height, weight,
        product_cost, tax, domestic_shipping, first_leg_shipping, overseas_shipping,
        manager, stock, image_url
      ) VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    console.log('执行SQL...');
    const result = await pool.query(sql, values);

    console.log('✅ 插入成功！');
    console.log('插入的数据:', result.rows[0]);

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 插入失败:', error.message);
    console.error('错误详情:', error);
    await pool.end();
    process.exit(1);
  }
}

testBatchInsert();
