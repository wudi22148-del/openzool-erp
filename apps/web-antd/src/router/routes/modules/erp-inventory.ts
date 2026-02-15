import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:inbox-outlined',
      order: 4,
      title: '库存管理',
    },
    name: 'Inventory',
    path: '/inventory',
    children: [
      {
        name: 'InventoryOverview',
        path: '/inventory/overview',
        component: () => import('#/views/erp/inventory/overview/index.vue'),
        meta: {
          icon: 'ant-design:bar-chart-outlined',
          title: '库存概览',
        },
      },
      {
        name: 'InventoryMovements',
        path: '/inventory/movements',
        component: () => import('#/views/erp/inventory/movements/index.vue'),
        meta: {
          icon: 'ant-design:swap-outlined',
          title: '出入库流水',
        },
      },
      {
        name: 'InventoryWarehouses',
        path: '/inventory/warehouses',
        component: () => import('#/views/erp/inventory/warehouses/index.vue'),
        meta: {
          icon: 'ant-design:home-outlined',
          title: '仓库管理',
        },
      },
      {
        name: 'InventoryAlerts',
        path: '/inventory/alerts',
        component: () => import('#/views/erp/inventory/alerts/index.vue'),
        meta: {
          icon: 'ant-design:alert-outlined',
          title: '库存预警',
        },
      },
    ],
  },
];

export default routes;
