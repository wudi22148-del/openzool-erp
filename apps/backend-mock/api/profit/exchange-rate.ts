import { getJpyExchangeRate } from '../db/profit';

export default defineEventHandler(async (event) => {
  try {
    const rate = await getJpyExchangeRate();
    return {
      code: 0,
      data: { rate },
      message: 'success',
    };
  } catch (error: any) {
    console.error('获取汇率失败:', error);
    return {
      code: -1,
      data: null,
      message: error.message || '获取汇率失败',
    };
  }
});
