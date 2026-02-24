import pool from './config';

export interface Product {
  id?: number;
  productName: string;
  skuName: string;
  warehouseSku: string;
  temuSku?: string | number;
  sheinSku?: string | number;
  specs?: {
    length?: string | number;
    width?: string | number;
    height?: string | number;
    weight?: string | number;
  };
  productCost: number;
  tax: number;
  domesticShipping: number;
  firstLegShipping?: number;
  overseasShipping: number;
  manager: string;
  stock?: number;
  imageUrl?: string;
  profit?: number;
  profitRate?: number;
}

// 获取所有产品（添加分页支持）
export async function getProducts(page?: number, pageSize?: number): Promise<Product[]> {
  // 不查询 image_url 字段以提升性能，避免传输大量 base64 数据
  // 使用 COALESCE 处理可能不存在的字段
  let query = `SELECT
    id, product_name, sku_name, warehouse_sku, temu_sku, shein_sku,
    length, width, height, weight,
    product_cost, tax, domestic_shipping, overseas_shipping,
    manager, stock, created_at, updated_at,
    COALESCE(first_leg_shipping, 0) as first_leg_shipping,
    COALESCE(profit, 0) as profit,
    COALESCE(profit_rate, 0) as profit_rate
    FROM products ORDER BY id DESC`;
  const params: any[] = [];

  if (page && pageSize) {
    const offset = (page - 1) * pageSize;
    query += ' LIMIT $1 OFFSET $2';
    params.push(pageSize, offset);
  }

  try {
    const result = await pool.query(query, params);

    return result.rows.map(row => ({
      id: String(row.id),
      productName: row.product_name,
      skuName: row.sku_name,
      warehouseSku: row.warehouse_sku,
      temuSku: row.temu_sku,
      sheinSku: row.shein_sku,
      specs: {
        length: row.length,
        width: row.width,
        height: row.height,
        weight: row.weight,
      },
      productCost: parseFloat(row.product_cost),
      tax: parseFloat(row.tax),
      domesticShipping: parseFloat(row.domestic_shipping),
      firstLegShipping: parseFloat(row.first_leg_shipping || 0),
      overseasShipping: parseFloat(row.overseas_shipping),
      manager: row.manager,
      stock: row.stock,
      profit: parseFloat(row.profit || 0),
      profitRate: parseFloat(row.profit_rate || 0),
      imageUrl: '', // 列表不返回图片数据，提升性能
    }));
  } catch (error: any) {
    // 如果字段不存在，使用不包含新字段的查询
    if (error.code === '42703') {
      console.log('新字段不存在，使用兼容模式查询');
      let fallbackQuery = `SELECT
        id, product_name, sku_name, warehouse_sku, temu_sku, shein_sku,
        length, width, height, weight,
        product_cost, tax, domestic_shipping, overseas_shipping,
        manager, stock, created_at, updated_at
        FROM products ORDER BY id DESC`;

      if (page && pageSize) {
        const offset = (page - 1) * pageSize;
        fallbackQuery += ' LIMIT $1 OFFSET $2';
      }

      const result = await pool.query(fallbackQuery, params);

      return result.rows.map(row => ({
        id: String(row.id),
        productName: row.product_name,
        skuName: row.sku_name,
        warehouseSku: row.warehouse_sku,
        temuSku: row.temu_sku,
        sheinSku: row.shein_sku,
        specs: {
          length: row.length,
          width: row.width,
          height: row.height,
          weight: row.weight,
        },
        productCost: parseFloat(row.product_cost),
        tax: parseFloat(row.tax),
        domesticShipping: parseFloat(row.domestic_shipping),
        firstLegShipping: 0,
        overseasShipping: parseFloat(row.overseas_shipping),
        manager: row.manager,
        stock: row.stock,
        profit: 0,
        profitRate: 0,
        imageUrl: '', // 列表不返回图片数据，提升性能
      }));
    }
    throw error;
  }
}

// 获取产品总数
export async function getProductsCount(): Promise<number> {
  const result = await pool.query('SELECT COUNT(*) FROM products');
  return parseInt(result.rows[0].count);
}

// 获取过滤后的产品列表（带分页和搜索）
export async function getFilteredProducts(
  page: number,
  pageSize: number,
  keyword?: string,
  manager?: string
): Promise<{ items: Product[]; total: number }> {
  // 构建 WHERE 条件
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (keyword) {
    conditions.push(`(
      product_name ILIKE $${paramIndex} OR
      sku_name ILIKE $${paramIndex} OR
      warehouse_sku ILIKE $${paramIndex} OR
      CAST(temu_sku AS TEXT) ILIKE $${paramIndex} OR
      CAST(shein_sku AS TEXT) ILIKE $${paramIndex}
    )`);
    params.push(`%${keyword}%`);
    paramIndex++;
  }

  if (manager) {
    conditions.push(`manager = $${paramIndex}`);
    params.push(manager);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 获取总数
  const countQuery = `SELECT COUNT(*) FROM products ${whereClause}`;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  // 获取分页数据（不包含图片以提升性能）
  const offset = (page - 1) * pageSize;
  const dataQuery = `SELECT
    id, product_name, sku_name, warehouse_sku, temu_sku, shein_sku,
    length, width, height, weight,
    product_cost, tax, domestic_shipping, overseas_shipping,
    manager, stock, created_at, updated_at,
    COALESCE(first_leg_shipping, 0) as first_leg_shipping,
    COALESCE(profit, 0) as profit,
    COALESCE(profit_rate, 0) as profit_rate
    FROM products
    ${whereClause}
    ORDER BY id DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

  const dataParams = [...params, pageSize, offset];

  try {
    const dataResult = await pool.query(dataQuery, dataParams);

    const items = dataResult.rows.map(row => ({
      id: String(row.id),
      productName: row.product_name,
      skuName: row.sku_name,
      warehouseSku: row.warehouse_sku,
      temuSku: row.temu_sku,
      sheinSku: row.shein_sku,
      specs: {
        length: row.length,
        width: row.width,
        height: row.height,
        weight: row.weight,
      },
      productCost: parseFloat(row.product_cost),
      tax: parseFloat(row.tax),
      domesticShipping: parseFloat(row.domestic_shipping),
      firstLegShipping: parseFloat(row.first_leg_shipping || 0),
      overseasShipping: parseFloat(row.overseas_shipping),
      manager: row.manager,
      stock: row.stock,
      profit: parseFloat(row.profit || 0),
      profitRate: parseFloat(row.profit_rate || 0),
      imageUrl: '', // 列表不返回图片数据，提升性能
    }));

    return { items, total };
  } catch (error: any) {
    // 如果字段不存在，使用不包含新字段的查询
    if (error.code === '42703') {
      console.log('新字段不存在，使用兼容模式查询');
      const fallbackQuery = `SELECT
        id, product_name, sku_name, warehouse_sku, temu_sku, shein_sku,
        length, width, height, weight,
        product_cost, tax, domestic_shipping, overseas_shipping,
        manager, stock, created_at, updated_at
        FROM products
        ${whereClause}
        ORDER BY id DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

      const dataResult = await pool.query(fallbackQuery, dataParams);

      const items = dataResult.rows.map(row => ({
        id: String(row.id),
        productName: row.product_name,
        skuName: row.sku_name,
        warehouseSku: row.warehouse_sku,
        temuSku: row.temu_sku,
        sheinSku: row.shein_sku,
        specs: {
          length: row.length,
          width: row.width,
          height: row.height,
          weight: row.weight,
        },
        productCost: parseFloat(row.product_cost),
        tax: parseFloat(row.tax),
        domesticShipping: parseFloat(row.domestic_shipping),
        firstLegShipping: 0,
        overseasShipping: parseFloat(row.overseas_shipping),
        manager: row.manager,
        stock: row.stock,
        profit: 0,
        profitRate: 0,
        imageUrl: '', // 列表不返回图片数据，提升性能
      }));

      return { items, total };
    }
    throw error;
  }
}

// 获取单个产品（包含图片）
export async function getProductById(id: string): Promise<Product | null> {
  const result = await pool.query(
    `SELECT
      id, product_name, sku_name, warehouse_sku, temu_sku, shein_sku,
      length, width, height, weight,
      product_cost, tax, domestic_shipping, overseas_shipping,
      manager, stock, image_url, created_at, updated_at
    FROM products
    WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    productName: row.product_name,
    skuName: row.sku_name,
    warehouseSku: row.warehouse_sku,
    temuSku: row.temu_sku,
    sheinSku: row.shein_sku,
    specs: {
      length: row.length,
      width: row.width,
      height: row.height,
      weight: row.weight,
    },
    productCost: parseFloat(row.product_cost),
    tax: parseFloat(row.tax),
    domesticShipping: parseFloat(row.domestic_shipping),
    firstLegShipping: 0,
    overseasShipping: parseFloat(row.overseas_shipping),
    manager: row.manager,
    stock: row.stock,
    profit: 0,
    profitRate: 0,
    imageUrl: row.image_url || '',
  };
}

// 添加产品
export async function addProducts(products: Product[]): Promise<Product[]> {
  if (products.length === 0) return [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

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
      ON CONFLICT (warehouse_sku) DO UPDATE SET
        product_name = EXCLUDED.product_name,
        sku_name = EXCLUDED.sku_name,
        temu_sku = EXCLUDED.temu_sku,
        shein_sku = EXCLUDED.shein_sku,
        length = EXCLUDED.length,
        width = EXCLUDED.width,
        height = EXCLUDED.height,
        weight = EXCLUDED.weight,
        product_cost = EXCLUDED.product_cost,
        tax = EXCLUDED.tax,
        domestic_shipping = EXCLUDED.domestic_shipping,
        first_leg_shipping = EXCLUDED.first_leg_shipping,
        overseas_shipping = EXCLUDED.overseas_shipping,
        manager = EXCLUDED.manager,
        stock = EXCLUDED.stock,
        image_url = EXCLUDED.image_url,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await client.query(sql, values);

    await client.query('COMMIT');

    return result.rows.map(row => ({
      id: String(row.id),
      productName: row.product_name,
      skuName: row.sku_name,
      warehouseSku: row.warehouse_sku,
      temuSku: row.temu_sku,
      sheinSku: row.shein_sku,
      specs: {
        length: row.length,
        width: row.width,
        height: row.height,
        weight: row.weight,
      },
      productCost: parseFloat(row.product_cost),
      tax: parseFloat(row.tax),
      domesticShipping: parseFloat(row.domestic_shipping),
      firstLegShipping: parseFloat(row.first_leg_shipping || 0),
      overseasShipping: parseFloat(row.overseas_shipping),
      manager: row.manager,
      stock: row.stock,
      profit: parseFloat(row.profit || 0),
      profitRate: parseFloat(row.profit_rate || 0),
      imageUrl: row.image_url,
    }));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// 更新产品
export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product | null> {
  try {
    console.log('数据库更新产品, ID:', id);
    console.log('imageUrl是否存在:', !!productData.imageUrl);
    console.log('imageUrl长度:', productData.imageUrl ? productData.imageUrl.length : 0);

    // 将空字符串转换为 null，避免 PostgreSQL numeric 类型错误
    const toNumericOrNull = (value: any) => {
      if (value === '' || value === null || value === undefined) return null;
      return value;
    };

    // 首先尝试包含新字段的更新
    try {
      const result = await pool.query(
        `UPDATE products SET
          product_name = COALESCE($1, product_name),
          sku_name = COALESCE($2, sku_name),
          warehouse_sku = COALESCE($3, warehouse_sku),
          temu_sku = COALESCE($4, temu_sku),
          shein_sku = COALESCE($5, shein_sku),
          length = COALESCE($6, length),
          width = COALESCE($7, width),
          height = COALESCE($8, height),
          weight = COALESCE($9, weight),
          product_cost = COALESCE($10, product_cost),
          tax = COALESCE($11, tax),
          domestic_shipping = COALESCE($12, domestic_shipping),
          overseas_shipping = COALESCE($13, overseas_shipping),
          manager = COALESCE($14, manager),
          stock = COALESCE($15, stock),
          image_url = COALESCE($16, image_url),
          profit = COALESCE($17, profit),
          profit_rate = COALESCE($18, profit_rate),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $19
        RETURNING *`,
        [
          productData.productName,
          productData.skuName,
          productData.warehouseSku,
          productData.temuSku,
          productData.sheinSku,
          toNumericOrNull(productData.specs?.length),
          toNumericOrNull(productData.specs?.width),
          toNumericOrNull(productData.specs?.height),
          toNumericOrNull(productData.specs?.weight),
          productData.productCost,
          productData.tax,
          productData.domesticShipping,
          productData.overseasShipping,
          productData.manager,
          productData.stock,
          productData.imageUrl,
          productData.profit,
          productData.profitRate,
          id,
        ]
      );

      if (result.rows.length === 0) {
        console.log('未找到产品, ID:', id);
        return null;
      }

      const row = result.rows[0];
      console.log('产品更新成功（包含利润字段）, ID:', id);
      return {
        id: String(row.id),
        productName: row.product_name,
        skuName: row.sku_name,
        warehouseSku: row.warehouse_sku,
        temuSku: row.temu_sku,
        sheinSku: row.shein_sku,
        specs: {
          length: row.length,
          width: row.width,
          height: row.height,
          weight: row.weight,
        },
        productCost: parseFloat(row.product_cost),
        tax: parseFloat(row.tax),
        domesticShipping: parseFloat(row.domestic_shipping),
        firstLegShipping: parseFloat(row.first_leg_shipping || 0),
        overseasShipping: parseFloat(row.overseas_shipping),
        manager: row.manager,
        stock: row.stock,
        profit: parseFloat(row.profit || 0),
        profitRate: parseFloat(row.profit_rate || 0),
        imageUrl: row.image_url || '',
      };
    } catch (error: any) {
      // 如果新字段不存在，使用不包含新字段的更新
      if (error.code === '42703') {
        console.log('利润字段不存在，使用兼容模式更新');
        const result = await pool.query(
          `UPDATE products SET
            product_name = COALESCE($1, product_name),
            sku_name = COALESCE($2, sku_name),
            warehouse_sku = COALESCE($3, warehouse_sku),
            temu_sku = COALESCE($4, temu_sku),
            shein_sku = COALESCE($5, shein_sku),
            length = COALESCE($6, length),
            width = COALESCE($7, width),
            height = COALESCE($8, height),
            weight = COALESCE($9, weight),
            product_cost = COALESCE($10, product_cost),
            tax = COALESCE($11, tax),
            domestic_shipping = COALESCE($12, domestic_shipping),
            overseas_shipping = COALESCE($13, overseas_shipping),
            manager = COALESCE($14, manager),
            stock = COALESCE($15, stock),
            image_url = COALESCE($16, image_url),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $17
          RETURNING *`,
          [
            productData.productName,
            productData.skuName,
            productData.warehouseSku,
            productData.temuSku,
            productData.sheinSku,
            toNumericOrNull(productData.specs?.length),
            toNumericOrNull(productData.specs?.width),
            toNumericOrNull(productData.specs?.height),
            toNumericOrNull(productData.specs?.weight),
            productData.productCost,
            productData.tax,
            productData.domesticShipping,
            productData.overseasShipping,
            productData.manager,
            productData.stock,
            productData.imageUrl,
            id,
          ]
        );

        if (result.rows.length === 0) {
          console.log('未找到产品, ID:', id);
          return null;
        }

        const row = result.rows[0];
        console.log('产品更新成功（兼容模式）, ID:', id);
        return {
          id: String(row.id),
          productName: row.product_name,
          skuName: row.sku_name,
          warehouseSku: row.warehouse_sku,
          temuSku: row.temu_sku,
          sheinSku: row.shein_sku,
          specs: {
            length: row.length,
            width: row.width,
            height: row.height,
            weight: row.weight,
          },
          productCost: parseFloat(row.product_cost),
          tax: parseFloat(row.tax),
          domesticShipping: parseFloat(row.domestic_shipping),
          firstLegShipping: 0,
          overseasShipping: parseFloat(row.overseas_shipping),
          manager: row.manager,
          stock: row.stock,
          profit: 0,
          profitRate: 0,
          imageUrl: row.image_url || '',
        };
      }
      throw error;
    }
  } catch (error: any) {
    console.error('数据库更新产品失败:', error);
    console.error('错误代码:', error.code);
    console.error('错误消息:', error.message);
    throw error;
  }
}

// 删除产品
export async function deleteProduct(id: string): Promise<void> {
  await pool.query('DELETE FROM products WHERE id = $1', [id]);
}

// 批量删除产品
export async function batchDeleteProducts(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
  await pool.query(`DELETE FROM products WHERE id IN (${placeholders})`, ids);
}

// 清空所有产品
export async function clearProducts(): Promise<void> {
  await pool.query('TRUNCATE TABLE products RESTART IDENTITY CASCADE');
}
