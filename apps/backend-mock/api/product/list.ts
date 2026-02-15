import { getProducts, setProducts } from './_storage';

// 使用固定的随机种子生成稳定的随机数
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// 生成固定的 300 条模拟产品数据
function generateMockProducts() {
  const productNames = [
    '无线蓝牙耳机', '智能手表', '便携充电宝', 'USB数据线', '手机支架',
    '蓝牙音箱', '无线鼠标', '机械键盘', '笔记本电脑', '平板电脑',
    '智能手环', '运动相机', '自拍杆', '手机壳', '钢化膜',
    '车载充电器', '无线充电器', '数据转换器', 'HDMI线', '网线',
    '路由器', '交换机', '移动硬盘', 'U盘', '内存卡',
    '读卡器', '散热器', '键盘膜', '鼠标垫', '电脑包',
    '平板保护套', '触控笔', '清洁套装', '防尘塞', '支架底座',
    '延长线', '插线板', '理线器', '标签打印机', '扫描仪',
    '投影仪', '激光笔', '翻页笔', '会议摄像头', '麦克风',
    '补光灯', '三脚架', '云台', '相机包', '镜头盖',
    '遮光罩', '滤镜', '存储卡盒', '电池', '充电器',
    '数据线收纳包', '耳机收纳盒', '防水袋', '臂包', '腰包',
  ];

  const categories = ['BT', 'SW', 'PB', 'USB', 'HS', 'BS', 'MS', 'KB', 'LP', 'TB', 'SB', 'CM', 'AC', 'CH', 'RT'];
  const managers = ['张三', '李四', '王五'];

  const products = [];

  for (let i = 1; i <= 300; i++) {
    const categoryIndex = i % categories.length;
    const category = categories[categoryIndex];
    const productName = productNames[i % productNames.length];
    const manager = managers[i % managers.length];

    // 固定规则决定是否有图片 (80% 有图片)
    const hasImage = i % 5 !== 0;

    // 固定规则决定平台 SKU
    let temuSku = '';
    let sheinSku = '';
    const platformRandom = i % 10;
    if (platformRandom < 4) {
      temuSku = `TEMU-${category}-${String(i).padStart(3, '0')}`;
      sheinSku = `SHEIN-${category}-${String(i).padStart(3, '0')}`;
    } else if (platformRandom < 7) {
      temuSku = `TEMU-${category}-${String(i).padStart(3, '0')}`;
    } else if (platformRandom < 9) {
      sheinSku = `SHEIN-${category}-${String(i).padStart(3, '0')}`;
    }

    // 使用固定种子生成稳定的成本和运费
    const productCost = Math.round((5 + seededRandom(i * 1000) * 495) * 100) / 100;
    const tax = Math.round(productCost * (0.05 + seededRandom(i * 2000) * 0.15) * 100) / 100;
    const domesticShipping = Math.round((2 + seededRandom(i * 3000) * 48) * 100) / 100;
    const overseasShipping = Math.round((10 + seededRandom(i * 4000) * 90) * 100) / 100;

    // 使用固定种子生成稳定的库存
    const stock = Math.floor(50 + seededRandom(i * 5000) * 4950);

    // 生成产品规格
    const specs = {
      length: String(Math.floor(10 + seededRandom(i * 6000) * 90)),
      width: String(Math.floor(10 + seededRandom(i * 7000) * 90)),
      height: String(Math.floor(5 + seededRandom(i * 8000) * 45)),
      weight: String((0.1 + seededRandom(i * 9000) * 9.9).toFixed(2)),
    };

    products.push({
      id: String(i),
      imageUrl: hasImage ? `https://picsum.photos/200/200?random=${i}` : '',
      productName: `${productName} ${i}`,
      skuName: `SKU-${category}-${String(i).padStart(3, '0')}`,
      temuSku,
      sheinSku,
      warehouseSku: `WH-${category}-${String(i).padStart(3, '0')}`,
      productCost,
      tax,
      domesticShipping,
      overseasShipping,
      manager,
      stock,
      specs,
    });
  }

  return products;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 20;
  const keyword = (query.keyword as string) || '';
  const manager = (query.manager as string) || '';

  // 从共享存储获取产品数据，如果为空则生成默认数据
  let allProducts = getProducts();
  // 注释掉自动生成模拟数据，让用户手动导入测试数据
  // if (allProducts.length === 0) {
  //   allProducts = generateMockProducts();
  //   // 将生成的模拟数据保存到存储中，这样编辑和删除功能才能正常工作
  //   setProducts(allProducts);
  // }

  console.log('获取产品列表，总数:', allProducts.length);
  if (allProducts.length > 0) {
    console.log('第一个产品的specs:', allProducts[0].specs);
  }

  // 模糊搜索过滤
  let filteredProducts = allProducts;
  if (keyword) {
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.productName.includes(keyword) ||
        p.skuName.includes(keyword) ||
        p.temuSku.includes(keyword) ||
        p.sheinSku.includes(keyword) ||
        p.warehouseSku.includes(keyword),
    );
  }

  // 管理人过滤
  if (manager) {
    filteredProducts = filteredProducts.filter((p) => p.manager === manager);
  }

  // 分页
  const total = filteredProducts.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = filteredProducts.slice(start, end);

  return {
    code: 0,
    data: {
      items,
      total,
    },
  };
});
