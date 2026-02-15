import { requestClient } from '#/api/request';

/**
 * 获取产品列表
 */
export async function getProductList(params?: any) {
  return requestClient.get('/product/list', { params });
}

/**
 * 批量导入产品
 */
export async function batchImportProducts(data: any[]) {
  return requestClient.post('/product/batch-import', data);
}

/**
 * 更新产品
 */
export async function updateProduct(id: string, data: any) {
  return requestClient.put(`/product/${id}`, data);
}

/**
 * 获取管理人列表
 */
export async function getManagerList() {
  return requestClient.get('/product/managers');
}

/**
 * 删除产品
 */
export async function deleteProduct(id: string) {
  return requestClient.delete(`/product/${id}`);
}
