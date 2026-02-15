import { addProducts, getProducts } from './_storage';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // 模拟批量导入处理
  console.log('批量导入产品数据:', body);
  console.log('第一个产品的specs:', body[0]?.specs);

  // 为导入的产品生成 ID
  const existingProducts = getProducts();
  const startId = existingProducts.length > 0
    ? Math.max(...existingProducts.map(p => Number(p.id) || 0)) + 1
    : 1;

  const productsWithIds = body.map((product: any, index: number) => ({
    ...product,
    id: String(startId + index),
  }));

  console.log('添加ID后的产品specs:', productsWithIds[0]?.specs);

  // 将数据添加到共享存储
  const newProducts = addProducts(productsWithIds);

  // 模拟延迟
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    code: 0,
    data: {
      success: true,
      message: `成功导入 ${body.length} 条产品数据`,
      count: body.length,
    },
  };
});
