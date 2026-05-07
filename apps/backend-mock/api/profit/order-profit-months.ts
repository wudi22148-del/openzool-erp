import { defineEventHandler, getQuery } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess, useResponseError } from '~/utils/response';
import { getCalculatedMonths, getFreightCostMonths, getUploadStatus } from '../db/order-profit';

export default defineEventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);

  try {
    const query = getQuery(event);
    const month = query.month ? String(query.month) : undefined;

    const [calculatedMonths, freightMonths] = await Promise.all([
      getCalculatedMonths(),
      getFreightCostMonths(),
    ]);

    let uploadStatus: any[] = [];
    if (month) {
      uploadStatus = await getUploadStatus(month);
    }

    return useResponseSuccess({
      calculatedMonths,
      freightMonths,
      uploadStatus,
    });
  } catch (error: any) {
    console.error('查询月份信息失败:', error);
    return useResponseError(`查询失败: ${error.message}`);
  }
});
