import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:line-chart-outlined',
      order: 3,
      title: '销售统计',
    },
    name: 'Sales',
    path: '/sales',
    component: () => import('#/views/erp/sales/index.vue'),
  },
];

export default routes;
