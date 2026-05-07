import { deleteProfitHistory, getProfitHistory } from '../db/profit';
import { verifyAccessToken } from '../../utils/jwt-utils';

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    try {
      const query = getQuery(event);
      const productId = Number(query.productId);
      if (!productId) return { code: -1, data: [], message: 'productId is required' };
      const history = await getProfitHistory(productId);
      return { code: 0, data: history, message: 'success' };
    } catch (error: any) {
      return { code: -1, data: [], message: error.message };
    }
  }

  if (method === 'DELETE') {
    try {
      const userinfo = verifyAccessToken(event);
      if (!userinfo || !['admin', 'supervisor'].includes(userinfo.role)) {
        return { code: -1, data: null, message: '无权限' };
      }
      const query = getQuery(event);
      const id = Number(query.id);
      await deleteProfitHistory(id);
      return { code: 0, data: null, message: '删除成功' };
    } catch (error: any) {
      return { code: -1, data: null, message: error.message };
    }
  }

  return { code: -1, data: null, message: '不支持的请求方法' };
});
