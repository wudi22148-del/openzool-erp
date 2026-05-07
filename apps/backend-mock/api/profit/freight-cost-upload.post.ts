import { defineEventHandler, readBody } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess, useResponseError } from '~/utils/response';
import { insertFreightCosts } from '../db/order-profit';

export default defineEventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);

  try {
    const { month, items } = await readBody(event);

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return useResponseError('月份格式错误，应为 YYYY-MM');
    }
    if (!Array.isArray(items) || items.length === 0) {
      return useResponseError('运费成本数据不能为空');
    }

    const count = await insertFreightCosts(month, items);
    return useResponseSuccess({ count, month });
  } catch (error: any) {
    console.error('上传运费成本失败:', error);
    return useResponseError(`上传失败: ${error.message}`);
  }
});
