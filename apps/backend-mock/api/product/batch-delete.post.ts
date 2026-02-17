import { batchDeleteProducts } from './_storage';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const ids = body.ids || [];

    if (!Array.isArray(ids) || ids.length === 0) {
      return {
        code: 400,
        message: '请提供要删除的产品ID列表',
      };
    }

    await batchDeleteProducts(ids);

    return {
      code: 0,
      data: {
        success: true,
        message: `成功删除 ${ids.length} 个产品`,
        count: ids.length,
      },
    };
  } catch (error) {
    console.error('批量删除产品失败:', error);
    return {
      code: 500,
      message: `批量删除失败: ${error.message}`,
      data: null,
    };
  }
});
