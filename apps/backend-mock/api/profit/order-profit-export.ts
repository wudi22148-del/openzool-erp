import { defineEventHandler, getQuery } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess, useResponseError } from '~/utils/response';
import { getOrderProfitRecords } from '../db/order-profit';
import { getUserByUsername } from '../db/users';

export default defineEventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);

  try {
    const query = getQuery(event);
    const month = String(query.month || '');
    let manager = query.manager ? String(query.manager) : undefined;
    const platform = query.platform ? String(query.platform) : undefined;
    const noManager = query.noManager === '1';
    const noProductCost = query.noProductCost === '1';
    const noFreightCost = query.noFreightCost === '1';
    const isDomesticRaw = query.isDomestic;
    const isDomestic = isDomesticRaw === '1' ? true : isDomesticRaw === '0' ? false : null;
    const keyword = query.keyword ? String(query.keyword).trim() : undefined;
    const sortField = query.sortField ? String(query.sortField) : undefined;
    const sortOrder = query.sortOrder ? String(query.sortOrder) : undefined;

    if (!month) {
      return useResponseError('月份不能为空');
    }

    const currentUser = await getUserByUsername(userinfo.username);
    const userRole = currentUser?.role || 'operator';
    if (userRole === 'operator' || userRole === 'user') {
      if (!noManager && !noProductCost) {
        manager = currentUser?.realName || userinfo.realName || userinfo.username;
      }
    }

    // 导出不分页，返回全量数据
    const result = await getOrderProfitRecords(
      month, manager, undefined, undefined, platform,
      { noManager, noProductCost, noFreightCost, isDomestic },
      keyword, sortField, sortOrder,
    );
    return useResponseSuccess(result.items);
  } catch (error: any) {
    console.error('导出利润明细失败:', error);
    return useResponseError(`导出失败: ${error.message}`);
  }
});
