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
      '头程运费*': 15.00,
      '海外运费*': 20.00,
      '管理人*': '张三',
      '库存量': '100',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // 设置必填字段为红色
  const requiredFields = ['产品名*', 'SKU名*', '仓库SKU*', '产品成本*', '税金*', '国内运费*', '头程运费*', '海外运费*', '管理人*'];
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
 * 返回格式：{ validProducts: 成功的产品数组, errors: 错误信息数组 }
 */
export function mapExcelToProduct(excelData: any[]): { validProducts: any[], errors: string[] } {
  const validProducts: any[] = [];
  const errors: string[] = [];

  excelData.forEach((row, index) => {
    // 更宽容的字段匹配，去除空格和星号
    const getField = (fieldNames: string[]) => {
      for (const name of fieldNames) {
        if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
          return row[name];
        }
      }
      return null;
    };

    const productName = getField(['产品名*', '产品名', '产品名称*', '产品名称']);
    const skuName = getField(['SKU名*', 'SKU名', 'SKU名称*', 'SKU名称']);
    const warehouseSku = getField(['仓库SKU*', '仓库SKU', '仓库sku*', '仓库sku']);
    const temuSku = getField(['TEMU SKU', 'TEMU_SKU', 'temuSku', 'temu sku']);
    const sheinSku = getField(['SHEIN SKU', 'SHEIN_SKU', 'sheinSku', 'shein sku']);
    const length = getField(['长(cm)', '长', 'length', 'L(cm)']);
    const width = getField(['宽(cm)', '宽', 'width', 'W(cm)']);
    const height = getField(['高(cm)', '高', 'height', 'H(cm)']);
    const weight = getField(['重量(kg)', '重量', 'weight', 'Weight(kg)']);
    const productCost = getField(['产品成本*', '产品成本', '成本*', '成本']);
    const tax = getField(['税金*', '税金', '税*', '税']);
    const domesticShipping = getField(['国内运费*', '国内运费', '国内物流*', '国内物流']);
    const firstLegShipping = getField(['头程运费*', '头程运费', '头程物流*', '头程物流']);
    const overseasShipping = getField(['海外运费*', '海外运费', '海外物流*', '海外物流']);
    const manager = getField(['管理人*', '管理人', '负责人*', '负责人']);
    const stock = getField(['库存量', '库存', 'stock', 'Stock']);

    // 校验必填字段（注意：0 会被判断为 false，所以需要特殊处理数字字段）
    if (!productName || !skuName || !warehouseSku ||
        productCost === null || productCost === undefined || productCost === '' ||
        tax === null || tax === undefined || tax === '' ||
        domesticShipping === null || domesticShipping === undefined || domesticShipping === '' ||
        firstLegShipping === null || firstLegShipping === undefined || firstLegShipping === '' ||
        overseasShipping === null || overseasShipping === undefined || overseasShipping === '' ||
        !manager) {
      errors.push(`第 ${index + 2} 行：产品名、SKU名、仓库SKU、产品成本、税金、国内运费、头程运费、海外运费、管理人为必填项`);
      return;
    }

    // 映射字段
    const product = {
      productName: productName,
      skuName: skuName,
      warehouseSku: warehouseSku,
      temuSku: temuSku || '',
      sheinSku: sheinSku || '',
      specs: {
        length: length || '',
        width: width || '',
        height: height || '',
        weight: weight || '',
      },
      productCost: Number(productCost) || 0,
      tax: Number(tax) || 0,
      domesticShipping: Number(domesticShipping) || 0,
      firstLegShipping: Number(firstLegShipping) || 0,
      overseasShipping: Number(overseasShipping) || 0,
      manager: manager,
      stock: Number(stock) || 0,
      imageUrl: '',
    };

    validProducts.push(product);
  });

  // 返回成功和失败的结果，不再抛出异常
  if (errors.length > 0) {
    console.warn('导入数据校验警告：', errors);
  }

  return { validProducts, errors };
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

          // 转换日期格式
          let formattedDate: string;
          if (typeof date === 'number') {
            // Excel日期序列号转换为标准日期格式
            // 使用 1900-01-00 (即 1899-12-31) 作为起点，因为Excel将1900-01-01视为第1天
            const excelEpoch = new Date(1900, 0, 0);
            const dateObj = new Date(excelEpoch.getTime() + date * 86400000);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            formattedDate = `${year}-${month}-${day}`;
          } else {
            formattedDate = String(date).trim();
          }

          validData.push({
            date: formattedDate,
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
