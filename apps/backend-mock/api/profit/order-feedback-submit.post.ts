import { defineEventHandler, readBody } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess, useResponseError } from '~/utils/response';
import pool from '../db/config';

export default defineEventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);

  try {
    const body = await readBody(event);
    const { orderProfitId, feedbackText } = body;

    if (!orderProfitId) return useResponseError('订单ID不能为空');
    if (!feedbackText || !feedbackText.trim()) return useResponseError('反馈内容不能为空');

    const result = await pool.query(
      `INSERT INTO order_profit_feedback (order_profit_id, feedback_text, feedback_by, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id`,
      [orderProfitId, feedbackText.trim(), userinfo.username],
    );

    return useResponseSuccess({ id: result.rows[0].id });
  } catch (error: any) {
    console.error('提交反馈失败:', error);
    return useResponseError(`提交失败: ${error.message}`);
  }
});
