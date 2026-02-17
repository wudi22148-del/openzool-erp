import * as db from '../db/sales';

// 销售数据存储
export interface DailySalesRecord {
  date: string;
  warehouseSku: string;
  salesQuantity: number;
  orderNumber?: string;
}

export interface ClearedDateRange {
  startDate: string;
  endDate: string;
}

export async function getDailySales(): Promise<DailySalesRecord[]> {
  return await db.getDailySales();
}

export function getClearedRanges(): ClearedDateRange[] {
  // 数据库版本不需要清除标记，直接返回空数组
  return [];
}

export function isDateCleared(date: string): boolean {
  // 数据库版本不需要清除标记
  return false;
}

export async function addDailySales(records: DailySalesRecord[]): Promise<void> {
  await db.addDailySales(records);
}

export async function deleteDailySales(date: string, warehouseSku?: string): Promise<void> {
  await db.deleteDailySales(date, warehouseSku);
}

export async function clearDailySales(startDate?: string, endDate?: string): Promise<void> {
  await db.clearDailySales(startDate, endDate);
}
