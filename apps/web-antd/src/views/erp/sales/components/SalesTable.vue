<template>
  <div style="height: 100%; overflow: hidden;">
    <Grid style="width: 100%; height: 100%;">
      <!-- 负责人列 -->
    <template #manager="{ row }">
      <span v-if="row.manager" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[13px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
        {{ row.manager }}
      </span>
      <span v-else class="text-gray-400 text-[13px]">-</span>
    </template>

    <!-- 产品信息列 -->
    <template #product-info="{ row }">
      <div class="py-1">
        <div class="font-medium text-gray-900 text-[14px] leading-tight">{{ row.productName }}</div>
        <div class="text-[11px] text-gray-500 mt-1.5">{{ row.skuName }}</div>
      </div>
    </template>

    <!-- 销量趋势列 -->
    <template #trend="{ row }">
      <div style="width: 120px; height: 40px;">
        <LineChart :data="row.trendData" />
      </div>
    </template>

    <!-- 备注列 -->
    <template #remark="{ row }">
      <Button type="link" size="small" @click="handleViewRemark(row)">
        <span v-if="row.remark" class="text-blue-600">查看</span>
        <span v-else class="text-gray-400">添加</span>
      </Button>
    </template>

    <!-- 动态日期列 -->
    <template v-for="date in dateColumns" :key="date.field" #[date.field]="{ row }">
      <span class="text-[13px]">{{ row[date.field] || 0 }}</span>
    </template>
  </Grid>

  <!-- 备注弹窗 -->
  <Modal
    v-model:open="remarkModalVisible"
    title="备注信息"
    @ok="handleSaveRemark"
    @cancel="handleCancelRemark"
  >
    <Input.TextArea
      v-model:value="currentRemark"
      :rows="6"
      placeholder="请输入备注信息"
    />
  </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Button, Modal, Input } from 'ant-design-vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSalesStatistics } from '#/api/core/sales';
import type { Dayjs } from 'dayjs';
import LineChart from './LineChart.vue';

const props = defineProps<{
  dateRange: [Dayjs, Dayjs];
  searchForm: {
    keyword: string;
    manager: string | undefined;
  };
  statisticsMode: 'quantity' | 'orders';
}>();

// 备注相关状态
const remarkModalVisible = ref(false);
const currentRemark = ref('');
const currentRow = ref<any>(null);

// 查看/编辑备注
function handleViewRemark(row: any) {
  currentRow.value = row;
  currentRemark.value = row.remark || '';
  remarkModalVisible.value = true;
}

// 保存备注
function handleSaveRemark() {
  if (currentRow.value) {
    currentRow.value.remark = currentRemark.value;
    // TODO: 调用API保存备注到后端
  }
  remarkModalVisible.value = false;
}

// 取消备注编辑
function handleCancelRemark() {
  remarkModalVisible.value = false;
  currentRemark.value = '';
  currentRow.value = null;
}

// 生成日期列
const dateColumns = computed(() => {
  if (!props.dateRange || props.dateRange.length !== 2) {
    return [];
  }

  const [start, end] = props.dateRange;
  const columns: Array<{ field: string; title: string }> = [];
  let current = end;

  while (current.isAfter(start) || current.isSame(start, 'day')) {
    const field = `date_${current.format('YYYY_MM_DD')}`;
    const dateStr = current.format('M-D');
    const weekday = ['日', '一', '二', '三', '四', '五', '六'][current.day()];

    columns.push({
      field: field,
      title: `${dateStr}\n周${weekday}`,
    });

    current = current.subtract(1, 'day');
  }

  return columns;
});

// 固定列配置
const fixedColumns = [
  {
    title: '负责人',
    field: 'manager',
    width: 120,
    fixed: 'left',
    slots: { default: 'manager' },
  },
  {
    title: '产品信息',
    field: 'productName',
    minWidth: 200,
    fixed: 'left',
    slots: { default: 'product-info' },
  },
  {
    title: '总销量',
    field: 'totalSales',
    width: 100,
    align: 'center',
    fixed: 'left',
    formatter: ({ cellValue }: any) => cellValue ? Math.round(cellValue) : '0',
  },
  {
    title: '平均日销',
    field: 'avgDailySales',
    width: 100,
    align: 'center',
    fixed: 'left',
    formatter: ({ cellValue }: any) => cellValue ? cellValue.toFixed(1) : '0',
  },
  {
    title: '备注',
    field: 'remark',
    width: 80,
    align: 'center',
    fixed: 'left',
    slots: { default: 'remark' },
  },
  {
    title: '销量趋势',
    field: 'trend',
    width: 140,
    align: 'center',
    fixed: 'left',
    slots: { default: 'trend' },
  },
];

// 生成所有列
const allColumns = computed(() => {
  const dynamicCols = dateColumns.value.map(col => ({
    title: col.title,
    field: col.field,
    width: 80,
    align: 'center' as const,
  }));
  return [...fixedColumns, ...dynamicCols];
});

// 表格配置
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    height: '100%',
    rowConfig: {
      keyField: 'id',
      height: 60,
      isHover: true,
    },
    columnConfig: {
      resizable: true,
    },
    scrollX: {
      enabled: true,
    },
    scrollY: {
      enabled: true,
    },
    showFooter: true,
    footerMethod: ({ columns, data }: any) => {
      const footerData = [
        columns.map((column: any, columnIndex: number) => {
          if (columnIndex === 0) {
            return '合计';
          }
          if (column.field === 'totalSales') {
            return Math.round(data.reduce((sum: number, row: any) => sum + (row.totalSales || 0), 0));
          }
          if (column.field === 'avgDailySales') {
            const total = data.reduce((sum: number, row: any) => sum + (row.totalSales || 0), 0);
            const days = dateColumns.value.length;
            return days > 0 ? (total / days).toFixed(1) : '0';
          }
          if (column.field && column.field.startsWith('date_')) {
            return Math.round(data.reduce((sum: number, row: any) => sum + (row[column.field] || 0), 0));
          }
          return '';
        }),
      ];
      return footerData;
    },
    columns: allColumns.value,
    pagerConfig: {
      enabled: true,
      pageSize: 30,
      pageSizes: [30, 50, 200, 500],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }: any) => {
          const params = {
            page: page.currentPage,
            pageSize: page.pageSize,
            keyword: props.searchForm.keyword || '',
            manager: props.searchForm.manager || '',
            startDate: props.dateRange[0].format('YYYY-MM-DD'),
            endDate: props.dateRange[1].format('YYYY-MM-DD'),
            mode: props.statisticsMode,
          };

          const result = await getSalesStatistics(params);
          return result;
        },
      },
    },
    toolbarConfig: {
      enabled: false,
    },
  },
});

// 监听搜索条件变化，重新加载数据
watch(
  () => props.searchForm,
  () => {
    gridApi.reload();
  },
  { deep: true }
);
</script>

<style scoped>
:deep(.vxe-footer--column) {
  font-weight: bold;
}
</style>
