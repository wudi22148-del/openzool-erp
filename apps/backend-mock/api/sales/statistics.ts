import { getProducts } from '../product/_storage';
import { getDailySales, isDateCleared } from './_storage';

// 使用固定的随机种子生成稳定的随机数
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// 生成模拟的日销数据
function generateMockSalesData(
  products: any[],
  startDate: string,
  endDate: string,
  mode: string = 'quantity',
) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // 获取已上传的日销数据
  const uploadedSales = getDailySales();

  // 按日期和SKU组织上传的数据
  const salesMap = new Map<string, number>();
  const ordersMap = new Map<string, number>();

  if (mode === 'orders') {
    // 订单数量模式：计算每个SKU的订单数量
    // 1. 先按订单编号分组，计算每个订单的总销量
    const orderTotals = new Map<string, number>();
    uploadedSales.forEach(record => {
      if (record.orderNumber) {
        const orderKey = `${record.date}_${record.orderNumber}`;
        orderTotals.set(orderKey, (orderTotals.get(orderKey) || 0) + record.salesQuantity);
      }
    });

    // 2. 计算每个SKU在每个订单中的订单数量占比
    uploadedSales.forEach(record => {
      const key = `${record.date}_${record.warehouseSku}`;
      if (record.orderNumber) {
        const orderKey = `${record.date}_${record.orderNumber}`;
        const orderTotal = orderTotals.get(orderKey) || record.salesQuantity;
        const orderCount = record.salesQuantity / orderTotal;
        ordersMap.set(key, (ordersMap.get(key) || 0) + orderCount);
      } else {
        // 没有订单编号的记录，每条记录算1单
        ordersMap.set(key, (ordersMap.get(key) || 0) + 1);
      }
    });
  } else {
    // 销售数量模式：累加销量
    uploadedSales.forEach(record => {
      const key = `${record.date}_${record.warehouseSku}`;
      salesMap.set(key, (salesMap.get(key) || 0) + record.salesQuantity);
    });
  }

  const salesData = products.map((product, index) => {
    const dailySales: any = {};
    const trendData: number[] = [];

    let totalSales = 0;

    // 为每一天生成销量数据
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const field = `date_${dateStr.replace(/-/g, '_')}`;

      // 检查该日期是否被清除
      if (isDateCleared(dateStr)) {
        // 如果日期被清除，显示0
        dailySales[field] = 0;
        trendData.push(0);
      } else {
        // 先检查是否有上传的数据
        const key = `${dateStr}_${product.warehouseSku}`;
        let sales = 0;

        if (mode === 'orders') {
          // 订单数量模式
          if (ordersMap.has(key)) {
            sales = ordersMap.get(key)!;
          } else {
            // 使用模拟数据：随机生成0.5-2.5单
            const seed = index * 1000 + i;
            sales = Number((0.5 + seededRandom(seed) * 2).toFixed(2));
          }
        } else {
          // 销售数量模式
          if (salesMap.has(key)) {
            sales = salesMap.get(key)!;
          } else {
            // 使用模拟数据
            const seed = index * 1000 + i;
            const baseSales = 5 + seededRandom(seed) * 45; // 5-50 的基础销量
            sales = Math.floor(baseSales);
          }
        }

        dailySales[field] = sales;
        trendData.push(sales);
        totalSales += sales;
      }
    }

    const avgDailySales = totalSales / days;

    return {
      id: product.id,
      manager: product.manager,
      productName: product.productName,
      skuName: product.skuName,
      warehouseSku: product.warehouseSku,
      totalSales,
      avgDailySales: Number(avgDailySales.toFixed(1)),
      trendData,
      ...dailySales,
    };
  });

  return salesData;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 20;
  const keyword = (query.keyword as string) || '';
  const manager = (query.manager as string) || '';
  const startDate = query.startDate as string;
  const endDate = query.endDate as string;
  const mode = (query.mode as string) || 'quantity';

  if (!startDate || !endDate) {
    return {
      code: 400,
      message: '请提供开始日期和结束日期',
    };
  }

  // 获取所有产品
  const allProducts = getProducts();

  if (allProducts.length === 0) {
    return {
      code: 0,
      data: {
        items: [],
        total: 0,
      },
    };
  }

  // 生成销售统计数据
  let salesData = generateMockSalesData(allProducts, startDate, endDate, mode);

  // 模糊搜索过滤
  if (keyword) {
    salesData = salesData.filter(
      (item) =>
        item.productName.includes(keyword) ||
        item.skuName.includes(keyword) ||
        item.warehouseSku.includes(keyword),
    );
  }

  // 管理人过滤
  if (manager) {
    salesData = salesData.filter((item) => item.manager === manager);
  }

  // 分页
  const total = salesData.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = salesData.slice(start, end);

  return {
    code: 0,
    data: {
      items,
      total,
    },
  };
});
