import { deleteProduct } from './_storage';

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;

  // 从数据库中删除产品
  if (id) {
    await deleteProduct(id);
  }

  return {
    code: 0,
    data: {
      success: true,
      message: '删除成功',
    },
  };
});
