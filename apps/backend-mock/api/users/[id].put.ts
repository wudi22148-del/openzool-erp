import { updateUser, usernameExists } from '../db/users';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    const body = await readBody(event);

    if (!id) {
      return {
        code: 400,
        message: '用户ID不能为空',
      };
    }

    // 如果更新了用户名，检查是否已存在
    if (body.username) {
      const exists = await usernameExists(body.username, Number(id));
      if (exists) {
        return {
          code: 400,
          message: '用户名已存在',
        };
      }
    }

    // 验证角色
    if (body.role && !['admin', 'supervisor', 'operator'].includes(body.role)) {
      return {
        code: 400,
        message: '无效的角色类型',
      };
    }

    // 如果是运营角色，必须指定管理人
    if (body.role === 'operator' && !body.managerName) {
      return {
        code: 400,
        message: '运营角色必须指定管理人',
      };
      }

    const user = await updateUser(Number(id), body);

    if (!user) {
      return {
        code: 404,
        message: '用户不存在',
      };
    }

    return {
      code: 0,
      data: user,
      message: '用户更新成功',
    };
  } catch (error: any) {
    console.error('更新用户失败:', error);
    return {
      code: 500,
      message: error.message || '更新用户失败',
    };
  }
});
