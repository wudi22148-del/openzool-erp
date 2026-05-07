import { requestClient } from '#/api/request';

// ============ 运费成本 ============

export function uploadFreightCost(data: { month: string; items: Array<{ waybillNumber: string; freightCost: number }> }) {
  return requestClient.post('/profit/freight-cost-upload', data);
}

export function getFreightCostList() {
  return requestClient.get('/profit/freight-cost-list');
}

export function deleteFreightCost(month: string) {
  return requestClient.post('/profit/freight-cost-delete', { month });
}

// ============ 结算数据 ============

export function uploadSettlement(data: {
  month: string;
  platform: string;
  fileType: string;
  data: any[];
}) {
  return requestClient.post('/profit/settlement-upload', data);
}

// ============ 利润计算 ============

export function calculateOrderProfit(data: { month: string; platform: string }) {
  return requestClient.post('/profit/order-profit-calculate', data);
}

// ============ 利润查询 ============

export function getOrderProfitList(params: {
  month: string;
  manager?: string;
  platform?: string;
  page?: number;
  pageSize?: number;
}) {
  return requestClient.get('/profit/order-profit-list', { params });
}

export function getOrderProfitSummary(params: {
  month: string;
  manager?: string;
  platform?: string;
}) {
  return requestClient.get('/profit/order-profit-summary', { params });
}

export function getOrderProfitMonths(month?: string) {
  return requestClient.get('/profit/order-profit-months', {
    params: month ? { month } : {},
  });
}

// ============ 上传管理 ============

export function getUploadList() {
  return requestClient.get('/profit/upload-list');
}

export function deleteUpload(data: {
  type: 'freight' | 'settlement';
  month: string;
  platform?: string;
  fileType?: string;
}) {
  return requestClient.post('/profit/upload-delete', data);
}
