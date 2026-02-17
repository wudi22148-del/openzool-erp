import pool from './config';

export interface DailySalesRecord {
  date: string;
  warehouseSku: string;
  salesQuantity: number;
  orderNumber?: string;
}

// 获取所有日销数据
export async function getDailySales(): Promise<DailySalesRecord[]> {
  const result = await pool.query(
    'SELECT * FROM daily_sales ORDER BY date DESC, warehouse_sku'
  );

  return result.rows.map(row => {
    // 使用本地时区格式化日期，避免UTC转换问题
    const date = new Date(row.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return {
      date: `${year}-${month}-${day}`,
      warehouseSku: row.warehouse_sku,
      salesQuantity: parseFloat(row.sales_quantity),
      orderNumber: row.order_number,
    };
  });
}

// 添加日销数据
export async function addDailySales(records: DailySalesRecord[]): Promise<void> {
  if (records.length === 0) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 构建批量插入的 SQL
    const values: any[] = [];
    const placeholders: string[] = [];

    records.forEach((record, index) => {
      const offset = index * 4;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`
      );

      values.push(
        record.date,
        record.warehouseSku,
        record.salesQuantity,
        record.orderNumber || null
      );
    });

    const sql = `
      INSERT INTO daily_sales (date, warehouse_sku, sales_quantity, order_number)
      VALUES ${placeholders.join(', ')}
    `;

    await client.query(sql, values);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// 删除指定日期和SKU的数据
export async function deleteDailySales(date: string, warehouseSku?: string): Promise<void> {
  if (warehouseSku) {
    await pool.query(
      'DELETE FROM daily_sales WHERE date = $1 AND warehouse_sku = $2',
      [date, warehouseSku]
    );
  } else {
    await pool.query('DELETE FROM daily_sales WHERE date = $1', [date]);
  }
}

// 清除指定日期范围的数据
export async function clearDailySales(startDate?: string, endDate?: string): Promise<void> {
  if (startDate && endDate) {
    await pool.query(
      'DELETE FROM daily_sales WHERE date >= $1 AND date <= $2',
      [startDate, endDate]
    );
  } else {
    await pool.query('TRUNCATE TABLE daily_sales RESTART IDENTITY');
  }
}
