const XLSX = require('./node_modules/.pnpm/xlsx@0.18.5/node_modules/xlsx/xlsx.js');
const path = require('path');
const os = require('os');

// 使用固定的随机种子生成稳定的随机数
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// 生成 200 条模拟产品数据
function generateMockData() {
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

  const data = [];

  for (let i = 1; i <= 200; i++) {
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

    // 使用固定种子生成稳定的成本
    const domesticCost = Math.round((5 + seededRandom(i * 1000) * 495) * 100) / 100;
    const overseasCost = Math.round(domesticCost * (1.2 + seededRandom(i * 2000) * 0.8) * 100) / 100;

    // 使用固定种子生成稳定的库存
    const stock = Math.floor(50 + seededRandom(i * 3000) * 4950);

    data.push({
      '产品图片(URL)': hasImage ? `https://picsum.photos/200/200?random=${i}` : '',
      '产品名': `${productName} ${i}`,
      'SKU名': `SKU-${category}-${String(i).padStart(3, '0')}`,
      'TEMU SKU': temuSku,
      'SHEIN SKU': sheinSku,
      '仓库 SKU': `WH-${category}-${String(i).padStart(3, '0')}`,
      '国内成本': domesticCost,
      '海外成本': overseasCost,
      '管理人': manager,
      '库存': stock,
    });
  }

  return data;
}

// 生成数据
console.log('正在生成 200 条模拟产品数据...');
const mockData = generateMockData();

// 创建工作表
const worksheet = XLSX.utils.json_to_sheet(mockData);

// 创建工作簿
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, '产品数据');

// 获取桌面路径
const desktopPath = path.join(os.homedir(), 'Desktop');
const filePath = path.join(desktopPath, 'ZOOL_ERP_产品数据_200条.xlsx');

// 写入文件
XLSX.writeFile(workbook, filePath);

console.log(`✓ 成功生成 Excel 文件：${filePath}`);
console.log(`✓ 共 ${mockData.length} 条产品数据`);
