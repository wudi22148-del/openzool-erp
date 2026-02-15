import { clearDailySales } from './_storage';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { startDate, endDate } = body || {};

  // 清空指定日期范围的日销数据
  clearDailySales(startDate, endDate);

  return {
    code: 0,
    message: '清除成功',
  };
});
