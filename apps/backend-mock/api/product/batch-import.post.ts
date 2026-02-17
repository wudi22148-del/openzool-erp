import { addProducts } from './_storage';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // 批量导入产品数据
    console.log('批量导入产品数据:', body.length, '条');
    if (body.length > 0) {
      console.log('第一个产品的specs:', body[0]?.specs);
    }

    // 数据库会自动生成 ID，不需要手动添加
    const productsWithoutIds = body.map((product: any) => {
      const { id, ...rest } = product;
      return rest;
    });

    // 按仓库SKU分组，合并相同SKU的产品
    const skuMap = new Map();

    productsWithoutIds.forEach((product: any) => {
      const sku = product.warehouseSku;

      if (!skuMap.has(sku)) {
        // 第一次遇到这个SKU，直接添加
        skuMap.set(sku, { ...product });
      } else {
        // 已存在相同SKU，检查是否完全相同
        const existing = skuMap.get(sku);

        // 检查所有字段是否相同（除了平台SKU）
        const isSameProduct =
          existing.productName === product.productName &&
          existing.skuName === product.skuName &&
          existing.productCost === product.productCost &&
          existing.tax === product.tax &&
          existing.domesticShipping === product.domesticShipping &&
          existing.overseasShipping === product.overseasShipping &&
          existing.manager === product.manager &&
          JSON.stringify(existing.specs) === JSON.stringify(product.specs);

        if (isSameProduct) {
          // 如果其他字段都相同，只合并平台SKU

          // 合并TEMU SKU
          if (product.temuSku) {
            const existingTemuSkus = existing.temuSku ?
              existing.temuSku.toString().split(',').map(s => s.trim()).filter(s => s) : [];
            const newTemuSku = product.temuSku.toString().trim();

            if (newTemuSku && !existingTemuSkus.includes(newTemuSku)) {
              existingTemuSkus.push(newTemuSku);
              existing.temuSku = existingTemuSkus.join(',');
            }
          }

          // 合并SHEIN SKU
          if (product.sheinSku) {
            const existingSheinSkus = existing.sheinSku ?
              existing.sheinSku.toString().split(',').map(s => s.trim()).filter(s => s) : [];
            const newSheinSku = product.sheinSku.toString().trim();

            if (newSheinSku && !existingSheinSkus.includes(newSheinSku)) {
              existingSheinSkus.push(newSheinSku);
              existing.sheinSku = existingSheinSkus.join(',');
            }
          }
        } else {
          // 如果其他字段不同，说明是不同的产品，不应该合并
          // 这种情况下，我们保留第一条记录，忽略后续的（或者可以报错）
          console.warn(`仓库SKU ${sku} 存在多条不同的产品数据，已忽略重复项`);
        }
      }
    });

    // 转换为数组
    const mergedProducts = Array.from(skuMap.values());

    console.log(`原始数据 ${body.length} 条，合并后 ${mergedProducts.length} 条`);

    // 将数据添加到数据库
    const newProducts = await addProducts(mergedProducts);

    return {
      code: 0,
      data: {
        success: true,
        message: `成功导入 ${mergedProducts.length} 条产品数据（原始 ${body.length} 条，已自动合并重复SKU）`,
        count: mergedProducts.length,
        originalCount: body.length,
      },
    };
  } catch (error) {
    console.error('批量导入产品失败:', error);
    return {
      code: 500,
      message: `批量导入失败: ${error.message}`,
      data: null,
    };
  }
});
