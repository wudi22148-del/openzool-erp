import { requestClient } from '#/api/request';

/**
 * 获取销售统计数据
 */
export async function getSalesStatistics(params?: any) {
  return requestClient.get('/sales/statistics', { params });
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
