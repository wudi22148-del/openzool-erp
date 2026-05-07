import { defineEventHandler, readBody } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess, useResponseError } from '~/utils/response';
import pool from '../db/config';
import { getUserByUsername } from '../db/users';

// 主管/管理员推送处理结果回运营
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
    const { id, resolveNote } = body;

    if (!id) return useResponseError('反馈ID不能为空');

    await pool.query(
      `UPDATE order_profit_feedback SET
        resolve_note = $1, resolved_by = $2, resolved_at = NOW(),
        status = 'resolved', updated_at = NOW()
       WHERE id = $3`,
      [resolveNote || null, userinfo.username, id],
    );

    return useResponseSuccess({ id });
  } catch (error: any) {
    console.error('处理反馈失败:', error);
    return useResponseError(`处理失败: ${error.message}`);
  }
});
