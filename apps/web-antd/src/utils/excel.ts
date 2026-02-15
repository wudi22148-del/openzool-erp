import * as XLSX from 'xlsx';

/**
 * 导出 Excel 文件
 */
export function exportExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

/**
 * 下载产品导入模板
 */
export function downloadProductTemplate() {
  const templateData = [
    {
      '产品名*': '示例产品',
      'SKU名*': 'XL红色',
      '仓库SKU*': 'WH-001',
      'TEMU SKU': 'TEMU-001',
      'SHEIN SKU': 'SHEIN-001',
      '长(cm)': '10',
      '宽(cm)': '20',
      '高(cm)': '30',
      '重量(kg)': '0.5',
      '产品成本*': 50.00,
      '税金*': 5.00,
      '国内运费*': 10.00,
      '海外运费*': 20.00,
      '管理人*': '张三',
      '库存量': '100',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // 设置必填字段为红色
  const requiredFields = ['产品名*', 'SKU名*', '仓库SKU*', '产品成本*', '税金*', '国内运费*', '海外运费*', '管理人*'];
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!worksheet[address]) continue;

    const cellValue = worksheet[address].v;
    if (requiredFields.some(field => cellValue.includes(field.replace('*', '')))) {
      worksheet[address].s = {
        font: { color: { rgb: 'FF0000' }, bold: true }
      };
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '产品数据');
  XLSX.writeFile(workbook, 'OpenZool_ERP_产品导入模板.xlsx');
}

/**
 * 解析 Excel 文件
 */
export function parseExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * 映射 Excel 数据到产品对象
 */
export function mapExcelToProduct(excelData: any[]): any[] {
  const validProducts: any[] = [];
  const errors: string[] = [];

  excelData.forEach((row, index) => {
    const productName = row['产品名*'] || row['产品名'];
    const skuName = row['SKU名*'] || row['SKU名'];
    const warehouseSku = row['仓库SKU*'] || row['仓库SKU'];
    const productCost = row['产品成本*'] || row['产品成本'];
    const tax = row['税金*'] || row['税金'];
    const domesticShipping = row['国内运费*'] || row['国内运费'];
    const overseasShipping = row['海外运费*'] || row['海外运费'];
    const manager = row['管理人*'] || row['管理人'];

    // 校验必填字段
    if (!productName || !skuName || !warehouseSku || !productCost || !tax ||
        !domesticShipping || !overseasShipping || !manager) {
      errors.push(`第 ${index + 2} 行：产品名、SKU名、仓库SKU、产品成本、税金、国内运费、海外运费、管理人为必填项`);
      return;
    }

    // 映射字段
    const product = {
      productName: productName,
      skuName: skuName,
      warehouseSku: warehouseSku,
      temuSku: row['TEMU SKU'] || '',
      sheinSku: row['SHEIN SKU'] || '',
      specs: {
        length: row['长(cm)'] || '',
        width: row['宽(cm)'] || '',
        height: row['高(cm)'] || '',
        weight: row['重量(kg)'] || '',
      },
      productCost: Number(productCost) || 0,
      tax: Number(tax) || 0,
      domesticShipping: Number(domesticShipping) || 0,
      overseasShipping: Number(overseasShipping) || 0,
      manager: manager,
      stock: Number(row['库存量']) || 0,
      imageUrl: '',
    };

    validProducts.push(product);
  });

  if (errors.length > 0) {
    console.warn('导入数据校验警告：', errors);
    throw new Error(errors.join('\n'));
  }

  return validProducts;
}

/**
 * 下载日销表格模板
 */
export function downloadDailySalesTemplate() {
  const templateData = [
    {
      '订单编号': 'ORD-001',
      '日期*': '2024-01-01',
      '仓库SKU*': 'WH-001',
      '销售数量*': '10',
    },
    {
      '订单编号': 'ORD-001',
      '日期*': '2024-01-01',
      '仓库SKU*': 'WH-002',
      '销售数量*': '5',
    },
    {
      '订单编号': 'ORD-002',
      '日期*': '2024-01-01',
      '仓库SKU*': 'WH-003',
      '销售数量*': '8',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // 设置必填字段为红色
  const requiredFields = ['日期*', '仓库SKU*', '销售数量*'];
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!worksheet[address]) continue;

    const cellValue = worksheet[address].v;
    if (requiredFields.some(field => cellValue.includes(field.replace('*', '')))) {
      worksheet[address].s = {
        font: { color: { rgb: 'FF0000' }, bold: true }
      };
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '日销数据');
  XLSX.writeFile(workbook, 'OpenZool_ERP_日销导入模板.xlsx');
}

/**
 * 解析日销 Excel 文件
 */
export function parseDailySalesExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // 映射和验证数据
        const validData: any[] = [];
        const errors: string[] = [];

        jsonData.forEach((row: any, index) => {
          const date = row['日期*'] || row['日期'];
          const warehouseSku = row['仓库SKU*'] || row['仓库SKU'];
          const salesQuantity = row['销售数量*'] || row['销售数量'];
          const orderNumber = row['订单编号'];

          // 校验必填字段
          if (!date || !warehouseSku || salesQuantity === undefined || salesQuantity === null) {
            errors.push(`第 ${index + 2} 行：日期、仓库SKU、销售数量为必填项`);
            return;
          }

          validData.push({
            date: String(date).trim(),
            warehouseSku: String(warehouseSku).trim(),
            salesQuantity: Number(salesQuantity) || 0,
            orderNumber: orderNumber ? String(orderNumber).trim() : undefined,
          });
        });

        if (errors.length > 0) {
          console.warn('导入数据校验警告：', errors);
          reject(new Error(errors.join('\n')));
          return;
        }

        resolve(validData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsBinaryString(file);
  });
}
