import { updateProduct } from './_storage';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);

  console.log('更新产品:', id, body);
  console.log('更新产品specs:', body.specs);

  // 更新产品
  const updatedProduct = updateProduct(id!, body);

  if (!updatedProduct) {
    return {
      code: 404,
      message: '产品不存在',
    };
  }

  console.log('更新后的产品:', updatedProduct);
  console.log('更新后的产品specs:', updatedProduct.specs);

  // 模拟延迟
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    code: 0,
    data: updatedProduct,
  };
});
