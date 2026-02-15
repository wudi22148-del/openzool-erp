// 销售数据存储
interface DailySalesRecord {
  date: string;
  warehouseSku: string;
  salesQuantity: number;
  orderNumber?: string; // 订单编号
}

interface ClearedDateRange {
  startDate: string;
  endDate: string;
}

interface SalesStorage {
  dailySales: DailySalesRecord[];
  clearedRanges: ClearedDateRange[];
}

const salesStorage: SalesStorage = {
  dailySales: [],
  clearedRanges: [],
};

export function getDailySales(): DailySalesRecord[] {
  return salesStorage.dailySales;
}

export function getClearedRanges(): ClearedDateRange[] {
  return salesStorage.clearedRanges;
}

export function isDateCleared(date: string): boolean {
  return salesStorage.clearedRanges.some(range => {
    return date >= range.startDate && date <= range.endDate;
  });
}

export function addDailySales(records: DailySalesRecord[]): void {
  // 覆盖相同日期和SKU的数据
  records.forEach(newRecord => {
    const existingIndex = salesStorage.dailySales.findIndex(
      r => r.date === newRecord.date && r.warehouseSku === newRecord.warehouseSku
    );

    if (existingIndex >= 0) {
      // 覆盖旧数据
      salesStorage.dailySales[existingIndex] = newRecord;
    } else {
      // 添加新数据
      salesStorage.dailySales.push(newRecord);
    }

    // 移除该日期的清除标记
    salesStorage.clearedRanges = salesStorage.clearedRanges.filter(range => {
      return newRecord.date < range.startDate || newRecord.date > range.endDate;
    });
  });
}

export function deleteDailySales(date: string, warehouseSku?: string): void {
  if (warehouseSku) {
    // 删除指定日期和SKU的数据
    salesStorage.dailySales = salesStorage.dailySales.filter(
      r => !(r.date === date && r.warehouseSku === warehouseSku)
    );
  } else {
    // 删除指定日期的所有数据
    salesStorage.dailySales = salesStorage.dailySales.filter(r => r.date !== date);
  }
}

export function clearDailySales(startDate?: string, endDate?: string): void {
  if (startDate && endDate) {
    // 清除指定日期范围的数据
    salesStorage.dailySales = salesStorage.dailySales.filter(r => {
      return r.date < startDate || r.date > endDate;
    });
    // 记录被清除的日期范围
    salesStorage.clearedRanges.push({ startDate, endDate });
  } else {
    // 清空所有数据
    salesStorage.dailySales = [];
    salesStorage.clearedRanges = [];
  }
}
