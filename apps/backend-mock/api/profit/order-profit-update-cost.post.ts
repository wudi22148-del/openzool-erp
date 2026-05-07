import { defineEventHandler, readBody } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess, useResponseError } from '~/utils/response';
import pool from '../db/config';
import { getUserByUsername } from '../db/users';

export default defineEventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);

  const currentUser = await getUserByUsername(userinfo.username);
  const userRole = currentUser?.role || 'operator';
  if (userRole === 'operator' || userRole === 'user') {
    return useResponseError('权限不足');
  }

  try {
    const body = await readBody(event);
    const { id, productCostUnit, productCostTotal, freightCost } = body;

    if (!id) return useResponseError('记录ID不能为空');

    // 获取当前记录
    const existing = await pool.query(
      'SELECT * FROM order_profit_records WHERE id = $1',
      [id],
    );
    if (!existing.rows.length) return useResponseError('记录不存在');

    const row = existing.rows[0];
    const newProductCostUnit = productCostUnit !== undefined ? Number(productCostUnit) : parseFloat(row.product_cost_unit);
    const newProductCostTotal = productCostTotal !== undefined ? Number(productCostTotal) : parseFloat(row.product_cost_total);
    const newFreightCost = freightCost !== undefined ? Number(freightCost) : parseFloat(row.freight_cost);

    // 重新计算利润
    const salesIncome = parseFloat(row.sales_income);
    const freightIncome = parseFloat(row.freight_income);
    const salesRefund = parseFloat(row.sales_refund);
    const freightRefund = parseFloat(row.freight_refund);
    const totalRevenue = salesIncome + freightIncome - salesRefund - freightRefund;
    const newProfit = totalRevenue - newProductCostTotal - newFreightCost;
    const newProfitRate = totalRevenue !== 0 ? Math.round((newProfit / totalRevenue) * 10000) / 100 : 0;

    await pool.query(
      `UPDATE order_profit_records SET
        product_cost_unit = $1, product_cost_total = $2, freight_cost = $3,
        profit = $4, profit_rate = $5
       WHERE id = $6`,
      [newProductCostUnit, newProductCostTotal, newFreightCost, newProfit, newProfitRate, id],
    );

    return useResponseSuccess({
      id,
      productCostUnit: newProductCostUnit,
      productCostTotal: newProductCostTotal,
      freightCost: newFreightCost,
      profit: newProfit,
      profitRate: newProfitRate,
    });
  } catch (error: any) {
    console.error('更新成本失败:', error);
    return useResponseError(`更新失败: ${error.message}`);
  }
});
