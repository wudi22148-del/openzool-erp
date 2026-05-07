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
        name: 'ProfitCalculation',
        path: '/profit/calculation',
        component: () => import('#/views/erp/profit/calculation/index.vue'),
        meta: {
          icon: 'ant-design:calculator-outlined',
          title: '产品利润计算',
        },
      },
      {
        name: 'ProfitDataUpload',
        path: '/profit/data-upload',
        component: () => import('#/views/erp/profit/data-upload/index.vue'),
        meta: {
          icon: 'ant-design:cloud-upload-outlined',
          title: '数据上传管理',
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
    ],
  },
];

export default routes;
