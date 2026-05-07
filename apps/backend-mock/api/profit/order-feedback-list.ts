import { defineEventHandler, getQuery } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess, useResponseError } from '~/utils/response';
import pool from '../db/config';
import { getUserByUsername } from '../db/users';

export default defineEventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);

  try {
    const query = getQuery(event);
    const status = query.status ? String(query.status) : undefined;
    const month = query.month ? String(query.month) : undefined;

    const currentUser = await getUserByUsername(userinfo.username);
    const userRole = currentUser?.role || 'operator';

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIdx = 1;

    // operator 只能看自己提交的反馈
    if (userRole === 'operator' || userRole === 'user') {
      whereClause += ` AND f.feedback_by = $${paramIdx}`;
      params.push(userinfo.username);
      paramIdx++;
    }

    if (status) {
      whereClause += ` AND f.status = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }

    if (month) {
      whereClause += ` AND opr.month = $${paramIdx}`;
      params.push(month);
      paramIdx++;
    }

    const result = await pool.query(
      `SELECT
        f.id, f.order_profit_id, f.feedback_text, f.feedback_by, f.feedback_at,
        f.resolve_note, f.resolved_by, f.resolved_at, f.status,
        opr.month, opr.platform, opr.order_no, opr.sku_id, opr.product_name,
        opr.manager, opr.profit, opr.profit_rate,
        opr.product_cost_unit, opr.product_cost_total, opr.freight_cost,
        opr.sales_income, opr.freight_income, opr.sales_refund, opr.freight_refund
       FROM order_profit_feedback f
       JOIN order_profit_records opr ON opr.id = f.order_profit_id
       ${whereClause}
       ORDER BY f.created_at DESC`,
      params,
    );

    const items = result.rows.map((row: any) => ({
      id: row.id,
      orderProfitId: row.order_profit_id,
      feedbackText: row.feedback_text,
      feedbackBy: row.feedback_by,
      feedbackAt: row.feedback_at,
      resolveNote: row.resolve_note,
      resolvedBy: row.resolved_by,
      resolvedAt: row.resolved_at,
      status: row.status,
      month: row.month,
      platform: row.platform,
      orderNo: row.order_no,
      skuId: row.sku_id,
      productName: row.product_name,
      manager: row.manager,
      profit: parseFloat(row.profit),
      profitRate: parseFloat(row.profit_rate),
      productCostUnit: parseFloat(row.product_cost_unit),
      productCostTotal: parseFloat(row.product_cost_total),
      freightCost: parseFloat(row.freight_cost),
      salesIncome: parseFloat(row.sales_income),
      freightIncome: parseFloat(row.freight_income),
      salesRefund: parseFloat(row.sales_refund),
      freightRefund: parseFloat(row.freight_refund),
    }));

    return useResponseSuccess(items);
  } catch (error: any) {
    console.error('获取反馈列表失败:', error);
    return useResponseError(`查询失败: ${error.message}`);
  }
});
