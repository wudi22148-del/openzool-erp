import pool from './config';

// ============ 类型定义 ============

export interface FreightCostItem {
  waybillNumber: string;
  freightCost: number;
  isDomestic: boolean;
}

export interface OrderProfitRecord {
  id?: number;
  month: string;
  platform: string;
  orderNo: string;
  skuId: string;
  quantity: number;
  salesIncome: number;
  freightIncome: number;
  salesRefund: number;
  freightRefund: number;
  isDomestic: boolean;
  productCostUnit: number;
  productCostTotal: number;
  freightCost: number;
  waybillNumbers: string;
  productName: string;
  manager: string;
  profit: number;
  profitRate: number;
}

export interface ProfitSummary {
  platform: string;
  manager: string;
  orderCount: number;
  totalQuantity: number;
  totalSalesIncome: number;
  totalFreightIncome: number;
  totalSalesRefund: number;
  totalFreightRefund: number;
  totalRevenue: number;
  totalProductCost: number;
  totalFreightCost: number;
  totalProfit: number;
  profitRate: number;
}

// ============ 运费成本相关 ============

export async function insertFreightCosts(
  month: string,
  items: FreightCostItem[],
): Promise<number> {
  if (!items.length) return 0;

  // 批量 upsert，每批 500 条；同月同运单号以新数据覆盖旧数据
  const batchSize = 500;
  let inserted = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const values: any[] = [];
    const placeholders: string[] = [];

    batch.forEach((item, idx) => {
      const offset = idx * 4;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`,
      );
      values.push(month, item.waybillNumber, item.freightCost, item.isDomestic);
    });

    await pool.query(
      `INSERT INTO freight_costs (month, waybill_number, freight_cost, is_domestic)
       VALUES ${placeholders.join(', ')}
       ON CONFLICT (month, waybill_number) DO UPDATE SET
         freight_cost = EXCLUDED.freight_cost,
         is_domestic = EXCLUDED.is_domestic,
         created_at = NOW()`,
      values,
    );
    inserted += batch.length;
  }

  return inserted;
}

export async function deleteFreightCostsByMonth(
  month: string,
): Promise<void> {
  await pool.query('DELETE FROM freight_costs WHERE month = $1', [month]);
}

export async function getFreightCostMonths(): Promise<
  Array<{ month: string; count: number }>
> {
  const result = await pool.query(
    'SELECT month, COUNT(*)::int as count FROM freight_costs GROUP BY month ORDER BY month DESC',
  );
  return result.rows;
}

export async function getFreightCostsByMonths(
  months: string[],
): Promise<Map<string, { cost: number; isDomestic: boolean }>> {
  if (!months.length) return new Map();

  const result = await pool.query(
    'SELECT waybill_number, SUM(freight_cost)::float as total_cost, bool_or(is_domestic) as is_domestic FROM freight_costs WHERE month = ANY($1) GROUP BY waybill_number',
    [months],
  );

  const map = new Map<string, { cost: number; isDomestic: boolean }>();
  for (const row of result.rows) {
    map.set(row.waybill_number, {
      cost: parseFloat(row.total_cost),
      isDomestic: row.is_domestic === true,
    });
  }
  return map;
}

export async function getOrderMapByMonths(
  platform: string,
  months: string[],
): Promise<any[]> {
  if (!months.length) return [];

  const result = await pool.query(
    `SELECT file_data FROM settlement_uploads
     WHERE platform = $1 AND file_type = 'order_map' AND month = ANY($2)
     ORDER BY month DESC`,
    [platform, months],
  );

  const merged: any[] = [];
  for (const row of result.rows) {
    if (Array.isArray(row.file_data)) {
      merged.push(...row.file_data);
    }
  }
  return merged;
}



export async function saveSettlementUpload(
  month: string,
  platform: string,
  fileType: string,
  newData: any[],
): Promise<number> {
  // 1. 加载已有数据
  const existing = (await getSettlementUpload(month, platform, fileType)) ?? [];

  // 2. 内存合并：按订单号去重，新数据覆盖旧数据
  const orderKeyFn = (row: any): string => {
    if (fileType === 'order_map') {
      return String(row['订单编号'] || row['订单号'] || row['orderNo'] || '').trim();
    }
    // settlement
    return String(
      row['PO单号'] || row['poNo'] || row['订单号'] || row['orderNo'] || '',
    ).trim();
  };

  const merged = new Map<string, any>();
  let noKeyCounter = 0;
  for (const row of existing) {
    const key = orderKeyFn(row);
    if (key) merged.set(key, row);
    else merged.set(`__nokey_${noKeyCounter++}`, row);
  }
  for (const row of newData) {
    const key = orderKeyFn(row);
    if (key) merged.set(key, row); // 新数据覆盖旧数据
    else merged.set(`__nokey_${noKeyCounter++}`, row); // 无 key 行直接追加
  }
  const finalData = [...merged.values()];

  // 3. 保存（DELETE + INSERT）
  await pool.query(
    'DELETE FROM settlement_uploads WHERE month = $1 AND platform = $2 AND file_type = $3',
    [month, platform, fileType],
  );
  await pool.query(
    'INSERT INTO settlement_uploads (month, platform, file_type, file_data) VALUES ($1, $2, $3, $4)',
    [month, platform, fileType, JSON.stringify(finalData)],
  );

  return finalData.length;
}

export async function getSettlementUpload(
  month: string,
  platform: string,
  fileType: string,
): Promise<any[] | null> {
  const result = await pool.query(
    'SELECT file_data FROM settlement_uploads WHERE month = $1 AND platform = $2 AND file_type = $3 ORDER BY created_at DESC LIMIT 1',
    [month, platform, fileType],
  );

  if (result.rows.length === 0) return null;
  return result.rows[0].file_data;
}

export async function getUploadStatus(
  month: string,
): Promise<Array<{ platform: string; fileType: string; createdAt: string; rowCount: number }>> {
  const result = await pool.query(
    `SELECT platform, file_type, created_at,
      jsonb_array_length(file_data) as row_count
    FROM settlement_uploads WHERE month = $1 ORDER BY platform, file_type`,
    [month],
  );

  return result.rows.map((row: any) => ({
    platform: row.platform,
    fileType: row.file_type,
    createdAt: row.created_at,
    rowCount: row.row_count,
  }));
}

export async function getAllUploads(): Promise<Array<{
  type: string;
  month: string;
  platform: string | null;
  fileType: string | null;
  rowCount: number;
  createdAt: string;
}>> {
  // Settlement & order_map uploads
  const settlementResult = await pool.query(
    `SELECT 'settlement' as type, month, platform, file_type,
      jsonb_array_length(file_data) as row_count, created_at
    FROM settlement_uploads
    ORDER BY month DESC, platform, file_type`,
  );

  // Freight cost uploads (grouped by month)
  const freightResult = await pool.query(
    `SELECT 'freight' as type, month, NULL as platform, NULL as file_type,
      COUNT(*)::int as row_count, MAX(created_at) as created_at
    FROM freight_costs
    GROUP BY month
    ORDER BY month DESC`,
  );

  const rows = [
    ...settlementResult.rows.map((r: any) => ({
      type: r.type,
      month: r.month,
      platform: r.platform,
      fileType: r.file_type,
      rowCount: r.row_count,
      createdAt: r.created_at,
    })),
    ...freightResult.rows.map((r: any) => ({
      type: r.type,
      month: r.month,
      platform: null,
      fileType: null,
      rowCount: r.row_count,
      createdAt: r.created_at,
    })),
  ];

  // Sort by month DESC then type
  rows.sort((a, b) => {
    if (b.month !== a.month) return b.month.localeCompare(a.month);
    return a.type.localeCompare(b.type);
  });

  return rows;
}

export async function deleteSettlementUpload(
  month: string,
  platform: string,
  fileType: string,
): Promise<void> {
  await pool.query(
    'DELETE FROM settlement_uploads WHERE month = $1 AND platform = $2 AND file_type = $3',
    [month, platform, fileType],
  );
}

// ============ 订单利润记录相关 ============

export async function insertOrderProfitRecords(
  month: string,
  records: OrderProfitRecord[],
): Promise<number> {
  if (!records.length) return 0;

  // 先删除该月旧数据
  await pool.query('DELETE FROM order_profit_records WHERE month = $1', [month]);

  const batchSize = 500;
  let inserted = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const values: any[] = [];
    const placeholders: string[] = [];

    batch.forEach((r, idx) => {
      const offset = idx * 18;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}, $${offset + 17}, $${offset + 18})`,
      );
      values.push(
        month, r.platform, r.orderNo, r.skuId, r.quantity,
        r.salesIncome, r.freightIncome, r.salesRefund, r.freightRefund,
        r.isDomestic, r.productCostUnit, r.productCostTotal, r.freightCost,
        r.waybillNumbers, r.productName, r.manager, r.profit, r.profitRate,
      );
    });

    await pool.query(
      `INSERT INTO order_profit_records
        (month, platform, order_no, sku_id, quantity,
         sales_income, freight_income, sales_refund, freight_refund,
         is_domestic, product_cost_unit, product_cost_total, freight_cost,
         waybill_numbers, product_name, manager, profit, profit_rate)
      VALUES ${placeholders.join(', ')}`,
      values,
    );
    inserted += batch.length;
  }

  return inserted;
}

export async function getOrderProfitRecords(
  month: string,
  manager?: string,
  page?: number,
  pageSize?: number,
  platform?: string,
  filters?: { noManager?: boolean; noProductCost?: boolean; noFreightCost?: boolean },
): Promise<{ items: any[]; total: number }> {
  let whereClause = 'WHERE month = $1';
  const params: any[] = [month];
  let paramIdx = 2;

  if (manager) {
    whereClause += ` AND manager = $${paramIdx}`;
    params.push(manager);
    paramIdx++;
  }

  if (platform) {
    whereClause += ` AND platform = $${paramIdx}`;
    params.push(platform);
    paramIdx++;
  }

  if (filters?.noManager) {
    whereClause += ` AND (manager IS NULL OR manager = '')`;
  }
  if (filters?.noProductCost) {
    whereClause += ` AND (product_cost_total = 0 OR product_cost_total IS NULL)`;
  }
  if (filters?.noFreightCost) {
    whereClause += ` AND (freight_cost = 0 OR freight_cost IS NULL)`;
  }

  // 总数
  const countResult = await pool.query(
    `SELECT COUNT(*)::int as total FROM order_profit_records ${whereClause}`,
    params,
  );
  const total = countResult.rows[0].total;

  // 分页查询
  let query = `SELECT * FROM order_profit_records ${whereClause} ORDER BY id`;
  const queryParams = [...params];

  if (page && pageSize) {
    query += ` LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    queryParams.push(pageSize, (page - 1) * pageSize);
  }

  const result = await pool.query(query, queryParams);

  const items = result.rows.map((row: any) => ({
    id: row.id,
    month: row.month,
    platform: row.platform,
    orderNo: row.order_no,
    skuId: row.sku_id,
    quantity: row.quantity,
    salesIncome: parseFloat(row.sales_income),
    freightIncome: parseFloat(row.freight_income),
    salesRefund: parseFloat(row.sales_refund),
    freightRefund: parseFloat(row.freight_refund),
    isDomestic: row.is_domestic,
    productCostUnit: parseFloat(row.product_cost_unit),
    productCostTotal: parseFloat(row.product_cost_total),
    freightCost: parseFloat(row.freight_cost),
    waybillNumbers: row.waybill_numbers || '',
    productName: row.product_name || '',
    manager: row.manager || '',
    profit: parseFloat(row.profit),
    profitRate: parseFloat(row.profit_rate),
  }));

  return { items, total };
}

export async function getOrderProfitSummary(
  month: string,
  manager?: string,
  platform?: string,
  filters?: { noManager?: boolean; noProductCost?: boolean; noFreightCost?: boolean },
): Promise<ProfitSummary[]> {
  let whereClause = 'WHERE month = $1';
  const params: any[] = [month];
  let paramIdx = 2;

  if (manager) {
    whereClause += ` AND manager = $${paramIdx}`;
    params.push(manager);
    paramIdx++;
  }

  if (platform) {
    whereClause += ` AND platform = $${paramIdx}`;
    params.push(platform);
    paramIdx++;
  }

  if (filters?.noManager) {
    whereClause += ` AND (manager IS NULL OR manager = '')`;
  }
  if (filters?.noProductCost) {
    whereClause += ` AND (product_cost_total = 0 OR product_cost_total IS NULL)`;
  }
  if (filters?.noFreightCost) {
    whereClause += ` AND (freight_cost = 0 OR freight_cost IS NULL)`;
  }

  const result = await pool.query(
    `SELECT
      platform,
      manager,
      COUNT(DISTINCT order_no)::int as order_count,
      SUM(quantity)::int as total_quantity,
      SUM(sales_income)::float as total_sales_income,
      SUM(freight_income)::float as total_freight_income,
      SUM(sales_refund)::float as total_sales_refund,
      SUM(freight_refund)::float as total_freight_refund,
      SUM(product_cost_total)::float as total_product_cost,
      SUM(freight_cost)::float as total_freight_cost,
      SUM(profit)::float as total_profit
    FROM order_profit_records
    ${whereClause}
    GROUP BY platform, manager
    ORDER BY platform, manager`,
    params,
  );

  return result.rows.map((row: any) => {
    const totalRevenue =
      row.total_sales_income +
      row.total_freight_income -
      row.total_sales_refund -
      row.total_freight_refund;
    return {
      platform: row.platform,
      manager: row.manager,
      orderCount: row.order_count,
      totalQuantity: row.total_quantity,
      totalSalesIncome: row.total_sales_income,
      totalFreightIncome: row.total_freight_income,
      totalSalesRefund: row.total_sales_refund,
      totalFreightRefund: row.total_freight_refund,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalProductCost: row.total_product_cost,
      totalFreightCost: row.total_freight_cost,
      totalProfit: row.total_profit,
      profitRate:
        totalRevenue !== 0
          ? Math.round((row.total_profit / totalRevenue) * 10000) / 100
          : 0,
    };
  });
}

export async function getCalculatedMonths(): Promise<string[]> {
  const result = await pool.query(
    'SELECT DISTINCT month FROM order_profit_records ORDER BY month DESC',
  );
  return result.rows.map((row: any) => row.month);
}
