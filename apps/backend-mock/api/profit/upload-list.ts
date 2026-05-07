import { defineEventHandler } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess, useResponseError } from '~/utils/response';
import { getAllUploads } from '../db/order-profit';

export default defineEventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);

  try {
    const uploads = await getAllUploads();
    return useResponseSuccess(uploads);
  } catch (error: any) {
    console.error('查询上传记录失败:', error);
    return useResponseError(`查询失败: ${error.message}`);
  }
});
