import { defineEventHandler, readBody } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess, useResponseError } from '~/utils/response';
import pool from '../db/config';

// 运营确认反馈已处理
export default defineEventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);

  try {
    const body = await readBody(event);
    const { id } = body;

    if (!id) return useResponseError('反馈ID不能为空');

    // 只允许提交人确认
    const existing = await pool.query(
      'SELECT feedback_by, status FROM order_profit_feedback WHERE id = $1',
      [id],
    );
    if (!existing.rows.length) return useResponseError('反馈记录不存在');
    if (existing.rows[0].feedback_by !== userinfo.username) {
      return useResponseError('只有反馈提交人才能确认');
    }
    if (existing.rows[0].status !== 'resolved') {
      return useResponseError('该反馈尚未被处理');
    }

    await pool.query(
      `UPDATE order_profit_feedback SET status = 'confirmed', updated_at = NOW() WHERE id = $1`,
      [id],
    );

    return useResponseSuccess({ id });
  } catch (error: any) {
    console.error('确认反馈失败:', error);
    return useResponseError(`确认失败: ${error.message}`);
  }
});
