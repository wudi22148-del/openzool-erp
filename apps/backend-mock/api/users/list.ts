import { getUsers } from '../db/users';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 20;
  const keyword = (query.keyword as string) || '';
  const role = (query.role as string) || '';
  const status = (query.status as string) || '';

  try {
    const result = await getUsers(
      page,
      pageSize,
      keyword || undefined,
      role || undefined,
      status || undefined
    );

    return {
      code: 0,
      data: {
        items: result.items,
        total: result.total,
      },
    };
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
    return {
      code: 500,
      message: error.message || '获取用户列表失败',
    };
  }
});
