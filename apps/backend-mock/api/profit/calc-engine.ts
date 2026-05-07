/**
 * 订单利润计算引擎
 * 移植自 Python profit_calc_v3.9.py
 */

// ============ 类型定义 ============

export interface SettlementRow {
  poNo: string;
  transactionType: string;
  settlementAmount: number;
  skuId: string;
  quantity: number;
  declaredPrice: number;
}

export interface OrderMapRow {
  orderNo: string;
  waybillNumber: string;
  skuId?: string;
}

export interface ProductInfo {
  productCost: number;          // 海外仓产品成本（基础）
  domesticProductCost: number;  // 国内仓产品成本
  tax: number;
  firstLegShipping: number;     // 头程运费（仅海外仓加入）
  productName: string;
  manager: string;
}

export interface ProfitResult {
  platform: string;
  orderNo: string;
  skuId: string;
  quantity: number;
  salesIncome: number;
  freightIncome: number;
  salesRefund: number;
  freightRefund: number;
  isDomestic: boolean;
  productCostUnit: number;
  productCostTotal: number;
  freightCost: number;
  waybillNumbers: string;
  productName: string;
  manager: string;
  profit: number;
  profitRate: number;
}

// ============ 工具函数 ============

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** 清洗运单号：去空格、去.0后缀、只保留数字 */
function cleanWaybill(s: string): string {
  if (!s) return '';
  let v = String(s).trim();
  if (v.toLowerCase() === 'nan' || v === '') return '';
  v = v.replace(/\.0+$/, '');
  v = v.replace(/[^0-9]/g, '');
  return v;
}

/** 拆分单元格里的多个运单号（支持、,，;；/ 空格换行） */
function splitWaybillCell(cell: any): string[] {
  if (cell === null || cell === undefined) return [];
  const s = String(cell).trim();
  if (!s || s.toLowerCase() === 'nan') return [];
  const parts = s.replace(/\n/g, ' ').replace(/\t/g, ' ').split(/[、,，;；/\s]+/);
  const out: string[] = [];
  for (const p of parts) {
    const cleaned = cleanWaybill(p);
    if (cleaned) out.push(cleaned);
  }
  return out;
}

/** 标准化 SKU：去空格、去.0后缀 */
function normSku(s: any): string {
  if (s === null || s === undefined) return '';
  let v = String(s).trim();
  if (v.toLowerCase() === 'nan' || v === '') return '';
  if (/^\d+\.0+$/.test(v)) {
    v = v.split('.')[0]!;
  } else {
    try {
      const f = parseFloat(v);
      if (!isNaN(f) && Number.isInteger(f)) {
        v = String(Math.round(f));
      }
    } catch {
      // keep original
    }
  }
  return v;
}

/** 根据运单号在运费成本表中的记录，判断是否国内发货及成本类型 */
function getIsDomesticFromMap(
  waybills: string[],
  freightCostMap: Map<string, { cost: number; isDomestic: boolean }>,
): boolean {
  for (const wb of waybills) {
    const entry = freightCostMap.get(wb);
    if (entry) return entry.isDomestic;
  }
  return false; // 找不到运单号记录时默认海外仓
}

/**
 * 计算产品单位成本
 * - 国内仓：domesticProductCost（若为空则 fallback 到 productCost）
 * - 海外仓：productCost + tax + firstLegShipping
 */
function getProductUnitCost(product: ProductInfo, costType: 'international' | 'domestic'): number {
  if (costType === 'domestic') {
    const cost = product.domesticProductCost > 0
      ? product.domesticProductCost
      : product.productCost;
    return cost || 0;
  }
  // 海外仓：产品成本 + 税金 + 头程运费
  return (product.productCost || 0) + (product.tax || 0) + (product.firstLegShipping || 0);
}

// ============ TEMU 利润计算 ============

export function calculateTemuProfit(
  settlementData: SettlementRow[],
  orderMapData: OrderMapRow[],
  freightCostMap: Map<string, { cost: number; isDomestic: boolean }>,
  productMap: Map<string, ProductInfo>,
): ProfitResult[] {
  if (!settlementData.length) return [];

  // 1. 构建订单编号 → 运单号列表映射（支持一格多运单号）
  const orderToWaybills = new Map<string, string[]>();
  const orderSkuToWaybills = new Map<string, string[]>();

  for (const row of orderMapData) {
    const orderNo = String(row.orderNo).trim();
    const waybills = splitWaybillCell(row.waybillNumber);
    if (!orderNo || !waybills.length) continue;

    // 订单级映射
    const existing = orderToWaybills.get(orderNo) || [];
    const merged = [...new Set([...existing, ...waybills])];
    orderToWaybills.set(orderNo, merged);

    // 订单+SKU级映射
    const skuId = row.skuId ? normSku(row.skuId) : '';
    if (skuId) {
      const key = `${orderNo}__${skuId}`;
      const existingSku = orderSkuToWaybills.get(key) || [];
      orderSkuToWaybills.set(key, [...new Set([...existingSku, ...waybills])]);
    }
  }

  // 2. 标准化结算数据
  const rows = settlementData.map(r => ({
    poNo: String(r.poNo).trim(),
    transactionType: String(r.transactionType).trim(),
    settlementAmount: Number(r.settlementAmount) || 0,
    skuId: normSku(r.skuId),
    quantity: Number(r.quantity) || 0,
    declaredPrice: Number(r.declaredPrice) || 0,
  }));

  // 3. 按 PO单号 分组
  const poGroups = new Map<string, typeof rows>();
  for (const row of rows) {
    if (!row.poNo) continue;
    const group = poGroups.get(row.poNo) || [];
    group.push(row);
    poGroups.set(row.poNo, group);
  }

  const results: ProfitResult[] = [];

  for (const [poNo, poRows] of poGroups) {
    // 4. 按 SKU 分组销售回款
    const salesBySku = new Map<string, { income: number; qty: number; declared: number }>();
    const refundBySku = new Map<string, number>();
    let refundNoSku = 0;
    let freightIncomeTotal = 0;
    let freightRefundTotal = 0;

    for (const row of poRows) {
      const type = row.transactionType;
      if (type === '销售回款' && row.skuId) {
        const prev = salesBySku.get(row.skuId) || { income: 0, qty: 0, declared: 0 };
        prev.income += row.settlementAmount;
        prev.qty += row.quantity;
        prev.declared += row.declaredPrice * row.quantity;
        salesBySku.set(row.skuId, prev);
      } else if (type === '销售冲回') {
        if (row.skuId) {
          refundBySku.set(row.skuId, (refundBySku.get(row.skuId) || 0) + Math.abs(row.settlementAmount));
        } else {
          refundNoSku += Math.abs(row.settlementAmount);
        }
      } else if (type === '运费回款') {
        freightIncomeTotal += row.settlementAmount;
      } else if (type === '运费冲回') {
        freightRefundTotal += Math.abs(row.settlementAmount);
      }
    }

    const skuList = [...salesBySku.keys()];
    if (!skuList.length) continue;

    const nSku = skuList.length;

    // 5. 无SKU退款按申报总价比例分摊
    const totalDeclared = [...salesBySku.values()].reduce((s, v) => s + v.declared, 0);

    // 6. 获取每个SKU的运单号（优先用订单+SKU级，fallback到订单级）
    const skuWaybills = new Map<string, string[]>();
    for (const sku of skuList) {
      const key = `${poNo}__${sku}`;
      let wbs = orderSkuToWaybills.get(key) || [];
      if (!wbs.length) wbs = orderToWaybills.get(poNo) || [];
      skuWaybills.set(sku, [...new Set(wbs)]);
    }

    // 7. 运费成本按运单号分摊到SKU（一个运单号被多个SKU共用则均摊）
    const wbToSkuIdx = new Map<string, Set<number>>();
    skuList.forEach((sku, idx) => {
      const wbs = skuWaybills.get(sku) || [];
      for (const wb of wbs) {
        const set = wbToSkuIdx.get(wb) || new Set();
        set.add(idx);
        wbToSkuIdx.set(wb, set);
      }
    });

    const perSkuFreightCost = new Array(nSku).fill(0);
    for (const [wb, idxSet] of wbToSkuIdx) {
      const entry = freightCostMap.get(wb);
      const cost = entry ? entry.cost : 0;
      if (cost === 0 || idxSet.size === 0) continue;
      const share = cost / idxSet.size;
      for (const idx of idxSet) {
        perSkuFreightCost[idx] += share;
      }
    }

    // 8. 计算每个SKU的利润
    for (let i = 0; i < skuList.length; i++) {
      const sku = skuList[i]!;
      const salesData = salesBySku.get(sku)!;
      const skuRefund = refundBySku.get(sku) || 0;

      // 无SKU退款按申报总价比例分摊，申报总价为0时均摊
      let refundAlloc = 0;
      if (totalDeclared > 0) {
        refundAlloc = refundNoSku * (salesData.declared / totalDeclared);
      } else if (nSku > 0) {
        refundAlloc = refundNoSku / nSku;
      }

      const salesRefund = skuRefund + refundAlloc;
      const freightIncome = freightIncomeTotal / nSku;
      const freightRefund = freightRefundTotal / nSku;

      const wbs = skuWaybills.get(sku) || [];
      const domestic = getIsDomesticFromMap(wbs, freightCostMap);
      const costType: 'domestic' | 'international' = domestic ? 'domestic' : 'international';

      const product = productMap.get(sku);
      let productCostUnit = 0;
      let productName = '';
      let manager = '';

      if (product) {
        productCostUnit = getProductUnitCost(product, costType);
        productName = product.productName || '';
        manager = product.manager || '';
      }

      const qty = Math.round(salesData.qty);
      const productCostTotal = productCostUnit * qty;
      const allocatedFreightCost = perSkuFreightCost[i]!;

      const netSales = salesData.income - salesRefund;
      const netFreight = freightIncome - freightRefund;
      const revenueTotal = netSales + netFreight;
      const profit = revenueTotal - productCostTotal - allocatedFreightCost;
      const profitRateRaw = revenueTotal !== 0 ? (profit / revenueTotal) * 100 : 0;
      const profitRate = Math.max(-99999, Math.min(99999, profitRateRaw));

      results.push({
        platform: 'TEMU',
        orderNo: poNo,
        skuId: sku,
        quantity: qty,
        salesIncome: round2(salesData.income),
        freightIncome: round2(freightIncome),
        salesRefund: round2(salesRefund),
        freightRefund: round2(freightRefund),
        isDomestic: domestic,
        productCostUnit: round2(productCostUnit),
        productCostTotal: round2(productCostTotal),
        freightCost: round2(allocatedFreightCost),
        waybillNumbers: wbs.join(','),
        productName,
        manager,
        profit: round2(profit),
        profitRate: round2(profitRate),
      });
    }
  }

  return results;
}

// ============ SHEIN 利润计算 ============

export interface SheinSettlementRow {
  orderNo: string;
  platformSku: string;
  billType: string;
  receivableAmount: number;
}

export interface SheinOrderMapRow {
  orderNo: string;
  waybillNumber: string;
}

export function calculateSheinProfit(
  settlementData: SheinSettlementRow[],
  orderMapData: SheinOrderMapRow[],
  freightCostMap: Map<string, { cost: number; isDomestic: boolean }>,
  productMap: Map<string, ProductInfo>,
  exchangeRate: number = 0.046,
): ProfitResult[] {
  if (!settlementData.length) return [];

  // 1. 构建订单 → 运单号映射，支持一格多运单号
  const orderToWaybills = new Map<string, string[]>();
  const orderToQty = new Map<string, number>();

  for (const row of orderMapData) {
    const orderNo = String(row.orderNo).trim();
    if (!orderNo) continue;

    orderToQty.set(orderNo, (orderToQty.get(orderNo) || 0) + 1);

    // 用 splitWaybillCell 支持一格多运单号
    const waybills = splitWaybillCell(row.waybillNumber);
    if (waybills.length) {
      const existing = orderToWaybills.get(orderNo) || [];
      const merged = [...new Set([...existing, ...waybills])];
      orderToWaybills.set(orderNo, merged);
    }
  }

  // 2. 按订单号分组结算数据
  const orderGroups = new Map<string, SheinSettlementRow[]>();
  for (const row of settlementData) {
    const orderNo = String(row.orderNo).trim();
    if (!orderNo) continue;
    const group = orderGroups.get(orderNo) || [];
    group.push(row);
    orderGroups.set(orderNo, group);
  }

  const results: ProfitResult[] = [];

  for (const [orderNo, group] of orderGroups) {
    // 收集SKU列表
    const skuSet = new Set<string>();
    for (const row of group) {
      const sku = String(row.platformSku).trim();
      if (sku && sku.toLowerCase() !== 'nan') skuSet.add(sku);
    }
    const skuList = [...skuSet].sort();
    const skuDisplay = skuList.join(',');

    const productQty = orderToQty.get(orderNo) || 0;

    // 分类金额（日元）
    let salesJpy = 0;
    let refundJpy = 0;
    let fulfillJpy = 0;
    let penaltyMinusJpy = 0;
    let penaltyPlusJpy = 0;
    let otherJpy = 0;

    for (const row of group) {
      const type = String(row.billType).trim();
      const amount = Number(row.receivableAmount) || 0;

      if (type === '订单销售收入-订单收入') {
        salesJpy += amount;
      } else if (type === '退货退款-订单调整') {
        refundJpy += amount;
      } else if (type === '平台服务费-退货履约服务费') {
        fulfillJpy += amount;
      } else if (type === '奖惩及其他-违规处罚扣款') {
        penaltyMinusJpy += amount;
      } else if (type === '奖惩及其他-违规处罚补款') {
        penaltyPlusJpy += amount;
      } else {
        otherJpy += amount;
      }
    }

    // totalJpy 包含所有科目（退款为负值，已自然抵扣）
    const totalJpy = salesJpy + refundJpy + fulfillJpy + penaltyMinusJpy + penaltyPlusJpy + otherJpy;

    // 运单号
    const waybills = orderToWaybills.get(orderNo) || [];
    const domestic = getIsDomesticFromMap(waybills, freightCostMap);
    const costType: 'domestic' | 'international' = domestic ? 'domestic' : 'international';

    // 运费成本
    let freightCostTotal = 0;
    for (const wb of new Set(waybills)) {
      const entry = freightCostMap.get(wb);
      freightCostTotal += entry ? entry.cost : 0;
    }

    // 产品成本
    const managerSet: string[] = [];
    const productNameSet: string[] = [];
    const skuCosts: number[] = [];

    for (const sku of skuList) {
      const product = productMap.get(sku);
      if (!product) continue;

      const unitCost = getProductUnitCost(product, costType);
      skuCosts.push(unitCost);

      if (product.manager) managerSet.push(product.manager);
      if (product.productName) productNameSet.push(product.productName);
    }

    let productCostTotal = 0;
    let avgCost = 0;
    if (productQty > 0 && skuCosts.length > 0) {
      avgCost = skuCosts.reduce((a, b) => a + b, 0) / skuCosts.length;
      productCostTotal = avgCost * productQty;
    }

    const managerDisplay = [...new Set(managerSet)].sort().join(',');
    const productNameDisplay = [...new Set(productNameSet)].sort().join(',');

    // 转换为人民币
    // salesIncome：仅销售收入（对应 Python 里的 sales_rmb）
    // 退款金额单独存 salesRefund（绝对值），利润 = totalRmb - cost
    const totalRmb = totalJpy * exchangeRate;
    const salesRmb = salesJpy * exchangeRate;
    const refundRmb = Math.abs(refundJpy) * exchangeRate;

    // 利润 = 总金额（含退款抵扣） - 产品成本 - 运费成本
    const profit = totalRmb - productCostTotal - freightCostTotal;
    // 利润率基准与 Python 保持一致：profit / salesRmb
    const profitRateRaw = salesRmb !== 0 ? (profit / salesRmb) * 100 : 0;
    const profitRate = Math.max(-99999, Math.min(99999, profitRateRaw));

    results.push({
      platform: 'SHEIN',
      orderNo,
      skuId: skuDisplay,
      quantity: productQty,
      salesIncome: round2(salesRmb),       // 仅销售收入（日元×汇率）
      freightIncome: 0,
      salesRefund: round2(refundRmb),      // 退款绝对值（日元×汇率）
      freightRefund: 0,
      isDomestic: domestic,
      productCostUnit: round2(avgCost),
      productCostTotal: round2(productCostTotal),
      freightCost: round2(freightCostTotal),
      waybillNumbers: waybills.join(','),
      productName: productNameDisplay,
      manager: managerDisplay,
      profit: round2(profit),
      profitRate: round2(profitRate),
    });
  }

  return results;
}
