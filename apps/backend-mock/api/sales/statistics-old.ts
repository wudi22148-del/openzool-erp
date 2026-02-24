import { getProducts, getFilteredProducts } from '../product/_storage';
import { getDailySales, isDateCleared } from './_storage';

// 使用固定的随机种子生成稳定的随机数
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// 生成模拟的日销数据
async function generateMockSalesData(
  products: any[],
  startDate: string,
  endDate: string,
  mode: string = 'quantity',
) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // 获取已上传的日销数据
  const uploadedSales = await getDailySales();

  console.log('统计查询参数:', { startDate, endDate, mode, uploadedSalesCount: uploadedSales.length });
  if (uploadedSales.length > 0) {
    console.log('第一条日销数据:', uploadedSales[0]);
  }
  console.log('产品数量:', products.length);
  if (products.length > 0) {
    console.log('第一个产品:', products[0]);
  }

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

      // 只使用上传的真实数据，不生成模拟数据
      const key = `${dateStr}_${product.warehouseSku}`;
      let sales = 0;

      if (mode === 'orders') {
        // 订单数量模式
        if (ordersMap.has(key)) {
          sales = ordersMap.get(key)!;
        }
      } else {
        // 销售数量模式
        if (salesMap.has(key)) {
          sales = salesMap.get(key)!;
        }
      }

      dailySales[field] = sales;
      trendData.push(sales);
      totalSales += sales;
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

  // 获取所有产品（已优化，不包含图片数据）
  // 注意：这里需要获取所有产品来生成销售数据，但已经排除了imageUrl字段
  const allProducts = await getProducts();

  if (allProducts.length === 0) {
    return {
      code: 0,
      data: {
        items: [],
        total: 0,
      },
    };
  }

  // 如果有关键词或管理人筛选，先过滤产品列表再生成销售数据
  let filteredProducts = allProducts;
  if (keyword) {
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.productName.includes(keyword) ||
        p.skuName.includes(keyword) ||
        p.warehouseSku.includes(keyword),
    );
  }
  if (manager) {
    filteredProducts = filteredProducts.filter((p) => p.manager === manager);
  }

  // 生成销售统计数据（只为过滤后的产品生成）
  let salesData = await generateMockSalesData(filteredProducts, startDate, endDate, mode);

  // 过滤掉所有日期销量都为0的产品（总销量为0）
  salesData = salesData.filter((item) => item.totalSales > 0);

  // 计算每个日期列的总销量，过滤掉全为0的日期列
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const validDates: string[] = [];

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    const field = `date_${dateStr.replace(/-/g, '_')}`;

    // 检查这一天是否有任何产品有销量
    const hasData = salesData.some((item) => item[field] > 0);
    if (hasData) {
      validDates.push(field);
    }
  }

  // 从每个产品数据中移除无效的日期字段
  salesData = salesData.map((item) => {
    const filteredItem: any = {
      id: item.id,
      manager: item.manager,
      productName: item.productName,
      skuName: item.skuName,
      warehouseSku: item.warehouseSku,
      totalSales: item.totalSales,
      avgDailySales: item.avgDailySales,
      trendData: item.trendData,
    };

    // 只保留有效的日期字段
    validDates.forEach((dateField) => {
      filteredItem[dateField] = item[dateField];
    });

    return filteredItem;
  });

  // 分页
  const total = salesData.length;
  const start_idx = (page - 1) * pageSize;
  const end_idx = start_idx + pageSize;
  const items = salesData.slice(start_idx, end_idx);

  return {
    code: 0,
    data: {
      items,
      total,
    },
  };
});
