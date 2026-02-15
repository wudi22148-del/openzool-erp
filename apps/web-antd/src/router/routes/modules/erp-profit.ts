import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:dollar-circle-outlined',
      order: 4,
      title: '利润核算',
    },
    name: 'Profit',
    path: '/profit',
    children: [
      {
        name: 'ProfitDashboard',
        path: '/profit/dashboard',
        component: () => import('#/views/erp/profit/dashboard/index.vue'),
        meta: {
          icon: 'ant-design:fund-outlined',
          title: '利润看板',
        },
      },
      {
        name: 'ProfitOrderProfit',
        path: '/profit/order-profit',
        component: () => import('#/views/erp/profit/order-profit/index.vue'),
        meta: {
          icon: 'ant-design:file-text-outlined',
          title: '订单利润明细',
        },
      },
      {
        name: 'ProfitCostSettings',
        path: '/profit/cost-settings',
        component: () => import('#/views/erp/profit/cost-settings/index.vue'),
        meta: {
          icon: 'ant-design:setting-outlined',
          title: '成本设置',
        },
      },
      {
        name: 'ProfitAllocations',
        path: '/profit/allocations',
        component: () => import('#/views/erp/profit/allocations/index.vue'),
        meta: {
          icon: 'ant-design:calculator-outlined',
          title: '费用分摊规则',
        },
      },
    ],
  },
];

export default routes;
