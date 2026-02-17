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
  overseasShipping: number;
  manager: string;
  stock?: number;
  imageUrl?: string;
}

// 获取所有产品（添加分页支持）
export async function getProducts(page?: number, pageSize?: number): Promise<Product[]> {
  let query = 'SELECT * FROM products ORDER BY id DESC';
  const params: any[] = [];

  if (page && pageSize) {
    const offset = (page - 1) * pageSize;
    query += ' LIMIT $1 OFFSET $2';
    params.push(pageSize, offset);
  }

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
    overseasShipping: parseFloat(row.overseas_shipping),
    manager: row.manager,
    stock: row.stock,
    imageUrl: row.image_url,
  }));
}

// 获取产品总数
export async function getProductsCount(): Promise<number> {
  const result = await pool.query('SELECT COUNT(*) FROM products');
  return parseInt(result.rows[0].count);
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
      const offset = index * 16;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16})`
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
        product_cost, tax, domestic_shipping, overseas_shipping,
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
      overseasShipping: parseFloat(row.overseas_shipping),
      manager: row.manager,
      stock: row.stock,
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
      productData.specs?.length,
      productData.specs?.width,
      productData.specs?.height,
      productData.specs?.weight,
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

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
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
    overseasShipping: parseFloat(row.overseas_shipping),
    manager: row.manager,
    stock: row.stock,
    imageUrl: row.image_url,
  };
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
