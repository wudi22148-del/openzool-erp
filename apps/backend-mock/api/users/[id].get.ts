import { getUserById } from '../db/users';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      return {
        code: 400,
        message: '用户ID不能为空',
      };
    }

    const user = await getUserById(Number(id));

    if (!user) {
      return {
        code: 404,
        message: '用户不存在',
      };
    }

    return {
      code: 0,
      data: user,
    };
  } catch (error: any) {
    console.error('获取用户详情失败:', error);
    return {
      code: 500,
      message: error.message || '获取用户详情失败',
    };
  }
});
