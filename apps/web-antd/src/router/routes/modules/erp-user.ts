import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:user-outlined',
      order: 6,
      title: '用户管理',
    },
    name: 'User',
    path: '/user',
    component: () => import('#/views/erp/user/index.vue'),
  },
];

export default routes;
