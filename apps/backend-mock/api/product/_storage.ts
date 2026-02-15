// 共享的产品数据存储
let productStorage: any[] = [
  {
    id: '1',
    productName: '无线蓝牙耳机',
    skuName: '黑色-标准版',
    warehouseSku: 'BT-EAR-001-BLK',
    manager: '张三',
  },
  {
    id: '2',
    productName: '智能手环',
    skuName: '运动版-蓝色',
    warehouseSku: 'SM-BAND-002-BLU',
    manager: '李四',
  },
  {
    id: '3',
    productName: '便携充电宝',
    skuName: '10000mAh-白色',
    warehouseSku: 'PB-10K-003-WHT',
    manager: '张三',
  },
  {
    id: '4',
    productName: '无线鼠标',
    skuName: '办公版-灰色',
    warehouseSku: 'MS-WL-004-GRY',
    manager: '王五',
  },
  {
    id: '5',
    productName: '机械键盘',
    skuName: '青轴-RGB',
    warehouseSku: 'KB-MEC-005-RGB',
    manager: '李四',
  },
];

export function getProducts() {
  console.log('getProducts called, current storage length:', productStorage.length);
  return productStorage;
}

export function setProducts(products: any[]) {
  productStorage = products;
  console.log('setProducts called, new storage length:', productStorage.length);
}

export function addProducts(products: any[]) {
  // 直接添加产品，保留原有的 ID
  productStorage = [...productStorage, ...products];
  console.log('addProducts called, added:', products.length, 'total:', productStorage.length);
  console.log('First product in storage:', productStorage[0]);
  return products;
}

export function updateProduct(id: string, productData: any) {
  const index = productStorage.findIndex(p => p.id === id);
  if (index !== -1) {
    productStorage[index] = { ...productStorage[index], ...productData, id };
    console.log('updateProduct called, id:', id, 'updated product:', productStorage[index]);
    return productStorage[index];
  }
  return null;
}

export function deleteProduct(id: string) {
  productStorage = productStorage.filter(p => p.id !== id);
  console.log('deleteProduct called, id:', id, 'remaining:', productStorage.length);
}

export function clearProducts() {
  productStorage = [];
  console.log('clearProducts called, storage cleared');
}
