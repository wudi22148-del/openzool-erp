import { addDailySales } from './_storage';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // 获取上传的日销数据
  const salesData = body;

  if (!Array.isArray(salesData) || salesData.length === 0) {
    return {
      code: 400,
      message: '上传数据不能为空',
    };
  }

  // 存储数据（会自动覆盖相同日期和SKU的数据）
  addDailySales(salesData);

  console.log('接收到日销数据:', salesData.length, '条');

  return {
    code: 0,
    message: '上传成功',
    data: {
      count: salesData.length,
    },
  };
});
