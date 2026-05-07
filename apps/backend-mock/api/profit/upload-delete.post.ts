import { defineEventHandler, readBody } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess, useResponseError } from '~/utils/response';
import { deleteSettlementUpload, deleteFreightCostsByMonth } from '../db/order-profit';

export default defineEventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);

  try {
    const { type, month, platform, fileType } = await readBody(event);

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return useResponseError('月份格式错误，应为 YYYY-MM');
    }

    if (type === 'freight') {
      await deleteFreightCostsByMonth(month);
      return useResponseSuccess({ message: `已删除 ${month} 运费成本数据` });
    }

    if (type === 'settlement') {
      if (!platform || !['TEMU', 'SHEIN'].includes(platform)) {
        return useResponseError('平台必须为 TEMU 或 SHEIN');
      }
      if (!fileType || !['settlement', 'order_map'].includes(fileType)) {
        return useResponseError('文件类型必须为 settlement 或 order_map');
      }
      await deleteSettlementUpload(month, platform, fileType);
      return useResponseSuccess({ message: `已删除 ${month} ${platform} ${fileType} 数据` });
    }

    return useResponseError('未知的文件类型');
  } catch (error: any) {
    console.error('删除上传数据失败:', error);
    return useResponseError(`删除失败: ${error.message}`);
  }
});
