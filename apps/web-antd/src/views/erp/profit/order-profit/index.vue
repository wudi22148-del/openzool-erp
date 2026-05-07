<template>
  <div class="p-4">
    <!-- 利润计算 -->
    <Card :bordered="false" class="mb-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-1">
          <span class="text-sm">月份：</span>
          <DatePicker
            v-model:value="calcMonth"
            picker="month"
            format="YYYY-MM"
            valueFormat="YYYY-MM"
            placeholder="月份"
            style="width: 120px"
            size="small"
          />
        </div>
        <div class="flex items-center gap-1">
          <span class="text-sm">计算平台：</span>
          <Select v-model:value="calcPlatform" style="width: 100px" size="small">
            <SelectOption value="TEMU">TEMU</SelectOption>
            <SelectOption value="SHEIN">SHEIN</SelectOption>
            <SelectOption value="ALL">全部</SelectOption>
          </Select>
        </div>
        <Button type="primary" size="small" :loading="calculating" @click="handleCalculate">
          <template #icon><CalculatorOutlined /></template>
          计算利润
        </Button>
      </div>
    </Card>

    <!-- 利润明细 -->
    <Card :bordered="false">
      <div class="mb-3 flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-1">
          <span class="text-sm">月份：</span>
          <Select v-model:value="viewMonth" style="width: 120px" size="small" placeholder="月份" @change="handleQuery">
            <SelectOption v-for="m in calculatedMonths" :key="m" :value="m">{{ m }}</SelectOption>
          </Select>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-sm">平台：</span>
          <Select v-model:value="viewPlatform" style="width: 100px" size="small" placeholder="全部" allowClear @change="handleQuery">
            <SelectOption value="TEMU">TEMU</SelectOption>
            <SelectOption value="SHEIN">SHEIN</SelectOption>
          </Select>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-sm">管理人：</span>
          <Select v-model:value="viewManager" style="width: 110px" size="small" placeholder="全部" allowClear @change="handleQuery">
            <SelectOption v-for="m in managerList" :key="m" :value="m">{{ m }}</SelectOption>
          </Select>
        </div>
        <Checkbox v-model:checked="filterNoManager" size="small" @change="handleQuery">无管理人</Checkbox>
        <Checkbox v-model:checked="filterNoProductCost" size="small" @change="handleQuery">无产品成本</Checkbox>
        <Checkbox v-model:checked="filterNoFreightCost" size="small" @change="handleQuery">无运费成本</Checkbox>
        <Button type="primary" size="small" @click="handleQuery">查询</Button>
        <Button size="small" @click="handleExport" :disabled="!profitRecords.length">
          <template #icon><DownloadOutlined /></template>
          导出
        </Button>
      </div>

      <Table
        :columns="columns"
        :data-source="profitRecords"
        :loading="queryLoading"
        :pagination="pagination"
        :scroll="{ x: 2200, y: 'calc(100vh - 380px)' }"
        row-key="id"
        size="small"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'isDomestic'">
            <Tag :color="record.isDomestic ? 'orange' : 'blue'" style="margin:0">
              {{ record.isDomestic ? '是' : '否' }}
            </Tag>
          </template>
          <template v-if="column.key === 'profit'">
            <span :class="record.profit >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ record.profit?.toFixed(2) }}
            </span>
          </template>
          <template v-if="column.key === 'profitRate'">
            <span :class="record.profitRate >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ record.profitRate?.toFixed(2) }}%
            </span>
          </template>
          <template v-if="column.key === 'manager'">
            <Tag v-if="record.manager" color="blue" style="margin:0">{{ record.manager }}</Tag>
            <span v-else class="text-gray-400">-</span>
          </template>
        </template>

        <!-- 底部总计（固定） -->
        <template #summary v-if="allSummary">
          <TableSummary fixed="bottom">
          <TableSummaryRow>
            <TableSummaryCell :index="0" :col-span="3">
              <span class="font-medium">总计</span>
            </TableSummaryCell>
            <TableSummaryCell :index="3" align="right">
              <span class="font-medium">{{ allSummary.quantity }}</span>
            </TableSummaryCell>
            <TableSummaryCell :index="4" align="right">
              <span class="font-medium">¥{{ allSummary.salesIncome }}</span>
            </TableSummaryCell>
            <TableSummaryCell :index="5" align="right">
              <span class="font-medium">¥{{ allSummary.freightIncome }}</span>
            </TableSummaryCell>
            <TableSummaryCell :index="6" align="right">
              <span class="font-medium">¥{{ allSummary.salesRefund }}</span>
            </TableSummaryCell>
            <TableSummaryCell :index="7" align="right">
              <span class="font-medium">¥{{ allSummary.freightRefund }}</span>
            </TableSummaryCell>
            <TableSummaryCell :index="8" />
            <TableSummaryCell :index="9" />
            <TableSummaryCell :index="10" align="right">
              <span class="font-medium">¥{{ allSummary.productCostTotal }}</span>
            </TableSummaryCell>
            <TableSummaryCell :index="11" align="right">
              <span class="font-medium">¥{{ allSummary.freightCost }}</span>
            </TableSummaryCell>
            <TableSummaryCell :index="12" />
            <TableSummaryCell :index="13" />
            <TableSummaryCell :index="14" />
            <TableSummaryCell :index="15" align="right">
              <span class="font-medium" :class="parseFloat(allSummary.profit) >= 0 ? 'text-green-600' : 'text-red-600'">
                ¥{{ allSummary.profit }}
              </span>
            </TableSummaryCell>
            <TableSummaryCell :index="16" align="right">
              <span class="font-medium" :class="parseFloat(allSummary.profitRate) >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ allSummary.profitRate }}%
              </span>
            </TableSummaryCell>
          </TableSummaryRow>
          </TableSummary>
        </template>
      </Table>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  Button, Card, Checkbox, DatePicker, Select, Table, Tag, message,
} from 'ant-design-vue';
import {
  CalculatorOutlined, DownloadOutlined,
} from '@ant-design/icons-vue';
import { exportExcel } from '#/utils/excel';
import {
  calculateOrderProfit,
  getOrderProfitList,
  getOrderProfitSummary,
  getOrderProfitMonths,
} from '#/api/core/order-profit';

const SelectOption = Select.Option;
const TableSummary = Table.Summary;
const TableSummaryRow = Table.Summary.Row;
const TableSummaryCell = Table.Summary.Cell;

// ============ 计算相关 ============

const calcMonth = ref('');
const calcPlatform = ref('TEMU');
const calculating = ref(false);

async function handleCalculate() {
  if (!calcMonth.value) { message.warning('请选择月份'); return; }
  try {
    calculating.value = true;
    const res = await calculateOrderProfit({ month: calcMonth.value, platform: calcPlatform.value });
    if (res) {
      message.success(`计算完成：${res.count} 条，总利润 ¥${res.totalProfit}，利润率 ${res.profitRate}%`);
      await loadMonths();
      viewMonth.value = calcMonth.value;
      await handleQuery();
    }
  } catch (e: any) { message.error(`计算失败: ${e.message}`); }
  finally { calculating.value = false; }
}

// ============ 查询相关 ============

const viewMonth = ref('');
const viewPlatform = ref<string | undefined>(undefined);
const viewManager = ref<string | undefined>(undefined);
const filterNoManager = ref(false);
const filterNoProductCost = ref(false);
const filterNoFreightCost = ref(false);
const queryLoading = ref(false);
const profitRecords = ref<any[]>([]);
const calculatedMonths = ref<string[]>([]);
const managerList = ref<string[]>([]);
const allSummary = ref<any>(null);

const pagination = ref({
  current: 1,
  pageSize: 50,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

async function handleQuery() {
  if (!viewMonth.value) return;
  try {
    queryLoading.value = true;
    const params: any = {
      month: viewMonth.value,
      manager: viewManager.value,
      platform: viewPlatform.value,
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    };
    if (filterNoManager.value) params.noManager = '1';
    if (filterNoProductCost.value) params.noProductCost = '1';
    if (filterNoFreightCost.value) params.noFreightCost = '1';

    const summaryParams: any = {
      month: viewMonth.value,
      manager: viewManager.value,
      platform: viewPlatform.value,
    };
    if (filterNoManager.value) summaryParams.noManager = '1';
    if (filterNoProductCost.value) summaryParams.noProductCost = '1';
    if (filterNoFreightCost.value) summaryParams.noFreightCost = '1';

    const [listRes, summaryRes] = await Promise.all([
      getOrderProfitList(params),
      getOrderProfitSummary(summaryParams),
    ]);

    if (listRes) {
      profitRecords.value = listRes.items || [];
      pagination.value.total = listRes.total || 0;
    }

    if (summaryRes && Array.isArray(summaryRes)) {
      const s = {
        quantity: 0, salesIncome: 0, freightIncome: 0, salesRefund: 0, freightRefund: 0,
        productCostTotal: 0, freightCost: 0, profit: 0,
      };
      const managers = new Set<string>();
      for (const row of summaryRes) {
        s.quantity += row.totalQuantity || 0;
        s.salesIncome += row.totalSalesIncome || 0;
        s.freightIncome += row.totalFreightIncome || 0;
        s.salesRefund += row.totalSalesRefund || 0;
        s.freightRefund += row.totalFreightRefund || 0;
        s.productCostTotal += row.totalProductCost || 0;
        s.freightCost += row.totalFreightCost || 0;
        s.profit += row.totalProfit || 0;
        if (row.manager) managers.add(row.manager);
      }
      const revenue = s.salesIncome - s.salesRefund + s.freightIncome - s.freightRefund;
      allSummary.value = {
        quantity: s.quantity,
        salesIncome: s.salesIncome.toFixed(2),
        freightIncome: s.freightIncome.toFixed(2),
        salesRefund: s.salesRefund.toFixed(2),
        freightRefund: s.freightRefund.toFixed(2),
        productCostTotal: s.productCostTotal.toFixed(2),
        freightCost: s.freightCost.toFixed(2),
        profit: s.profit.toFixed(2),
        profitRate: revenue !== 0 ? (s.profit / revenue * 100).toFixed(2) : '0.00',
      };
      managerList.value = [...managers].sort();
    }
  } catch (e: any) { message.error(`查询失败: ${e.message}`); }
  finally { queryLoading.value = false; }
}

function handleTableChange(pag: any) {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  handleQuery();
}

// ============ 导出 ============

function handleExport() {
  if (!profitRecords.value.length) return;
  const data = profitRecords.value.map((r: any) => ({
    '平台': r.platform, '订单编号': r.orderNo, 'SKUID': r.skuId, '销售数量': r.quantity,
    '交易收入': r.salesIncome, '运费收入': r.freightIncome, '销售退款': r.salesRefund,
    '运费退款': r.freightRefund, '国内发货': r.isDomestic ? '是' : '否',
    '产品成本': r.productCostUnit, '产品总成本': r.productCostTotal, '运费成本': r.freightCost,
    '运单号': r.waybillNumbers, '产品名称': r.productName, '管理人': r.manager,
    '利润': r.profit, '利润率': `${r.profitRate?.toFixed(2)}%`,
  }));
  exportExcel(data, `订单利润明细_${viewMonth.value}.xlsx`);
  message.success('导出成功');
}

// ============ 表格列 ============

const columns = [
  { title: '平台', dataIndex: 'platform', key: 'platform', width: 70, fixed: 'left' as const },
  { title: '订单编号', dataIndex: 'orderNo', key: 'orderNo', width: 140, fixed: 'left' as const, ellipsis: true },
  { title: 'SKUID', dataIndex: 'skuId', key: 'skuId', width: 120, ellipsis: true },
  { title: '销售数量', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'right' as const },
  { title: '交易收入', dataIndex: 'salesIncome', key: 'salesIncome', width: 100, align: 'right' as const, customRender: ({ text }: any) => `¥${text?.toFixed(2)}` },
  { title: '运费收入', dataIndex: 'freightIncome', key: 'freightIncome', width: 100, align: 'right' as const, customRender: ({ text }: any) => `¥${text?.toFixed(2)}` },
  { title: '销售退款', dataIndex: 'salesRefund', key: 'salesRefund', width: 100, align: 'right' as const, customRender: ({ text }: any) => `¥${text?.toFixed(2)}` },
  { title: '运费退款', dataIndex: 'freightRefund', key: 'freightRefund', width: 100, align: 'right' as const, customRender: ({ text }: any) => `¥${text?.toFixed(2)}` },
  { title: '国内发货', key: 'isDomestic', width: 80, align: 'center' as const },
  { title: '产品成本', dataIndex: 'productCostUnit', key: 'productCostUnit', width: 90, align: 'right' as const, customRender: ({ text }: any) => `¥${text?.toFixed(2)}` },
  { title: '产品总成本', dataIndex: 'productCostTotal', key: 'productCostTotal', width: 100, align: 'right' as const, customRender: ({ text }: any) => `¥${text?.toFixed(2)}` },
  { title: '运费成本', dataIndex: 'freightCost', key: 'freightCost', width: 90, align: 'right' as const, customRender: ({ text }: any) => `¥${text?.toFixed(2)}` },
  { title: '运单号', dataIndex: 'waybillNumbers', key: 'waybillNumbers', width: 140, ellipsis: true },
  { title: '产品名称', dataIndex: 'productName', key: 'productName', width: 120, ellipsis: true },
  { title: '管理人', key: 'manager', width: 90 },
  { title: '利润', key: 'profit', width: 100, align: 'right' as const, fixed: 'right' as const },
  { title: '利润率', key: 'profitRate', width: 80, align: 'right' as const, fixed: 'right' as const },
];

// ============ 初始化 ============

async function loadMonths() {
  try {
    const res = await getOrderProfitMonths();
    if (res) {
      calculatedMonths.value = res.calculatedMonths || [];
    }
  } catch { /* ignore */ }
}

onMounted(async () => {
  await loadMonths();
  if (calculatedMonths.value.length > 0) {
    viewMonth.value = calculatedMonths.value[0]!;
    await handleQuery();
  }
});
</script>
