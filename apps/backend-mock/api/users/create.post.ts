import { createUser, usernameExists } from '../db/users';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // 验证必填字段
    if (!body.username || !body.password || !body.realName || !body.role) {
      return {
        code: 400,
        message: '用户名、密码、姓名和角色为必填项',
      };
    }

    // 检查用户名是否已存在
    const exists = await usernameExists(body.username);
    if (exists) {
      return {
        code: 400,
        message: '用户名已存在',
      };
    }

    // 验证角色
    if (!['admin', 'supervisor', 'operator'].includes(body.role)) {
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

    const user = await createUser({
      username: body.username,
      password: body.password, // 实际应用中应该加密
      realName: body.realName,
      email: body.email,
      phone: body.phone,
      role: body.role,
      managerName: body.managerName,
      status: body.status || 'active',
    });

    return {
      code: 0,
      data: user,
      message: '用户创建成功',
    };
  } catch (error: any) {
    console.error('创建用户失败:', error);
    return {
      code: 500,
      message: error.message || '创建用户失败',
    };
  }
});
