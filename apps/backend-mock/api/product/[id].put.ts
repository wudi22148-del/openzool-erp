import { updateProduct } from './_storage';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);

  console.log('更新产品 ID:', id);
  console.log('更新产品数据:', JSON.stringify(body).substring(0, 500)); // 只打印前500字符避免日志过长
  console.log('imageUrl长度:', body.imageUrl ? body.imageUrl.length : 0);

  try {
    // 更新产品
    const updatedProduct = await updateProduct(id!, body);

    if (!updatedProduct) {
      console.error('产品不存在, ID:', id);
      return {
        code: 404,
        message: '产品不存在',
      };
    }

    console.log('产品更新成功, ID:', id);

    return {
      code: 0,
      data: { success: true },
    };
  } catch (error: any) {
    console.error('更新产品失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
    return {
      code: 500,
      message: `更新失败: ${error.message}`,
    };
  }
});
