import { defineEventHandler, readBody } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess, useResponseError } from '~/utils/response';
import { saveSettlementUpload } from '../db/order-profit';

export default defineEventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);

  try {
    const { month, platform, fileType, data } = await readBody(event);

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return useResponseError('月份格式错误，应为 YYYY-MM');
    }
    if (!platform || !['TEMU', 'SHEIN'].includes(platform)) {
      return useResponseError('平台必须为 TEMU 或 SHEIN');
    }
    if (!fileType || !['settlement', 'order_map'].includes(fileType)) {
      return useResponseError('文件类型必须为 settlement 或 order_map');
    }
    if (!Array.isArray(data) || data.length === 0) {
      return useResponseError('数据不能为空');
    }

    const count = await saveSettlementUpload(month, platform, fileType, data);
    return useResponseSuccess({ count, month, platform, fileType });
  } catch (error: any) {
    console.error('上传结算数据失败:', error);
    return useResponseError(`上传失败: ${error.message}`);
  }
});
