import { getProductById } from './_storage';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    return {
      code: 400,
      message: '缺少产品ID',
    };
  }

  try {
    const product = await getProductById(id);

    if (!product) {
      return {
        code: 404,
        message: '产品不存在',
      };
    }

    return {
      code: 0,
      data: product,
    };
  } catch (error: any) {
    console.error('获取产品详情失败:', error);
    return {
      code: 500,
      message: `获取失败: ${error.message}`,
    };
  }
});
