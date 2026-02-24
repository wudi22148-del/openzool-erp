import pool from './config';

export interface ProfitCalculation {
  id?: number;
  productId: number;
  productName: string;
  warehouseSku: string;
  productCost: number;
  tax: number;
  domesticShipping: number;
  firstLegShipping: number;
  totalCost: number;
  priceRmb: number;
  priceJpy: number;
  shippingSubsidy: number;
  profitRmb: number;
  profitRate: number;
  profitRateNoSubsidy: number;
  jpyExchangeRate: number;
  manager?: string;
}

// 获取所有利润计算记录
export async function getProfitCalculations(): Promise<ProfitCalculation[]> {
  const result = await pool.query(`
    SELECT
      id, product_id, product_name, warehouse_sku,
      product_cost, tax, domestic_shipping, first_leg_shipping,
      total_cost, price_rmb, price_jpy, shipping_subsidy,
      profit_rmb, profit_rate, profit_rate_no_subsidy,
      jpy_exchange_rate, manager, created_at, updated_at
    FROM product_profit_calculations
    ORDER BY id DESC
  `);

  return result.rows.map(row => ({
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    warehouseSku: row.warehouse_sku,
    productCost: parseFloat(row.product_cost),
    tax: parseFloat(row.tax),
    domesticShipping: parseFloat(row.domestic_shipping),
    firstLegShipping: parseFloat(row.first_leg_shipping),
    totalCost: parseFloat(row.total_cost),
    priceRmb: parseFloat(row.price_rmb),
    priceJpy: parseFloat(row.price_jpy),
    shippingSubsidy: parseFloat(row.shipping_subsidy),
    profitRmb: parseFloat(row.profit_rmb),
    profitRate: parseFloat(row.profit_rate),
    profitRateNoSubsidy: parseFloat(row.profit_rate_no_subsidy),
    jpyExchangeRate: parseFloat(row.jpy_exchange_rate),
    manager: row.manager,
  }));
}

// 添加或更新利润计算
export async function saveProfitCalculation(data: ProfitCalculation): Promise<ProfitCalculation> {
  // 先查询是否存在该产品的利润计算记录
  const checkResult = await pool.query(
    'SELECT id FROM product_profit_calculations WHERE product_id = $1',
    [data.productId]
  );

  let result;
  if (checkResult.rows.length > 0) {
    // 如果存在，则更新
    result = await pool.query(
      `UPDATE product_profit_calculations SET
        product_name = $2,
        warehouse_sku = $3,
        product_cost = $4,
        tax = $5,
        domestic_shipping = $6,
        first_leg_shipping = $7,
        total_cost = $8,
        price_rmb = $9,
        price_jpy = $10,
        shipping_subsidy = $11,
        profit_rmb = $12,
        profit_rate = $13,
        profit_rate_no_subsidy = $14,
        jpy_exchange_rate = $15,
        manager = $16,
        updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $1
      RETURNING *`,
      [
        data.productId,
        data.productName,
        data.warehouseSku,
        data.productCost,
        data.tax,
        data.domesticShipping,
        data.firstLegShipping,
        data.totalCost,
        data.priceRmb,
        data.priceJpy,
        data.shippingSubsidy,
        data.profitRmb,
        data.profitRate,
        data.profitRateNoSubsidy,
        data.jpyExchangeRate,
        data.manager,
      ]
    );
  } else {
    // 如果不存在，则插入
    result = await pool.query(
      `INSERT INTO product_profit_calculations (
        product_id, product_name, warehouse_sku,
        product_cost, tax, domestic_shipping, first_leg_shipping,
        total_cost, price_rmb, price_jpy, shipping_subsidy,
        profit_rmb, profit_rate, profit_rate_no_subsidy,
        jpy_exchange_rate, manager
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        data.productId,
        data.productName,
        data.warehouseSku,
        data.productCost,
        data.tax,
        data.domesticShipping,
        data.firstLegShipping,
        data.totalCost,
        data.priceRmb,
        data.priceJpy,
        data.shippingSubsidy,
        data.profitRmb,
        data.profitRate,
        data.profitRateNoSubsidy,
        data.jpyExchangeRate,
        data.manager,
      ]
    );
  }

  const row = result.rows[0];
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    warehouseSku: row.warehouse_sku,
    productCost: parseFloat(row.product_cost),
    tax: parseFloat(row.tax),
    domesticShipping: parseFloat(row.domestic_shipping),
    firstLegShipping: parseFloat(row.first_leg_shipping),
    totalCost: parseFloat(row.total_cost),
    priceRmb: parseFloat(row.price_rmb),
    priceJpy: parseFloat(row.price_jpy),
    shippingSubsidy: parseFloat(row.shipping_subsidy),
    profitRmb: parseFloat(row.profit_rmb),
    profitRate: parseFloat(row.profit_rate),
    profitRateNoSubsidy: parseFloat(row.profit_rate_no_subsidy),
    jpyExchangeRate: parseFloat(row.jpy_exchange_rate),
    manager: row.manager,
  };
}

// 删除利润计算记录
export async function deleteProfitCalculation(id: number): Promise<void> {
  await pool.query('DELETE FROM product_profit_calculations WHERE id = $1', [id]);
}

// 获取当前日元汇率（这里使用固定值，实际应该从API获取）
export async function getJpyExchangeRate(): Promise<number> {
  // 实际应该调用汇率API，这里返回一个示例值
  return 0.045; // 1 JPY = 0.045 RMB
}
