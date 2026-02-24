import { eventHandler } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';
import { getUsers } from '../db/users';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 获取用户角色
  const users = await getUsers();
  const currentUser = users.find(u => u.username === userinfo.username);
  const userRole = currentUser?.role || 'operator';

  // 基础菜单（所有角色都可见）
  const dashboardMenus = [
    {
      meta: {
        order: -1,
        title: 'page.dashboard.title',
      },
      name: 'Dashboard',
      path: '/dashboard',
      redirect: '/analytics',
      children: [
        {
          name: 'Analytics',
          path: '/analytics',
          component: '/dashboard/analytics/index',
          meta: {
            affixTab: true,
            title: 'page.dashboard.analytics',
          },
        },
        {
          name: 'Workspace',
          path: '/workspace',
          component: '/dashboard/workspace/index',
          meta: {
            title: 'page.dashboard.workspace',
          },
        },
      ],
    },
  ];

  // ERP 菜单（所有角色都可见）
  const erpMenus = [
    {
      meta: {
        icon: 'ant-design:appstore-outlined',
        order: 1,
        title: 'ERP 管理',
      },
      name: 'Erp',
      path: '/erp',
      redirect: '/erp/product',
      children: [
        {
          name: 'Product',
          path: '/erp/product',
          component: '/erp/product/index',
          meta: {
            icon: 'ant-design:shopping-outlined',
            title: '产品管理',
          },
        },
        {
          name: 'Sales',
          path: '/erp/sales',
          component: '/erp/sales/index',
          meta: {
            icon: 'ant-design:line-chart-outlined',
            title: '销售统计',
          },
        },
        {
          name: 'Profit',
          path: '/erp/profit',
          component: '/erp/profit/index',
          meta: {
            icon: 'ant-design:dollar-outlined',
            title: '利润分析',
          },
        },
      ],
    },
  ];

  // 用户管理菜单（仅 admin 和 supervisor 可见）
  const userManagementMenu = {
    meta: {
      icon: 'ant-design:user-outlined',
      order: 6,
      title: '用户管理',
    },
    name: 'User',
    path: '/user',
    component: '/erp/user/index',
  };

  // 根据角色组装菜单
  let menus = [...dashboardMenus, ...erpMenus];

  if (userRole === 'admin' || userRole === 'supervisor') {
    menus.push(userManagementMenu);
  }

  return useResponseSuccess(menus);
});
