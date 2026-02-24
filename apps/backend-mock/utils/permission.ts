import { verifyAccessToken } from '~/utils/jwt-utils';

// 权限检查中间件
export function checkPermission(event: any, requiredRole?: string[]) {
  const userinfo = verifyAccessToken(event);

  if (!userinfo) {
    return {
      authorized: false,
      user: null,
      error: '未授权',
    };
  }

  // 如果指定了需要的角色，检查用户角色
  if (requiredRole && requiredRole.length > 0) {
    const hasRole = requiredRole.some(role => userinfo.roles?.includes(role));
    if (!hasRole) {
      return {
        authorized: false,
        user: userinfo,
        error: '权限不足',
      };
    }
  }

  return {
    authorized: true,
    user: userinfo,
    error: null,
  };
}

// 数据过滤：根据用户角色过滤数据
export function filterDataByRole(userinfo: any, manager?: string) {
  // 如果用户是运营角色，只能看到自己管理的数据
  if (userinfo.roles?.includes('user') || userinfo.roles?.includes('operator')) {
    // 从用户信息中获取管理人名称
    const userManagerName = userinfo.managerName || userinfo.realName;
    return userManagerName;
  }

  // 管理员和主管可以看到所有数据，或者按指定的manager筛选
  return manager;
}

// 检查用户是否可以访问用户管理模块
export function canAccessUserManagement(userinfo: any): boolean {
  // 只有管理员和主管可以访问用户管理
  return userinfo.roles?.includes('super') ||
         userinfo.roles?.includes('admin') ||
         userinfo.roles?.includes('supervisor');
}
