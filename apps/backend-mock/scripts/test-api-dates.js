// 测试销售统计API返回的日期格式
fetch('http://localhost:5320/api/sales/statistics?page=1&pageSize=1&startDate=2026-02-01&endDate=2026-02-16&mode=quantity', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then(res => res.json())
  .then(data => {
    console.log('API响应:');
    if (data.data && data.data.items && data.data.items.length > 0) {
      const firstProduct = data.data.items[0];
      console.log('第一个产品:', firstProduct.productName);
      console.log('总销量:', firstProduct.totalSales);

      // 打印所有日期字段
      console.log('\n日期字段:');
      Object.keys(firstProduct).forEach(key => {
        if (key.startsWith('date_')) {
          console.log(`  ${key}: ${firstProduct[key]}`);
        }
      });
    }
  })
  .catch(err => {
    console.error('请求失败:', err);
  });
