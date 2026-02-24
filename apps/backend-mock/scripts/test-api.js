// 测试批量导入API
const testData = [
  {
    productName: '测试产品',
    skuName: '测试SKU',
    warehouseSku: 'TEST-API-001',
    temuSku: '',
    sheinSku: '',
    specs: {
      length: '10',
      width: '20',
      height: '30',
      weight: '0.5',
    },
    productCost: 50,
    tax: 5,
    domesticShipping: 10,
    firstLegShipping: 15,
    overseasShipping: 20,
    manager: '张三',
    stock: 100,
    imageUrl: '',
  },
];

fetch('http://localhost:3003/api/product/batch-import', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData),
})
  .then(res => res.json())
  .then(data => {
    console.log('API响应:', JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error('请求失败:', err);
  });
