import { defineEventHandler } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess, useResponseError } from '~/utils/response';
import { getFreightCostMonths } from '../db/order-profit';

export default defineEventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);

  try {
    const months = await getFreightCostMonths();
    return useResponseSuccess(months);
  } catch (error: any) {
    console.error('查询运费成本月份失败:', error);
    return useResponseError(`查询失败: ${error.message}`);
  }
});
