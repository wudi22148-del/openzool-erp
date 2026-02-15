import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:appstore-outlined',
      order: 2,
      title: '产品管理',
    },
    name: 'Product',
    path: '/product',
    component: () => import('#/views/erp/product/index.vue'),
  },
];

export default routes;
