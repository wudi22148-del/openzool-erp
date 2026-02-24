import { deleteProfitCalculation, getJpyExchangeRate, getProfitCalculations, saveProfitCalculation } from '../db/profit';
import { updateProduct } from '../db/products';

export default defineEventHandler(async (event) => {
  const method = event.method;

  // 获取利润计算列表
  if (method === 'GET') {
    try {
      const calculations = await getProfitCalculations();
      return {
        code: 0,
        data: calculations,
        message: 'success',
      };
    } catch (error: any) {
      console.error('获取利润计算列表失败:', error);
      return {
        code: -1,
        data: null,
        message: error.message || '获取利润计算列表失败',
      };
    }
  }

  // 保存利润计算
  if (method === 'POST') {
    try {
      const body = await readBody(event);
      const calculation = await saveProfitCalculation(body);

      // 同时更新产品表中的利润和利润率
      await updateProduct(String(body.productId), {
        profit: body.profitRmb,
        profitRate: body.profitRate,
      });

      return {
        code: 0,
        data: calculation,
        message: '保存成功',
      };
    } catch (error: any) {
      console.error('保存利润计算失败:', error);
      return {
        code: -1,
        data: null,
        message: error.message || '保存利润计算失败',
      };
    }
  }

  // 删除利润计算
  if (method === 'DELETE') {
    try {
      const query = getQuery(event);
      const id = Number(query.id);
      await deleteProfitCalculation(id);
      return {
        code: 0,
        data: null,
        message: '删除成功',
      };
    } catch (error: any) {
      console.error('删除利润计算失败:', error);
      return {
        code: -1,
        data: null,
        message: error.message || '删除利润计算失败',
      };
    }
  }

  return {
    code: -1,
    data: null,
    message: '不支持的请求方法',
  };
});
