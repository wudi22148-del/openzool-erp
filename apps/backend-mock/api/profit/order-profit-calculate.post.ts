import { defineEventHandler, readBody } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess, useResponseError } from '~/utils/response';
import {
  getSettlementUpload,
  getFreightCostsByMonths,
  getOrderMapByMonths,
  insertOrderProfitRecords,
} from '../db/order-profit';
import { getProducts } from '../db/products';
import {
  calculateTemuProfit,
  calculateSheinProfit,
} from './calc-engine';
import type {
  SettlementRow,
  OrderMapRow,
  ProductInfo,
  SheinSettlementRow,
  SheinOrderMapRow,
  ProfitResult,
} from './calc-engine';

/** 生成从 month 开始往前 count 个月的月份列表（含当月） */
function getMonthRange(month: string, count: number): string[] {
  const [year, mon] = month.split('-').map(Number);
  const months: string[] = [];
  for (let i = 0; i < count; i++) {
    let y = year!;
    let m = mon! - i;
    while (m <= 0) { m += 12; y--; }
    months.push(`${y}-${String(m).padStart(2, '0')}`);
  }
  return months;
}

export default defineEventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) return unAuthorizedResponse(event);

  try {
    const { month, platform } = await readBody(event);

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return useResponseError('月份格式错误，应为 YYYY-MM');
    }

    const targetPlatforms = platform === 'ALL' ? ['TEMU', 'SHEIN'] : [platform];

    // 1. 获取运费成本（当月 + 前6个月，共7个月）
    const monthRange = getMonthRange(month, 7);
    const freightCostMap = await getFreightCostsByMonths(monthRange);
    console.log(`运费成本: ${freightCostMap.size} 条运单号 (${monthRange.join(', ')})`);

    // 2. 获取产品信息，构建 SKU 映射
    const products = await getProducts();
    const temuSkuMap = new Map<string, ProductInfo>();
    const sheinSkuMap = new Map<string, ProductInfo>();

    for (const p of products) {
      const info: ProductInfo = {
        productCost: p.productCost || 0,
        domesticProductCost: p.productCost || 0,  // 国内成本 = 单纯产品成本
        tax: p.tax || 0,
        firstLegShipping: p.firstLegShipping || 0,
        productName: p.productName || '',
        manager: p.manager || '',
      };

      // temu_sku 可能是逗号分隔的多个 SKU
      if (p.temuSku) {
        const skus = String(p.temuSku).split(',').map(s => s.trim()).filter(Boolean);
        for (const sku of skus) {
          temuSkuMap.set(sku, info);
        }
      }

      // shein_sku 同理
      if (p.sheinSku) {
        const skus = String(p.sheinSku).split(',').map(s => s.trim()).filter(Boolean);
        for (const sku of skus) {
          sheinSkuMap.set(sku, info);
        }
      }
    }

    console.log(`产品映射: TEMU SKU ${temuSkuMap.size} 个, SHEIN SKU ${sheinSkuMap.size} 个`);

    // 3. 计算各平台利润
    const allResults: ProfitResult[] = [];

    for (const plat of targetPlatforms) {
      const settlementData = await getSettlementUpload(month, plat, 'settlement');
      // 订单编号表：跨月查找，当月 + 前6个月
      const orderMapRaw = await getOrderMapByMonths(plat, monthRange);

      if (!settlementData) {
        console.log(`${plat} 无结算数据，跳过`);
        continue;
      }

      if (plat === 'TEMU') {
        // 转换为 TEMU 格式
        const settlement: SettlementRow[] = settlementData.map((r: any) => ({
          poNo: String(r.poNo || r['PO单号'] || ''),
          transactionType: String(r.transactionType || r['交易类型'] || ''),
          settlementAmount: Number(r.settlementAmount || r['结算金额'] || 0),
          skuId: String(r.skuId || r['SKU ID'] || r['SKUID'] || ''),
          quantity: Number(r.quantity || r['件数'] || 0),
          declaredPrice: Number(r.declaredPrice || r['申报价格'] || 0),
        }));

        const orderMap: OrderMapRow[] = orderMapRaw.map((r: any) => ({
          orderNo: String(r.orderNo || r['订单编号'] || ''),
          waybillNumber: String(r.waybillNumber || r['运单号'] || ''),
          skuId: String(r.skuId || r['SKU ID'] || r['SKUID'] || ''),
        }));

        console.log(`TEMU: 结算 ${settlement.length} 条, 订单 ${orderMap.length} 条`);
        const results = calculateTemuProfit(settlement, orderMap, freightCostMap, temuSkuMap);
        allResults.push(...results);
        console.log(`TEMU 计算完成: ${results.length} 条利润记录`);

      } else if (plat === 'SHEIN') {
        const settlement: SheinSettlementRow[] = settlementData.map((r: any) => ({
          orderNo: String(r.orderNo || r['订单号'] || ''),
          platformSku: String(r.platformSku || r['平台sku'] || ''),
          billType: String(r.billType || r['账单类型'] || ''),
          receivableAmount: Number(r.receivableAmount || r['应收金额'] || 0),
        }));

        const orderMap: SheinOrderMapRow[] = orderMapRaw.map((r: any) => ({
          orderNo: String(r.orderNo || r['订单编号'] || r['订单号'] || ''),
          waybillNumber: String(r.waybillNumber || r['运单号'] || ''),
        }));

        console.log(`SHEIN: 结算 ${settlement.length} 条, 订单 ${orderMap.length} 条`);
        const results = calculateSheinProfit(settlement, orderMap, freightCostMap, sheinSkuMap);
        allResults.push(...results);
        console.log(`SHEIN 计算完成: ${results.length} 条利润记录`);
      }
    }

    if (allResults.length === 0) {
      return useResponseError('没有可计算的数据，请确认已上传结算表和订单编号表');
    }

    // 4. 填充月份并保存
    const records = allResults.map(r => ({ ...r, month }));
    const count = await insertOrderProfitRecords(month, records);

    // 5. 简单汇总
    const totalProfit = allResults.reduce((s, r) => s + r.profit, 0);
    const totalRevenue = allResults.reduce((s, r) => s + (r.salesIncome - r.salesRefund + r.freightIncome - r.freightRefund), 0);

    return useResponseSuccess({
      count,
      month,
      totalProfit: Math.round(totalProfit * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      profitRate: totalRevenue !== 0 ? Math.round(totalProfit / totalRevenue * 10000) / 100 : 0,
    });
  } catch (error: any) {
    console.error('计算利润失败:', error);
    return useResponseError(`计算失败: ${error.message}`);
  }
});
