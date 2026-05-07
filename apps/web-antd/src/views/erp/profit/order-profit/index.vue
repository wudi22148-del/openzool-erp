<template>
  <div class="p-4">
    <!-- 利润计算 -->
    <Card :bordered="false" class="mb-4" v-if="canCalculate">
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
          <Select v-model:value="viewMonth" style="width: 120px" size="small" placeholder="月份" @change="resetAndQuery">
            <SelectOption v-for="m in calculatedMonths" :key="m" :value="m">{{ m }}</SelectOption>
          </Select>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-sm">平台：</span>
          <Select v-model:value="viewPlatform" style="width: 100px" size="small" placeholder="全部" allowClear @change="resetAndQuery">
            <SelectOption value="TEMU">TEMU</SelectOption>
            <SelectOption value="SHEIN">SHEIN</SelectOption>
          </Select>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-sm">管理人：</span>
          <Select v-model:value="viewManager" style="width: 110px" size="small" placeholder="全部" allowClear @change="resetAndQuery">
            <SelectOption v-for="m in managerList" :key="m" :value="m">{{ m }}</SelectOption>
          </Select>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-sm">国内发货：</span>
          <Select v-model:value="viewIsDomestic" style="width: 90px" size="small" placeholder="全部" allowClear @change="resetAndQuery">
            <SelectOption value="1">是</SelectOption>
            <SelectOption value="0">否</SelectOption>
          </Select>
        </div>
        <Checkbox v-model:checked="filterNoManager" size="small" @change="resetAndQuery">无管理人</Checkbox>
        <Checkbox v-model:checked="filterNoProductCost" size="small" @change="resetAndQuery">无产品成本</Checkbox>
        <Checkbox v-model:checked="filterNoFreightCost" size="small" @change="resetAndQuery">无运费成本</Checkbox>
        <Input
          v-model:value="viewKeyword"
          placeholder="搜索产品名/SKUID/订单号/运单号"
          style="width: 220px"
          size="small"
          allowClear
          @pressEnter="resetAndQuery"
          @change="onKeywordChange"
        />
        <Button type="primary" size="small" @click="resetAndQuery">查询</Button>
        <Button size="small" :loading="exporting" @click="handleExport">
          <template #icon><DownloadOutlined /></template>
          导出全部
        </Button>
      </div>

      <Table
        :columns="columns"
        :data-source="profitRecords"
        :loading="queryLoading"
        :pagination="pagination"
        :scroll="{ x: 2400, y: 'calc(100vh - 380px)' }"
        row-key="id"
        size="small"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'rowIndex'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>
          <template v-if="column.key === 'isDomestic'">
            <Tag :color="record.isDomestic ? 'orange' : 'blue'" style="margin:0">
              {{ record.isDomestic ? '是' : '否' }}
            </Tag>
          </template>
          <template v-if="column.key === 'productCostUnit'">
            <a v-if="canEditCost" @click="openEditCost(record)">¥{{ record.productCostUnit?.toFixed(2) }}</a>
            <span v-else>¥{{ record.productCostUnit?.toFixed(2) }}</span>
          </template>
          <template v-if="column.key === 'productCostTotal'">
            <a v-if="canEditCost" @click="openEditCost(record)">¥{{ record.productCostTotal?.toFixed(2) }}</a>
            <span v-else>¥{{ record.productCostTotal?.toFixed(2) }}</span>
          </template>
          <template v-if="column.key === 'freightCost'">
            <a v-if="canEditCost" @click="openEditCost(record)">¥{{ record.freightCost?.toFixed(2) }}</a>
            <span v-else>¥{{ record.freightCost?.toFixed(2) }}</span>
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
          <template v-if="column.key === 'action'">
            <Button type="link" size="small" @click="openFeedback(record)">
              反馈
            </Button>
          </template>
        </template>

        <!-- 底部总计（固定） -->
        <template #summary v-if="allSummary">
          <TableSummary fixed="bottom">
          <TableSummaryRow>
            <TableSummaryCell :index="0" :col-span="4">
              <span class="font-medium">总计</span>
            </TableSummaryCell>
            <TableSummaryCell :index="4" align="right">
              <span class="font-medium">{{ allSummary.quantity }}</span>
            </TableSummaryCell>
            <TableSummaryCell :index="5" align="right">
              <span class="font-medium">¥{{ allSummary.salesIncome }}</span>
            </TableSummaryCell>
            <TableSummaryCell :index="6" align="right">
              <span class="font-medium">¥{{ allSummary.freightIncome }}</span>
            </TableSummaryCell>
            <TableSummaryCell :index="7" align="right">
              <span class="font-medium">¥{{ allSummary.salesRefund }}</span>
            </TableSummaryCell>
            <TableSummaryCell :index="8" align="right">
              <span class="font-medium">¥{{ allSummary.freightRefund }}</span>
            </TableSummaryCell>
            <TableSummaryCell :index="9" />
            <TableSummaryCell :index="10" />
            <TableSummaryCell :index="11" align="right">
              <span class="font-medium">¥{{ allSummary.productCostTotal }}</span>
            </TableSummaryCell>
            <TableSummaryCell :index="12" align="right">
              <span class="font-medium">¥{{ allSummary.freightCost }}</span>
            </TableSummaryCell>
            <TableSummaryCell :index="13" />
            <TableSummaryCell :index="14" />
            <TableSummaryCell :index="15" />
            <TableSummaryCell :index="16" align="right">
              <span class="font-medium" :class="parseFloat(allSummary.profit) >= 0 ? 'text-green-600' : 'text-red-600'">
                ¥{{ allSummary.profit }}
              </span>
            </TableSummaryCell>
            <TableSummaryCell :index="17" align="right">
              <span class="font-medium" :class="parseFloat(allSummary.profitRate) >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ allSummary.profitRate }}%
              </span>
            </TableSummaryCell>
            <TableSummaryCell :index="18" />
          </TableSummaryRow>
          </TableSummary>
        </template>
      </Table>
    </Card>

    <!-- 反馈弹窗 -->
    <Modal
      v-model:open="feedbackVisible"
      title="订单异常反馈"
      :confirm-loading="feedbackSubmitting"
      @ok="submitFeedback"
      @cancel="feedbackVisible = false"
    >
      <div v-if="feedbackOrder" class="space-y-2">
        <div><strong>订单：</strong>{{ feedbackOrder.orderNo }}</div>
        <div><strong>SKU：</strong>{{ feedbackOrder.skuId }}</div>
        <div><strong>产品名称：</strong>{{ feedbackOrder.productName }}</div>
        <div class="mt-3">
          <Textarea
            v-model:value="feedbackText"
            placeholder="请描述具体问题..."
            :rows="4"
            :maxlength="500"
            show-count
          />
        </div>
      </div>
    </Modal>

    <!-- 编辑成本弹窗 -->
    <Modal
      v-model:open="editCostVisible"
      title="修改订单成本"
      :confirm-loading="editCostSubmitting"
      @ok="submitEditCost"
      @cancel="editCostVisible = false"
    >
      <div v-if="editingOrder" class="space-y-3">
        <div><strong>订单：</strong>{{ editingOrder.orderNo }}</div>
        <div><strong>SKU：</strong>{{ editingOrder.skuId }} ({{ editingOrder.quantity }}件)</div>
        <div class="flex items-center gap-2">
          <span style="width: 90px">产品成本：</span>
          <InputNumber v-model:value="editForm.productCostUnit" :min="0" :precision="2" style="width: 150px" @change="onProductCostUnitChange" />
        </div>
        <div class="flex items-center gap-2">
          <span style="width: 90px">产品总成本：</span>
          <InputNumber v-model:value="editForm.productCostTotal" :min="0" :precision="2" style="width: 150px" />
        </div>
        <div class="flex items-center gap-2">
          <span style="width: 90px">运费成本：</span>
          <InputNumber v-model:value="editForm.freightCost" :min="0" :precision="2" style="width: 150px" />
        </div>
        <div class="text-xs text-gray-500 mt-2">
          修改后将自动重新计算利润和利润率
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import {
  Button, Card, Checkbox, DatePicker, Input, InputNumber, Modal,
  Select, Table, Tag, message,
} from 'ant-design-vue';
import {
  CalculatorOutlined, DownloadOutlined,
} from '@ant-design/icons-vue';
import { useUserStore } from '@vben/stores';
import { exportExcel } from '#/utils/excel';
import {
  calculateOrderProfit,
  exportOrderProfit,
  getOrderProfitList,
  getOrderProfitMonths,
  getOrderProfitSummary,
  submitOrderFeedback,
  updateOrderProfitCost,
} from '#/api/core/order-profit';

const SelectOption = Select.Option;
const Textarea = Input.TextArea;
const TableSummary = Table.Summary;
const TableSummaryRow = Table.Summary.Row;
const TableSummaryCell = Table.Summary.Cell;

const userStore = useUserStore();
const userRoles = computed(() => userStore.userRoles || []);
const isAdmin = computed(() => userRoles.value.includes('admin'));
const isSupervisor = computed(() => userRoles.value.includes('supervisor'));
const canEditCost = computed(() => isAdmin.value || isSupervisor.value);
const canCalculate = computed(() => isAdmin.value || isSupervisor.value);

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
const viewIsDomestic = ref<string | undefined>(undefined);
const viewKeyword = ref('');
const filterNoManager = ref(false);
const filterNoProductCost = ref(false);
const filterNoFreightCost = ref(false);
const queryLoading = ref(false);
const exporting = ref(false);
const profitRecords = ref<any[]>([]);
const calculatedMonths = ref<string[]>([]);
const managerList = ref<string[]>([]);
const allSummary = ref<any>(null);
const sortField = ref<string | undefined>(undefined);
const sortOrder = ref<string | undefined>(undefined);

const pagination = ref({
  current: 1,
  pageSize: 50,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

function resetAndQuery() {
  pagination.value.current = 1;
  handleQuery();
}

function onKeywordChange(e: Event) {
  if (!(e.target as HTMLInputElement).value) {
    pagination.value.current = 1;
    handleQuery();
  }
}

function buildQueryParams() {
  const params: any = {
    month: viewMonth.value,
    manager: viewManager.value,
    platform: viewPlatform.value,
  };
  if (filterNoManager.value) params.noManager = '1';
  if (filterNoProductCost.value) params.noProductCost = '1';
  if (filterNoFreightCost.value) params.noFreightCost = '1';
  if (viewIsDomestic.value) params.isDomestic = viewIsDomestic.value;
  if (viewKeyword.value.trim()) params.keyword = viewKeyword.value.trim();
  return params;
}

async function handleQuery() {
  if (!viewMonth.value) return;
  try {
    queryLoading.value = true;
    const baseParams = buildQueryParams();
    const params: any = {
      ...baseParams,
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    };
    if (sortField.value && sortOrder.value) {
      params.sortField = sortField.value;
      params.sortOrder = sortOrder.value;
    }

    const [listRes, summaryRes] = await Promise.all([
      getOrderProfitList(params),
      getOrderProfitSummary(baseParams),
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

function handleTableChange(pag: any, _filters: any, sorter: any) {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  if (sorter && sorter.field && sorter.order) {
    sortField.value = sorter.field;
    sortOrder.value = sorter.order;
  } else {
    sortField.value = undefined;
    sortOrder.value = undefined;
  }
  handleQuery();
}

// ============ 导出 ============

async function handleExport() {
  if (!viewMonth.value) { message.warning('请先选择月份'); return; }
  try {
    exporting.value = true;
    const all = await exportOrderProfit(buildQueryParams());
    if (!Array.isArray(all) || !all.length) {
      message.warning('没有可导出的数据');
      return;
    }
    const data = all.map((r: any) => ({
      '平台': r.platform, '订单编号': r.orderNo, 'SKUID': r.skuId, '销售数量': r.quantity,
      '交易收入': r.salesIncome, '运费收入': r.freightIncome, '销售退款': r.salesRefund,
      '运费退款': r.freightRefund, '国内发货': r.isDomestic ? '是' : '否',
      '产品成本': r.productCostUnit, '产品总成本': r.productCostTotal, '运费成本': r.freightCost,
      '运单号': r.waybillNumbers, '产品名称': r.productName, '管理人': r.manager,
      '利润': r.profit, '利润率': `${r.profitRate?.toFixed(2)}%`,
    }));
    exportExcel(data, `订单利润明细_${viewMonth.value}.xlsx`);
    message.success(`导出成功：${all.length} 条`);
  } catch (e: any) {
    message.error(`导出失败: ${e.message}`);
  } finally {
    exporting.value = false;
  }
}

// ============ 反馈 ============

const feedbackVisible = ref(false);
const feedbackOrder = ref<any>(null);
const feedbackText = ref('');
const feedbackSubmitting = ref(false);

function openFeedback(record: any) {
  feedbackOrder.value = record;
  feedbackText.value = '';
  feedbackVisible.value = true;
}

async function submitFeedback() {
  if (!feedbackText.value.trim()) {
    message.warning('请填写反馈内容');
    return;
  }
  try {
    feedbackSubmitting.value = true;
    await submitOrderFeedback({
      orderProfitId: feedbackOrder.value.id,
      feedbackText: feedbackText.value.trim(),
    });
    message.success('反馈已提交');
    feedbackVisible.value = false;
  } catch (e: any) {
    message.error(`提交失败: ${e.message}`);
  } finally {
    feedbackSubmitting.value = false;
  }
}

// ============ 修改成本 ============

const editCostVisible = ref(false);
const editingOrder = ref<any>(null);
const editCostSubmitting = ref(false);
const editForm = reactive({
  productCostUnit: 0,
  productCostTotal: 0,
  freightCost: 0,
});

function openEditCost(record: any) {
  if (!canEditCost.value) return;
  editingOrder.value = record;
  editForm.productCostUnit = record.productCostUnit || 0;
  editForm.productCostTotal = record.productCostTotal || 0;
  editForm.freightCost = record.freightCost || 0;
  editCostVisible.value = true;
}

function onProductCostUnitChange(val: number | string | null) {
  const unit = Number(val) || 0;
  const qty = editingOrder.value?.quantity || 0;
  editForm.productCostTotal = Math.round(unit * qty * 100) / 100;
}

async function submitEditCost() {
  if (!editingOrder.value) return;
  try {
    editCostSubmitting.value = true;
    const res = await updateOrderProfitCost({
      id: editingOrder.value.id,
      productCostUnit: editForm.productCostUnit,
      productCostTotal: editForm.productCostTotal,
      freightCost: editForm.freightCost,
    });
    if (res) {
      // 更新当前行数据
      const idx = profitRecords.value.findIndex(r => r.id === editingOrder.value.id);
      if (idx >= 0) {
        profitRecords.value[idx] = {
          ...profitRecords.value[idx],
          productCostUnit: res.productCostUnit,
          productCostTotal: res.productCostTotal,
          freightCost: res.freightCost,
          profit: res.profit,
          profitRate: res.profitRate,
        };
      }
      message.success('修改成功');
      editCostVisible.value = false;
      // 重新查询以更新汇总
      handleQuery();
    }
  } catch (e: any) {
    message.error(`修改失败: ${e.message}`);
  } finally {
    editCostSubmitting.value = false;
  }
}

// ============ 表格列 ============

const columns = computed(() => [
  { title: '序号', key: 'rowIndex', width: 60, fixed: 'left' as const, align: 'center' as const },
  { title: '平台', dataIndex: 'platform', key: 'platform', width: 70, fixed: 'left' as const },
  { title: '订单编号', dataIndex: 'orderNo', key: 'orderNo', width: 140, fixed: 'left' as const, ellipsis: true },
  { title: 'SKUID', dataIndex: 'skuId', key: 'skuId', width: 120, ellipsis: true },
  { title: '销售数量', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'right' as const },
  { title: '交易收入', dataIndex: 'salesIncome', key: 'salesIncome', width: 100, align: 'right' as const, customRender: ({ text }: any) => `¥${text?.toFixed(2)}` },
  { title: '运费收入', dataIndex: 'freightIncome', key: 'freightIncome', width: 100, align: 'right' as const, customRender: ({ text }: any) => `¥${text?.toFixed(2)}` },
  { title: '销售退款', dataIndex: 'salesRefund', key: 'salesRefund', width: 100, align: 'right' as const, customRender: ({ text }: any) => `¥${text?.toFixed(2)}` },
  { title: '运费退款', dataIndex: 'freightRefund', key: 'freightRefund', width: 100, align: 'right' as const, customRender: ({ text }: any) => `¥${text?.toFixed(2)}` },
  { title: '国内发货', key: 'isDomestic', width: 80, align: 'center' as const },
  { title: '产品成本', dataIndex: 'productCostUnit', key: 'productCostUnit', width: 90, align: 'right' as const },
  { title: '产品总成本', dataIndex: 'productCostTotal', key: 'productCostTotal', width: 100, align: 'right' as const },
  { title: '运费成本', dataIndex: 'freightCost', key: 'freightCost', width: 90, align: 'right' as const },
  { title: '运单号', dataIndex: 'waybillNumbers', key: 'waybillNumbers', width: 140, ellipsis: true },
  { title: '产品名称', dataIndex: 'productName', key: 'productName', width: 120, ellipsis: true },
  { title: '管理人', key: 'manager', width: 90 },
  { title: '利润', key: 'profit', dataIndex: 'profit', width: 100, align: 'right' as const, fixed: 'right' as const, sorter: true },
  { title: '利润率', key: 'profitRate', dataIndex: 'profitRate', width: 90, align: 'right' as const, fixed: 'right' as const, sorter: true },
  { title: '操作', key: 'action', width: 80, fixed: 'right' as const, align: 'center' as const },
]);

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
