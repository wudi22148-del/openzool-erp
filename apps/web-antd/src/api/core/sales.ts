import { requestClient } from '#/api/request';

/**
 * 获取销售统计数据
 */
export async function getSalesStatistics(params?: any) {
  return requestClient.get('/sales/statistics', { params });
}

/**
 * 获取销售统计总计数据
 */
export async function getSalesStatisticsTotals(params?: any) {
  return requestClient.get('/sales/statistics-totals', { params });
}

/**
 * 上传日销数据
 */
export async function uploadDailySales(data: any[]) {
  return requestClient.post('/sales/daily-upload', data);
}

/**
 * 删除日销数据
 */
export async function deleteDailySales(date: string, warehouseSku?: string) {
  return requestClient.post('/sales/daily-delete', { date, warehouseSku });
}

/**
 * 清空所有日销数据
 */
export async function clearDailySales(params?: { startDate?: string; endDate?: string }) {
  return requestClient.post('/sales/daily-clear', params);
}

/**
 * 保存销售统计排序顺序
 */
export async function saveSalesSortOrder(sortOrders: Array<{ id: number; sortOrder: number }>) {
  return requestClient.post('/sales/save-sort-order', { sortOrders });
}
