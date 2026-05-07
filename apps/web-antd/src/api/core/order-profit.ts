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

export interface OrderProfitQueryParams {
  month: string;
  manager?: string;
  platform?: string;
  page?: number;
  pageSize?: number;
  noManager?: string;
  noProductCost?: string;
  noFreightCost?: string;
  isDomestic?: string;
  keyword?: string;
  sortField?: string;
  sortOrder?: string;
}

export function getOrderProfitList(params: OrderProfitQueryParams) {
  return requestClient.get('/profit/order-profit-list', { params });
}

export function getOrderProfitSummary(params: Omit<OrderProfitQueryParams, 'page' | 'pageSize' | 'sortField' | 'sortOrder'>) {
  return requestClient.get('/profit/order-profit-summary', { params });
}

export function exportOrderProfit(params: Omit<OrderProfitQueryParams, 'page' | 'pageSize'>) {
  return requestClient.get('/profit/order-profit-export', { params });
}

export function getOrderProfitMonths(month?: string) {
  return requestClient.get('/profit/order-profit-months', {
    params: month ? { month } : {},
  });
}

export function updateOrderProfitCost(data: {
  id: number;
  productCostUnit?: number;
  productCostTotal?: number;
  freightCost?: number;
}) {
  return requestClient.post('/profit/order-profit-update-cost', data);
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

// ============ 订单异常反馈 ============

export function submitOrderFeedback(data: { orderProfitId: number; feedbackText: string }) {
  return requestClient.post('/profit/order-feedback-submit', data);
}

export function getOrderFeedbackList(params?: { status?: string; month?: string }) {
  return requestClient.get('/profit/order-feedback-list', { params });
}

export function resolveOrderFeedback(data: { id: number; resolveNote?: string }) {
  return requestClient.post('/profit/order-feedback-resolve', data);
}

export function confirmOrderFeedback(data: { id: number }) {
  return requestClient.post('/profit/order-feedback-confirm', data);
}
