import { getDailySales } from './_storage';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const date = query.date as string;

  if (!date) {
    return {
      code: 400,
      message: '请提供日期参数',
    };
  }

  try {
    const allSales = await getDailySales();
    const dateSales = allSales.filter(s => s.date === date);

    const stats = {
      date,
      totalRecords: dateSales.length,
      totalQuantity: dateSales.reduce((sum, s) => sum + s.salesQuantity, 0),
      uniqueSkus: new Set(dateSales.map(s => s.warehouseSku)).size,
      sampleData: dateSales.slice(0, 10),
    };

    return {
      code: 0,
      data: stats,
    };
  } catch (error: any) {
    return {
      code: 500,
      message: error.message,
    };
  }
});
