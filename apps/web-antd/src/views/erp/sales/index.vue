<template>
  <div class="p-4">
    <!-- 搜索和操作区 -->
    <div class="mb-4 flex items-center justify-between">
      <!-- 左侧：搜索表单 -->
      <Space size="middle">
        <!-- 统计模式切换 -->
        <Space>
          <Button
            :type="statisticsMode === 'quantity' ? 'primary' : 'default'"
            @click="handleStatisticsModeChange('quantity')"
          >
            销售数量
          </Button>
          <Button
            :type="statisticsMode === 'orders' ? 'primary' : 'default'"
            @click="handleStatisticsModeChange('orders')"
          >
            订单数量
          </Button>
        </Space>

        <Input
          v-model:value="searchForm.keyword"
          placeholder="搜索产品名或SKU"
          style="width: 260px"
          allow-clear
          @pressEnter="handleSearch"
        >
          <template #suffix>
            <Button type="link" size="small" @click="handleSearch">
              搜索
            </Button>
          </template>
        </Input>
        <Select
          v-model:value="searchForm.manager"
          placeholder="筛选管理人"
          allow-clear
          style="width: 160px"
          @change="handleSearch"
        >
          <SelectOption v-for="item in managerList" :key="item.value" :value="item.value">
            {{ item.label }}
          </SelectOption>
        </Select>

        <!-- 时间段快速选择 -->
        <Space>
          <Button
            :type="quickDateRange === '7' ? 'primary' : 'default'"
            @click="handleQuickDateChange('7')"
          >
            近7天
          </Button>
          <Button
            :type="quickDateRange === '15' ? 'primary' : 'default'"
            @click="handleQuickDateChange('15')"
          >
            近15天
          </Button>
          <Button
            :type="quickDateRange === '30' ? 'primary' : 'default'"
            @click="handleQuickDateChange('30')"
          >
            近30天
          </Button>
          <Button
            :type="quickDateRange === 'month' ? 'primary' : 'default'"
            @click="handleQuickDateChange('month')"
          >
            本月
          </Button>
        </Space>

        <!-- 自定义日期范围 -->
        <RangePicker
          v-model:value="dateRange"
          format="YYYY-MM-DD"
          @change="handleDateRangeChange"
        />
      </Space>

      <!-- 右侧：操作按钮 -->
      <Space>
        <Button @click="handleDownloadTemplate">
          <template #icon>
            <DownloadOutlined />
          </template>
          下载日销模板
        </Button>
        <Upload
          :before-upload="handleBeforeUpload"
          :show-upload-list="false"
          accept=".xlsx,.xls"
        >
          <Button type="primary">
            <template #icon>
              <UploadOutlined />
            </template>
            上传日销表格
          </Button>
        </Upload>
        <Button danger @click="showClearDataModal">
          <template #icon>
            <DeleteOutlined />
          </template>
          清除数据
        </Button>
      </Space>
    </div>

    <!-- 表格区 -->
    <div style="height: calc(100vh - 180px);">
      <SalesTable
        v-if="dateRange && dateRange.length === 2"
        :key="`table-${dateRange[0].format('YYYYMMDD')}-${dateRange[1].format('YYYYMMDD')}-${statisticsMode}`"
        :date-range="dateRange"
        :search-form="searchForm"
        :statistics-mode="statisticsMode"
      />
    </div>

    <!-- 清除数据弹窗 -->
    <Modal
      v-model:open="clearDataModalVisible"
      title="清除数据"
      @ok="handleClearData"
      @cancel="clearDataModalVisible = false"
    >
      <div class="mb-4">
        <div class="mb-2">请选择要清除的日期范围：</div>
        <RangePicker
          v-model:value="clearDateRange"
          format="YYYY-MM-DD"
          style="width: 100%"
        />
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Button, DatePicker, Input, message, Modal, notification, Select, SelectOption, Space, Upload } from 'ant-design-vue';
import { DeleteOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons-vue';
import { uploadDailySales, clearDailySales } from '#/api/core/sales';
import { downloadDailySalesTemplate, parseDailySalesExcel } from '#/utils/excel';
import dayjs, { Dayjs } from 'dayjs';
import { getManagerList } from '#/api/core/product';
import SalesTable from './components/SalesTable.vue';

const { RangePicker } = DatePicker;

// 统计模式
const statisticsMode = ref<'quantity' | 'orders'>('quantity');

// 搜索表单
const searchForm = reactive({
  keyword: '',
  manager: undefined,
});

// 时间范围
const quickDateRange = ref('7');
const dateRange = ref<[Dayjs, Dayjs]>();

// 管理人列表
const managerList = ref<Array<{ label: string; value: string }>>([]);

// 清除数据相关状态
const clearDataModalVisible = ref(false);
const clearDateRange = ref<[Dayjs, Dayjs]>();

// 显示清除数据弹窗
function showClearDataModal() {
  clearDataModalVisible.value = true;
  clearDateRange.value = undefined;
}

// 加载管理人列表
async function loadManagers() {
  try {
    const data = await getManagerList();
    managerList.value = data.map((item: any) => ({
      label: item.name,
      value: item.name,
    }));
  } catch (error) {
    console.error('加载管理人列表失败:', error);
  }
}

loadManagers();

// 计算日期范围
function calculateDateRange(type: string): [Dayjs, Dayjs] {
  const today = dayjs();
  switch (type) {
    case '7':
      return [today.subtract(6, 'day'), today];
    case '15':
      return [today.subtract(14, 'day'), today];
    case '30':
      return [today.subtract(29, 'day'), today];
    case 'month':
      return [today.startOf('month'), today];
    default:
      return [today.subtract(6, 'day'), today];
  }
}

// 初始化日期范围
dateRange.value = calculateDateRange('7');

// 统计模式切换
function handleStatisticsModeChange(mode: 'quantity' | 'orders') {
  statisticsMode.value = mode;
}

// 快速日期选择变化
function handleQuickDateChange(value: string) {
  quickDateRange.value = value;
  dateRange.value = calculateDateRange(value);
  console.log('切换日期范围:', value, '开始:', dateRange.value[0].format('YYYY-MM-DD'), '结束:', dateRange.value[1].format('YYYY-MM-DD'));
}

// 日期范围变化
function handleDateRangeChange() {
  quickDateRange.value = '';
}

// 搜索（空函数，因为表格会通过 key 变化自动重新加载）
function handleSearch() {
  // 表格会通过 key 变化自动重新加载
}

// 下载日销模板
function handleDownloadTemplate() {
  try {
    downloadDailySalesTemplate();
    message.success('模板下载成功');
  } catch (error) {
    message.error('模板下载失败');
  }
}

// 上传日销表格
async function handleBeforeUpload(file: File) {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                  file.type === 'application/vnd.ms-excel';

  if (!isExcel) {
    message.error('只能上传 Excel 文件！');
    return false;
  }

  const loading = message.loading('正在导入数据...', 0);

  try {
    const salesData = await parseDailySalesExcel(file);

    if (salesData.length === 0) {
      message.warning('Excel 文件中没有数据');
      loading();
      return false;
    }

    await uploadDailySales(salesData);

    loading();
    notification.success({
      message: '导入成功',
      description: `成功导入 ${salesData.length} 条日销数据`,
      duration: 3,
    });

    // 触发表格重新加载（通过改变 dateRange 来触发）
    const currentRange = dateRange.value;
    dateRange.value = undefined as any;
    setTimeout(() => {
      dateRange.value = currentRange;
    }, 10);
  } catch (error: any) {
    loading();
    notification.error({
      message: '导入失败',
      description: error.message || '请检查文件格式是否正确',
      duration: 5,
    });
  }

  return false;
}

// 清除指定日期数据
async function handleClearData() {
  if (!clearDateRange.value || clearDateRange.value.length !== 2) {
    message.warning('请选择要清除的日期范围');
    return;
  }

  try {
    const params = {
      startDate: clearDateRange.value[0].format('YYYY-MM-DD'),
      endDate: clearDateRange.value[1].format('YYYY-MM-DD'),
    };
    await clearDailySales(params);
    message.success('清除成功');
    clearDataModalVisible.value = false;

    // 触发表格重新加载
    const currentRange = dateRange.value;
    dateRange.value = undefined as any;
    setTimeout(() => {
      dateRange.value = currentRange;
    }, 10);
  } catch (error) {
    message.error('清除失败');
  }
}
</script>

<style scoped>
:deep(.vxe-body--row.row--hover),
:deep(.vxe-body--row:hover),
:deep(.vxe-table--body .vxe-body--row:hover) {
  background-color: #f0f7ff !important;
}

:deep(.vxe-table--body .vxe-body--row.row--hover .vxe-body--column) {
  background-color: #f0f7ff !important;
}

:deep(.vxe-table--fixed-left-wrapper) {
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.06);
}
</style>
