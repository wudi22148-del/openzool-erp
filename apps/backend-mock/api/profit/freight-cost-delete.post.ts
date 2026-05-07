import { defineEventHandler, readBody } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess, useResponseError } from '~/utils/response';
import { deleteFreightCostsByMonth } from '../db/order-profit';

export default defineEventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);

  try {
    const { month } = await readBody(event);
    if (!month) return useResponseError('月份不能为空');

    await deleteFreightCostsByMonth(month);
    return useResponseSuccess({ month });
  } catch (error: any) {
    console.error('删除运费成本失败:', error);
    return useResponseError(`删除失败: ${error.message}`);
  }
});
