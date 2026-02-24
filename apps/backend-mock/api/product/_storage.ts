import * as db from '../db/products';

export async function getProducts(page?: number, pageSize?: number) {
  const products = await db.getProducts(page, pageSize);
  console.log('getProducts called, current storage length:', products.length);
  return products;
}

export async function getProductsCount() {
  return await db.getProductsCount();
}

export async function getFilteredProducts(
  page: number,
  pageSize: number,
  keyword?: string,
  manager?: string
) {
  return await db.getFilteredProducts(page, pageSize, keyword, manager);
}

export async function getProductById(id: string) {
  return await db.getProductById(id);
}

export async function setProducts(products: any[]) {
  await db.clearProducts();
  await db.addProducts(products);
  console.log('setProducts called, new storage length:', products.length);
}

export async function addProducts(products: any[]) {
  const addedProducts = await db.addProducts(products);
  console.log('addProducts called, added:', products.length, 'total:', addedProducts.length);
  if (addedProducts.length > 0) {
    console.log('First product in storage:', addedProducts[0]);
  }
  return addedProducts;
}

export async function updateProduct(id: string, productData: any) {
  const updatedProduct = await db.updateProduct(id, productData);
  if (updatedProduct) {
    console.log('updateProduct called, id:', id, 'updated product:', updatedProduct);
  }
  return updatedProduct;
}

export async function deleteProduct(id: string) {
  await db.deleteProduct(id);
  console.log('deleteProduct called, id:', id);
}

export async function batchDeleteProducts(ids: string[]) {
  await db.batchDeleteProducts(ids);
  console.log('batchDeleteProducts called, count:', ids.length);
}

export async function clearProducts() {
  await db.clearProducts();
  console.log('clearProducts called, storage cleared');
}
