import { deleteUser } from '../db/users';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');

    if (!id) {
      return {
        code: 400,
        message: '用户ID不能为空',
      };
    }

    await deleteUser(Number(id));

    return {
      code: 0,
      message: '用户删除成功',
    };
  } catch (error: any) {
    console.error('删除用户失败:', error);
    return {
      code: 500,
      message: error.message || '删除用户失败',
    };
  }
});
