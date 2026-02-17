import { addDailySales } from './_storage';
import { getProducts } from '../product/_storage';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // 获取上传的日销数据
    const salesData = body;

    if (!Array.isArray(salesData) || salesData.length === 0) {
      return {
        code: 400,
        message: '上传数据不能为空',
      };
    }

    console.log('接收到日销数据:', salesData.length, '条');
    if (salesData.length > 0) {
      console.log('第一条日销数据:', salesData[0]);
    }

    // 获取所有产品的SKU列表
    const products = await getProducts();
    const productSkuSet = new Set(products.map(p => p.warehouseSku));

    // 检查哪些SKU不在产品库中
    const uploadedSkus = new Set(salesData.map(record => record.warehouseSku));
    const missingSkus = Array.from(uploadedSkus).filter(sku => !productSkuSet.has(sku));

    // 过滤出有效的数据（SKU存在于产品库中）
    const validData = salesData.filter(record => productSkuSet.has(record.warehouseSku));
    const invalidData = salesData.filter(record => !productSkuSet.has(record.warehouseSku));

    // 计算有效数据和无效数据的销量总和
    const validQuantity = validData.reduce((sum, record) => sum + record.salesQuantity, 0);
    const invalidQuantity = invalidData.reduce((sum, record) => sum + record.salesQuantity, 0);

    // 如果有有效数据，先上传
    if (validData.length > 0) {
      await addDailySales(validData);
    }

    // 如果有缺失的SKU，返回警告信息（但已上传有效数据）
    if (missingSkus.length > 0) {
      console.log('发现缺失的SKU:', missingSkus);
      console.log(`有效数据: ${validData.length}条, 销量: ${validQuantity}件`);
      console.log(`无效数据: ${invalidData.length}条, 销量: ${invalidQuantity}件`);
      return {
        code: 0,
        message: `已成功上传${validData.length}条数据（${validQuantity}件销量），跳过${invalidData.length}条数据（${invalidQuantity}件销量）。以下${missingSkus.length}个SKU不在产品库中：${missingSkus.slice(0, 10).join(', ')}${missingSkus.length > 10 ? '...' : ''}`,
        data: {
          uploadedCount: validData.length,
          uploadedQuantity: validQuantity,
          skippedCount: invalidData.length,
          skippedQuantity: invalidQuantity,
          missingSkus: missingSkus,
          missingCount: missingSkus.length,
        },
      };
    }

    return {
      code: 0,
      message: '上传成功',
      data: {
        count: salesData.length,
      },
    };
  } catch (error) {
    console.error('日销数据上传失败:', error);
    return {
      code: 500,
      message: `上传失败: ${error.message}`,
      data: null,
    };
  }
});
