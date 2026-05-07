<template>
  <div class="p-4">
    <!-- 上传操作区 -->
    <Card :bordered="false" class="mb-4">
      <template #title>
        <span class="font-semibold">数据上传</span>
      </template>

      <div class="flex flex-wrap items-end gap-4">
        <!-- 月份 + 平台 -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">月份：</span>
          <DatePicker
            v-model:value="uploadMonth"
            picker="month"
            format="YYYY-MM"
            valueFormat="YYYY-MM"
            placeholder="选择月份"
            style="width: 130px"
            size="small"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">平台：</span>
          <Select v-model:value="uploadPlatform" style="width: 100px" size="small">
            <SelectOption value="TEMU">TEMU</SelectOption>
            <SelectOption value="SHEIN">SHEIN</SelectOption>
          </Select>
        </div>

        <div class="mx-2 h-6 border-l border-gray-200" />

        <!-- 三种文件上传 -->
        <Upload :before-upload="handleFreightCostUpload" :show-upload-list="false" accept=".xlsx,.xls">
          <Button size="small" :loading="freightUploading" type="default">
            <template #icon><UploadOutlined /></template>
            运费成本表
          </Button>
        </Upload>
        <Upload :before-upload="handleSettlementUpload" :show-upload-list="false" accept=".xlsx,.xls">
          <Button size="small" :loading="settlementUploading" type="default">
            <template #icon><UploadOutlined /></template>
            结算表
          </Button>
        </Upload>
        <Upload :before-upload="handleOrderMapUpload" :show-upload-list="false" accept=".xlsx,.xls">
          <Button size="small" :loading="orderMapUploading" type="default">
            <template #icon><UploadOutlined /></template>
            订单编号表
          </Button>
        </Upload>
      </div>

      <!-- 字段说明 -->
      <div class="mt-3 rounded bg-blue-50 px-4 py-2 text-xs text-blue-700">
        <span class="font-medium">运费成本表列名：</span>
        运单号（或：快递单号 / 物流单号）、运费成本（或：运费 / 物流费用）、是否国内发货（是/否）&emsp;
        <span class="font-medium">结算表 / 订单编号表：</span>
        直接上传原始 Excel，系统自动识别列名
      </div>
    </Card>

    <!-- 已上传数据列表 -->
    <Card :bordered="false">
      <template #title>
        <div class="flex items-center justify-between">
          <span class="font-semibold">已上传数据</span>
          <Button size="small" @click="loadUploads" :loading="listLoading">
            <template #icon><ReloadOutlined /></template>
            刷新
          </Button>
        </div>
      </template>

      <Table
        :columns="listColumns"
        :data-source="uploadRecords"
        :loading="listLoading"
        :pagination="false"
        row-key="key"
        size="small"
        :scroll="{ x: 900 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'typeLabel'">
            <Tag :color="getTypeColor(record.type, record.fileType)" style="margin:0">
              {{ getTypeLabel(record.type, record.fileType) }}
            </Tag>
          </template>
          <template v-if="column.key === 'platform'">
            <span v-if="record.platform">{{ record.platform }}</span>
            <span v-else class="text-gray-400">—</span>
          </template>
          <template v-if="column.key === 'rowCount'">
            <span class="font-medium text-blue-600">{{ record.rowCount.toLocaleString() }}</span>
            <span class="ml-1 text-gray-400 text-xs">条</span>
          </template>
          <template v-if="column.key === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>
          <template v-if="column.key === 'actions'">
            <div class="flex gap-2">
              <Upload
                :before-upload="(file: File) => handleReUpload(file, record)"
                :show-upload-list="false"
                accept=".xlsx,.xls"
              >
                <Button size="small" type="link" :loading="reUploadingKey === record.key">
                  重新上传
                </Button>
              </Upload>
              <Popconfirm
                title="确认删除该上传记录？删除后数据将无法恢复。"
                ok-text="删除"
                cancel-text="取消"
                ok-type="danger"
                @confirm="handleDelete(record)"
              >
                <Button size="small" type="link" danger>删除</Button>
              </Popconfirm>
            </div>
          </template>
        </template>
      </Table>

      <div v-if="!uploadRecords.length && !listLoading" class="py-8 text-center text-gray-400">
        暂无上传数据
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  Button, Card, DatePicker, Popconfirm, Select, Table, Tag, Upload, message,
} from 'ant-design-vue';
import { ReloadOutlined, UploadOutlined } from '@ant-design/icons-vue';
import { parseExcel } from '#/utils/excel';
import {
  uploadFreightCost,
  uploadSettlement,
  getUploadList,
  deleteUpload,
} from '#/api/core/order-profit';

const SelectOption = Select.Option;

// ============ 上传状态 ============

const uploadMonth = ref('');
const uploadPlatform = ref<'TEMU' | 'SHEIN'>('TEMU');
const freightUploading = ref(false);
const settlementUploading = ref(false);
const orderMapUploading = ref(false);

function parseFreightCostData(rawData: any[]) {
  const result: Array<{ waybillNumber: string; freightCost: number; isDomestic: boolean }> = [];
  for (const row of rawData) {
    const waybillRaw = String(row['运单号'] || row['快递单号'] || row['物流单号'] || '');
    const costRaw = Number(row['运费成本'] || row['运费'] || row['物流费用'] || 0);
    const isDomesticRaw = String(row['是否国内发货'] || '').trim().toLowerCase();
    const isDomestic = isDomesticRaw === '是' || isDomesticRaw === 'yes' || isDomesticRaw === '1' || isDomesticRaw === 'true';
    if (!waybillRaw || costRaw === 0) continue;
    const waybills = waybillRaw.replace(/\n/g, ' ').replace(/\t/g, ' ')
      .split(/[、,，;；/\s]+/)
      .map((s: string) => s.trim().replace(/\.0+$/, '').replace(/[^0-9]/g, ''))
      .filter((s: string) => s.length > 0);
    if (!waybills.length) continue;
    const costPer = Math.round((costRaw / waybills.length) * 100) / 100;
    for (const wb of waybills) result.push({ waybillNumber: wb, freightCost: costPer, isDomestic });
  }
  return result;
}

async function handleFreightCostUpload(file: File) {
  if (!uploadMonth.value) { message.warning('请先选择月份'); return false; }
  try {
    freightUploading.value = true;
    const rawData = await parseExcel(file);
    const items = parseFreightCostData(rawData);
    if (!items.length) { message.error('未解析到有效运费数据，请检查列名'); return false; }
    await uploadFreightCost({ month: uploadMonth.value, items });
    message.success(`运费成本上传成功：${items.length} 条，已覆盖旧数据`);
    await loadUploads();
  } catch (e: any) { message.error(`上传失败: ${e.message}`); }
  finally { freightUploading.value = false; }
  return false;
}

async function handleSettlementUpload(file: File) {
  if (!uploadMonth.value) { message.warning('请先选择月份'); return false; }
  try {
    settlementUploading.value = true;
    const rawData = await parseExcel(file);
    if (!rawData.length) { message.error('未解析到有效数据'); return false; }
    await uploadSettlement({ month: uploadMonth.value, platform: uploadPlatform.value, fileType: 'settlement', data: rawData });
    message.success(`结算表上传成功：${rawData.length} 条，已覆盖旧数据`);
    await loadUploads();
  } catch (e: any) { message.error(`上传失败: ${e.message}`); }
  finally { settlementUploading.value = false; }
  return false;
}

async function handleOrderMapUpload(file: File) {
  if (!uploadMonth.value) { message.warning('请先选择月份'); return false; }
  try {
    orderMapUploading.value = true;
    const rawData = await parseExcel(file);
    if (!rawData.length) { message.error('未解析到有效数据'); return false; }
    await uploadSettlement({ month: uploadMonth.value, platform: uploadPlatform.value, fileType: 'order_map', data: rawData });
    message.success(`订单编号表上传成功：${rawData.length} 条，已覆盖旧数据`);
    await loadUploads();
  } catch (e: any) { message.error(`上传失败: ${e.message}`); }
  finally { orderMapUploading.value = false; }
  return false;
}

// ============ 列表 ============

interface UploadRecord {
  key: string;
  type: 'freight' | 'settlement';
  month: string;
  platform: string | null;
  fileType: string | null;
  rowCount: number;
  createdAt: string;
}

const uploadRecords = ref<UploadRecord[]>([]);
const listLoading = ref(false);
const reUploadingKey = ref<string | null>(null);

const listColumns = [
  { title: '月份', dataIndex: 'month', key: 'month', width: 100 },
  { title: '数据类型', key: 'typeLabel', width: 130 },
  { title: '平台', key: 'platform', width: 90 },
  { title: '数据量', key: 'rowCount', width: 120, align: 'right' as const },
  { title: '上传时间', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', width: 160 },
];

function getTypeLabel(type: string, fileType: string | null): string {
  if (type === 'freight') return '运费成本表';
  if (fileType === 'settlement') return '结算表';
  if (fileType === 'order_map') return '订单编号表';
  return type;
}

function getTypeColor(type: string, fileType: string | null): string {
  if (type === 'freight') return 'orange';
  if (fileType === 'settlement') return 'blue';
  if (fileType === 'order_map') return 'green';
  return 'default';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}

function buildKey(r: any): string {
  return `${r.type}_${r.month}_${r.platform || ''}_${r.fileType || ''}`;
}

async function loadUploads() {
  try {
    listLoading.value = true;
    const res = await getUploadList();
    if (Array.isArray(res)) {
      uploadRecords.value = (res as any[]).map((r: any) => ({
        key: buildKey(r),
        type: r.type,
        month: r.month,
        platform: r.platform,
        fileType: r.fileType,
        rowCount: r.rowCount,
        createdAt: r.createdAt,
      }));
    }
  } catch (e: any) { message.error(`加载失败: ${e.message}`); }
  finally { listLoading.value = false; }
}

// ============ 删除 ============

async function handleDelete(record: UploadRecord) {
  try {
    await deleteUpload({
      type: record.type,
      month: record.month,
      platform: record.platform ?? undefined,
      fileType: record.fileType ?? undefined,
    });
    message.success('删除成功');
    await loadUploads();
  } catch (e: any) { message.error(`删除失败: ${e.message}`); }
}

// ============ 重新上传（行内） ============

async function handleReUpload(file: File, record: UploadRecord) {
  try {
    reUploadingKey.value = record.key;
    const rawData = await parseExcel(file);

    if (record.type === 'freight') {
      const items = parseFreightCostData(rawData);
      if (!items.length) { message.error('未解析到有效运费数据'); return false; }
      await uploadFreightCost({ month: record.month, items });
      message.success(`运费成本重新上传成功：${items.length} 条`);
    } else {
      if (!rawData.length) { message.error('未解析到有效数据'); return false; }
      await uploadSettlement({
        month: record.month,
        platform: record.platform!,
        fileType: record.fileType!,
        data: rawData,
      });
      message.success(`${getTypeLabel(record.type, record.fileType)} 重新上传成功：${rawData.length} 条`);
    }
    await loadUploads();
  } catch (e: any) { message.error(`上传失败: ${e.message}`); }
  finally { reUploadingKey.value = null; }
  return false;
}

// ============ 初始化 ============

onMounted(() => {
  loadUploads();
});
</script>
