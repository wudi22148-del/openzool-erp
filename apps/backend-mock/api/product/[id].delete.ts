import { deleteProduct } from './_storage';

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;

  // 从共享存储中删除产品
  if (id) {
    deleteProduct(id);
  }

  // 模拟延迟
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    code: 0,
    data: {
      success: true,
      message: '删除成功',
    },
  };
});
