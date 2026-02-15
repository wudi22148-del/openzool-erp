import { deleteDailySales } from './_storage';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const { date, warehouseSku } = body;

  if (!date) {
    return {
      code: 400,
      message: '日期不能为空',
    };
  }

  // 删除数据
  deleteDailySales(date, warehouseSku);

  return {
    code: 0,
    message: '删除成功',
  };
});
