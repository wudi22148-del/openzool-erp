import XLSX from 'xlsx';
import path from 'path';
import os from 'os';

// 生成日期范围（60天）
function generateDateRange(days) {
  const dates = [];
  const startDate = new Date('2024-01-01');
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

// 生成随机数量
function randomQuantity(min = 1, max = 10) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成随机SKU数组
function randomSkus(allSkus, count) {
  const shuffled = [...allSkus].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// 生成测试数据
const testData = [];
const dates = generateDateRange(60);
const skus = Array.from({ length: 50 }, (_, i) => `WH-${String(i + 1).padStart(3, '0')}`);

let orderNumber = 1;

dates.forEach(date => {
  // 每天生成 8-15 个订单
  const ordersPerDay = randomQuantity(8, 15);

  for (let i = 0; i < ordersPerDay; i++) {
    const orderNum = `ORD-${String(orderNumber).padStart(5, '0')}`;

    // 70% 单SKU订单，30% 多SKU订单
    const isMultiSku = Math.random() > 0.7;
    const skuCount = isMultiSku ? randomQuantity(2, 4) : 1;
    const orderSkus = randomSkus(skus, skuCount);

    orderSkus.forEach(sku => {
      testData.push({
        '订单编号': orderNum,
        '日期*': date,
        '仓库SKU*': sku,
        '销售数量*': randomQuantity(1, 8),
      });
    });

    orderNumber++;
  }
});

// 创建工作表
const worksheet = XLSX.utils.json_to_sheet(testData);

// 设置列宽
worksheet['!cols'] = [
  { wch: 12 }, // 订单编号
  { wch: 12 }, // 日期
  { wch: 12 }, // 仓库SKU
  { wch: 10 }, // 销售数量
];

// 创建工作簿
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, '日销数据');

// 获取桌面路径并写入文件
const desktopPath = path.join(os.homedir(), 'Desktop', 'OpenZool_ERP_日销测试数据.xlsx');
XLSX.writeFile(workbook, desktopPath);

console.log(`测试数据文件已生成到桌面: ${desktopPath}`);
console.log('数据说明:');
console.log(`- 包含 60 天的销售数据 (${dates[0]} 到 ${dates[dates.length - 1]})`);
console.log(`- 包含约 ${orderNumber - 1} 个订单`);
console.log(`- 包含 50 个仓库SKU (WH-001 到 WH-050)`);
console.log(`- 总计 ${testData.length} 条销售记录`);
console.log('- 订单类型: 70% 单SKU订单, 30% 多SKU订单(2-4个SKU)');
