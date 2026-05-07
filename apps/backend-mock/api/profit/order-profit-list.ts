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
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 50;
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

    // 权限控制：operator 只能看自己的数据，但无管理人/无产品成本的订单所有运营都可以看到
    const currentUser = await getUserByUsername(userinfo.username);
    const userRole = currentUser?.role || 'operator';
    if (userRole === 'operator' || userRole === 'user') {
      // 如果筛选了无管理人或无产品成本，则不限制 manager
      if (!noManager && !noProductCost) {
        manager = currentUser?.realName || userinfo.realName || userinfo.username;
      }
    }

    const result = await getOrderProfitRecords(month, manager, page, pageSize, platform, { noManager, noProductCost, noFreightCost, isDomestic }, keyword, sortField, sortOrder);
    return useResponseSuccess(result);
  } catch (error: any) {
    console.error('查询利润明细失败:', error);
    return useResponseError(`查询失败: ${error.message}`);
  }
});
