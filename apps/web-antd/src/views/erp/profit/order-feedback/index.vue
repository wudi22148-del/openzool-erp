<template>
  <div class="p-4">
    <a-card title="订单异常反馈管理" :bordered="false">
      <template #extra>
        <a-space>
          <a-select
            v-model:value="filterStatus"
            placeholder="状态筛选"
            style="width: 120px"
            @change="loadFeedbackList"
          >
            <a-select-option value="">全部状态</a-select-option>
            <a-select-option value="pending">待处理</a-select-option>
            <a-select-option value="resolved">已处理</a-select-option>
            <a-select-option value="confirmed">已确认</a-select-option>
          </a-select>
          <a-month-picker
            v-model:value="filterMonth"
            placeholder="月份筛选"
            format="YYYY-MM"
            @change="loadFeedbackList"
          />
          <a-button type="primary" @click="loadFeedbackList">
            <template #icon><ReloadOutlined /></template>
            刷新
          </a-button>
        </a-space>
      </template>

      <a-table
        :columns="columns"
        :data-source="feedbackList"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1800 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag v-if="record.status === 'pending'" color="orange">待处理</a-tag>
            <a-tag v-else-if="record.status === 'resolved'" color="blue">已处理</a-tag>
            <a-tag v-else-if="record.status === 'confirmed'" color="green">已确认</a-tag>
          </template>

          <template v-else-if="column.key === 'profit'">
            <span :style="{ color: record.profit >= 0 ? '#52c41a' : '#ff4d4f' }">
              {{ record.profit?.toFixed(2) }}
            </span>
          </template>

          <template v-else-if="column.key === 'profitRate'">
            <span :style="{ color: record.profitRate >= 0 ? '#52c41a' : '#ff4d4f' }">
              {{ record.profitRate?.toFixed(2) }}%
            </span>
          </template>

          <template v-else-if="column.key === 'feedbackAt'">
            {{ formatDateTime(record.feedbackAt) }}
          </template>

          <template v-else-if="column.key === 'resolvedAt'">
            {{ record.resolvedAt ? formatDateTime(record.resolvedAt) : '-' }}
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button
                v-if="canResolve && record.status === 'pending'"
                type="link"
                size="small"
                @click="openResolveModal(record)"
              >
                处理反馈
              </a-button>
              <a-button
                v-if="!canResolve && record.status === 'resolved' && record.feedbackBy === currentUsername"
                type="link"
                size="small"
                @click="confirmFeedback(record)"
              >
                确认无误
              </a-button>
              <a-button type="link" size="small" @click="viewDetail(record)">
                查看详情
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 处理反馈 Modal -->
    <a-modal
      v-model:open="resolveModalVisible"
      title="处理反馈"
      :confirm-loading="resolveLoading"
      @ok="handleResolve"
    >
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="订单号">
          <span>{{ currentRecord?.orderNo }}</span>
        </a-form-item>
        <a-form-item label="反馈内容">
          <a-textarea :value="currentRecord?.feedbackText" :rows="3" disabled />
        </a-form-item>
        <a-form-item label="处理说明">
          <a-textarea
            v-model:value="resolveNote"
            :rows="4"
            placeholder="请输入处理说明，将推送给运营确认"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 详情 Modal -->
    <a-modal
      v-model:open="detailModalVisible"
      title="反馈详情"
      :footer="null"
      width="800px"
    >
      <a-descriptions :column="2" bordered size="small">
        <a-descriptions-item label="月份">{{ currentRecord?.month }}</a-descriptions-item>
        <a-descriptions-item label="平台">{{ currentRecord?.platform }}</a-descriptions-item>
        <a-descriptions-item label="订单号">{{ currentRecord?.orderNo }}</a-descriptions-item>
        <a-descriptions-item label="SKU">{{ currentRecord?.skuId }}</a-descriptions-item>
        <a-descriptions-item label="产品名称" :span="2">
          {{ currentRecord?.productName }}
        </a-descriptions-item>
        <a-descriptions-item label="管理人">{{ currentRecord?.manager || '-' }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag v-if="currentRecord?.status === 'pending'" color="orange">待处理</a-tag>
          <a-tag v-else-if="currentRecord?.status === 'resolved'" color="blue">已处理</a-tag>
          <a-tag v-else-if="currentRecord?.status === 'confirmed'" color="green">已确认</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="销售收入">{{ currentRecord?.salesIncome?.toFixed(2) }}</a-descriptions-item>
        <a-descriptions-item label="运费收入">{{ currentRecord?.freightIncome?.toFixed(2) }}</a-descriptions-item>
        <a-descriptions-item label="销售退款">{{ currentRecord?.salesRefund?.toFixed(2) }}</a-descriptions-item>
        <a-descriptions-item label="运费退款">{{ currentRecord?.freightRefund?.toFixed(2) }}</a-descriptions-item>
        <a-descriptions-item label="产品单价成本">{{ currentRecord?.productCostUnit?.toFixed(2) }}</a-descriptions-item>
        <a-descriptions-item label="产品总成本">{{ currentRecord?.productCostTotal?.toFixed(2) }}</a-descriptions-item>
        <a-descriptions-item label="运费成本">{{ currentRecord?.freightCost?.toFixed(2) }}</a-descriptions-item>
        <a-descriptions-item label="利润">
          <span :style="{ color: currentRecord?.profit >= 0 ? '#52c41a' : '#ff4d4f' }">
            {{ currentRecord?.profit?.toFixed(2) }}
          </span>
        </a-descriptions-item>
        <a-descriptions-item label="利润率">
          <span :style="{ color: currentRecord?.profitRate >= 0 ? '#52c41a' : '#ff4d4f' }">
            {{ currentRecord?.profitRate?.toFixed(2) }}%
          </span>
        </a-descriptions-item>
        <a-descriptions-item label="反馈人">{{ currentRecord?.feedbackBy }}</a-descriptions-item>
        <a-descriptions-item label="反馈时间">
          {{ currentRecord?.feedbackAt ? formatDateTime(currentRecord.feedbackAt) : '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="反馈内容" :span="2">
          {{ currentRecord?.feedbackText }}
        </a-descriptions-item>
        <a-descriptions-item label="处理人">{{ currentRecord?.resolvedBy || '-' }}</a-descriptions-item>
        <a-descriptions-item label="处理时间">
          {{ currentRecord?.resolvedAt ? formatDateTime(currentRecord.resolvedAt) : '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="处理说明" :span="2">
          {{ currentRecord?.resolveNote || '-' }}
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { ReloadOutlined } from '@ant-design/icons-vue';
import dayjs, { type Dayjs } from 'dayjs';
import { useUserStore } from '@vben/stores';
import {
  getOrderFeedbackList,
  resolveOrderFeedback,
  confirmOrderFeedback,
} from '#/api/core/order-profit';

const userStore = useUserStore();
const currentUsername = computed(() => userStore.userInfo?.username || '');
const userRole = computed(() => userStore.userInfo?.role || 'operator');
const canResolve = computed(() => userRole.value === 'admin' || userRole.value === 'supervisor');

const loading = ref(false);
const feedbackList = ref<any[]>([]);
const filterStatus = ref('');
const filterMonth = ref<Dayjs | null>(null);

const resolveModalVisible = ref(false);
const resolveLoading = ref(false);
const resolveNote = ref('');
const currentRecord = ref<any>(null);

const detailModalVisible = ref(false);

const columns = [
  { title: '月份', dataIndex: 'month', key: 'month', width: 100, fixed: 'left' },
  { title: '平台', dataIndex: 'platform', key: 'platform', width: 100 },
  { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 180 },
  { title: 'SKU', dataIndex: 'skuId', key: 'skuId', width: 120 },
  { title: '产品名称', dataIndex: 'productName', key: 'productName', width: 200, ellipsis: true },
  { title: '管理人', dataIndex: 'manager', key: 'manager', width: 100 },
  { title: '利润', dataIndex: 'profit', key: 'profit', width: 100, align: 'right' },
  { title: '利润率', dataIndex: 'profitRate', key: 'profitRate', width: 100, align: 'right' },
  { title: '反馈人', dataIndex: 'feedbackBy', key: 'feedbackBy', width: 100 },
  { title: '反馈时间', dataIndex: 'feedbackAt', key: 'feedbackAt', width: 160 },
  { title: '处理人', dataIndex: 'resolvedBy', key: 'resolvedBy', width: 100 },
  { title: '处理时间', dataIndex: 'resolvedAt', key: 'resolvedAt', width: 160 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100, fixed: 'right' },
  { title: '操作', key: 'action', width: 180, fixed: 'right' },
];

function formatDateTime(dateStr: string) {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss');
}

async function loadFeedbackList() {
  loading.value = true;
  try {
    const params: any = {};
    if (filterStatus.value) params.status = filterStatus.value;
    if (filterMonth.value) params.month = filterMonth.value.format('YYYY-MM');

    const res = await getOrderFeedbackList(params);
    feedbackList.value = Array.isArray(res) ? res : [];
  } catch (error: any) {
    message.error(error.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

function openResolveModal(record: any) {
  currentRecord.value = record;
  resolveNote.value = '';
  resolveModalVisible.value = true;
}

async function handleResolve() {
  if (!currentRecord.value) return;

  resolveLoading.value = true;
  try {
    await resolveOrderFeedback({
      id: currentRecord.value.id,
      resolveNote: resolveNote.value,
    });
    message.success('处理成功，已推送给运营');
    resolveModalVisible.value = false;
    await loadFeedbackList();
  } catch (error: any) {
    message.error(error.message || '处理失败');
  } finally {
    resolveLoading.value = false;
  }
}

async function confirmFeedback(record: any) {
  try {
    await confirmOrderFeedback({ id: record.id });
    message.success('已确认');
    await loadFeedbackList();
  } catch (error: any) {
    message.error(error.message || '确认失败');
  }
}

function viewDetail(record: any) {
  currentRecord.value = record;
  detailModalVisible.value = true;
}

onMounted(() => {
  loadFeedbackList();
});
</script>
