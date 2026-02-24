import { getFilteredProducts } from './_storage';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { filterDataByRole } from '~/utils/permission';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 20;
  const keyword = (query.keyword as string) || '';
  let manager = (query.manager as string) || '';

  // 获取当前用户信息
  const userinfo = verifyAccessToken(event);

  // 根据用户角色过滤数据
  if (userinfo) {
    manager = filterDataByRole(userinfo, manager);
  }

  // 使用数据库级别的过滤和分页，大幅提升性能
  const result = await getFilteredProducts(
    page,
    pageSize,
    keyword || undefined,
    manager || undefined
  );

  console.log('获取产品列表，当前页:', page, '每页:', pageSize, '总数:', result.total, '管理人:', manager);

  return {
    code: 0,
    data: {
      items: result.items,
      total: result.total,
    },
  };
});
