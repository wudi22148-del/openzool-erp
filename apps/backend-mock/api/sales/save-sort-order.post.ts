import pool from '../db/config';
import { verifyAccessToken } from '~/utils/jwt-utils';

// 保存销售统计的排序顺序
export default defineEventHandler(async (event) => {
  // 验证用户权限
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return {
      code: 401,
      message: '未授权',
    };
  }

  // 只有 admin 和 supervisor 可以保存排序
  if (!['admin', 'supervisor'].includes(userinfo.roles[0])) {
    return {
      code: 403,
      message: '无权限操作',
    };
  }

  try {
    const body = await readBody(event);
    const { sortOrders } = body;

    if (!sortOrders || !Array.isArray(sortOrders)) {
      return {
        code: 400,
        message: '参数错误',
      };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 批量更新排序顺序
      for (const item of sortOrders) {
        await client.query(
          'UPDATE products SET sales_sort_order = $1 WHERE id = $2',
          [item.sortOrder, item.id]
        );
      }

      await client.query('COMMIT');

      return {
        code: 0,
        message: '保存成功',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('保存排序失败:', error);
    return {
      code: 500,
      message: error.message || '保存失败',
    };
  }
});
