import { getProducts } from './_storage';

export default defineEventHandler(async () => {
  try {
    // 从产品数据中提取所有管理人
    const products = await getProducts();
    const managerSet = new Set<string>();

    products.forEach(product => {
      if (product.manager) {
        managerSet.add(product.manager);
      }
    });

    // 转换为数组并排序
    const managers = Array.from(managerSet).sort().map((name, index) => ({
      id: String(index + 1),
      name: name,
    }));

    return {
      code: 0,
      data: managers,
    };
  } catch (error) {
    console.error('获取管理人列表失败:', error);
    return {
      code: 500,
      message: '获取管理人列表失败',
      data: [],
    };
  }
});
