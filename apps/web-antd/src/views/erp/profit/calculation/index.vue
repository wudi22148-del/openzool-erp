<template>
  <div class="p-4">
    <!-- 操作区 -->
    <div class="mb-4 flex items-center justify-between">
      <Space>
        <Button type="primary" @click="handleAddProduct">
          <template #icon>
            <PlusOutlined />
          </template>
          添加产品
        </Button>
        <Select
          v-model:value="selectedManager"
          placeholder="按管理人筛选"
          style="width: 150px"
          allowClear
          @change="handleManagerFilter"
        >
          <SelectOption v-for="manager in managerList" :key="manager" :value="manager">
            {{ manager }}
          </SelectOption>
        </Select>
      </Space>
      <div class="text-sm text-gray-600">
        当前日元汇率: 1 JPY = {{ jpyExchangeRate.toFixed(4) }} RMB
      </div>
    </div>

    <!-- 表格区 -->
    <Table
      :columns="columns"
      :data-source="filteredCalculations"
      :pagination="false"
      :scroll="{ y: 'calc(100vh - 250px)' }"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <!-- 产品信息 -->
        <template v-if="column.key === 'productInfo'">
          <div>
            <div class="font-medium">{{ record.productName }}</div>
            <div class="text-xs text-gray-500">{{ record.warehouseSku }}</div>
          </div>
        </template>

        <!-- 可编辑的报价/RMB -->
        <template v-if="column.key === 'priceRmb'">
          <InputNumber
            v-model:value="record.priceRmb"
            :min="0"
            :precision="2"
            style="width: 100%"
            @change="() => calculateProfit(record)"
          />
        </template>

        <!-- 自动计算的报价/JPY -->
        <template v-if="column.key === 'priceJpy'">
          {{ record.priceJpy ? record.priceJpy.toFixed(2) : '0.00' }}
        </template>

        <!-- 可编辑的运费补贴 -->
        <template v-if="column.key === 'shippingSubsidy'">
          <InputNumber
            v-model:value="record.shippingSubsidy"
            :min="0"
            :precision="2"
            style="width: 100%"
            @change="() => calculateProfit(record)"
          />
        </template>

        <!-- 利润/RMB -->
        <template v-if="column.key === 'profitRmb'">
          <span :class="record.profitRmb >= 0 ? 'text-green-600' : 'text-red-600'">
            ¥{{ record.profitRmb ? record.profitRmb.toFixed(2) : '0.00' }}
          </span>
        </template>

        <!-- 利润率 -->
        <template v-if="column.key === 'profitRate'">
          {{ record.profitRate ? record.profitRate.toFixed(2) : '0.00' }}%
        </template>

        <!-- 无补贴利润率 -->
        <template v-if="column.key === 'profitRateNoSubsidy'">
          {{ record.profitRateNoSubsidy ? record.profitRateNoSubsidy.toFixed(2) : '0.00' }}%
        </template>

        <!-- 管理人 -->
        <template v-if="column.key === 'manager'">
          <span class="inline-block rounded bg-blue-50 px-2 py-1 text-xs text-blue-600">
            {{ record.manager || '-' }}
          </span>
        </template>

        <!-- 操作 -->
        <template v-if="column.key === 'action'">
          <div class="flex items-center justify-center gap-2">
            <Button type="primary" size="small" @click="handleSaveProfit(record)" class="h-7 w-7 p-0">
              <CheckOutlined class="text-sm" />
            </Button>
            <Button danger size="small" @click="handleDelete(record)" class="h-7 w-7 p-0">
              <CloseOutlined class="text-sm" />
            </Button>
          </div>
        </template>
      </template>
    </Table>

    <!-- 添加产品弹窗 -->
    <Modal
      v-model:open="productModalVisible"
      title="选择产品"
      width="800px"
      @ok="handleProductSelect"
    >
      <Select
        v-model:value="selectedProductId"
        show-search
        placeholder="输入产品名或仓库SKU搜索"
        style="width: 100%"
        :filter-option="false"
        :loading="productSearchLoading"
        :options="productOptions"
        @search="handleProductSearch"
      />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Button, InputNumber, message, Modal, Select, Space, Table } from 'ant-design-vue';
import { CheckOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { getProductList } from '#/api/core/product';
import { requestClient } from '#/api/request';

// 数据
const calculations = ref<any[]>([]);
const allProducts = ref<any[]>([]);
const productModalVisible = ref(false);
const selectedProductId = ref<string>('');
const selectedManager = ref<string | undefined>(undefined);
const jpyExchangeRate = ref(0.045); // 日元汇率
const productSearchLoading = ref(false);
const productSearchKeyword = ref<string>('');

// 管理人列表
const managerList = computed(() => {
  const managers = new Set<string>();
  calculations.value.forEach(calc => {
    if (calc.manager) {
      managers.add(calc.manager);
    }
  });
  return Array.from(managers).sort();
});

// 过滤后的计算列表
const filteredCalculations = computed(() => {
  if (!selectedManager.value) {
    return calculations.value;
  }
  return calculations.value.filter(calc => calc.manager === selectedManager.value);
});

// 产品选项（用于搜索下拉）
const productOptions = computed(() => {
  const addedIds = calculations.value.map(c => c.productId);
  const keyword = productSearchKeyword.value.toLowerCase();

  return allProducts.value
    .filter(p => !addedIds.includes(Number(p.id)))
    .filter(p => {
      if (!keyword) return true;
      return p.productName.toLowerCase().includes(keyword) ||
             p.warehouseSku.toLowerCase().includes(keyword);
    })
    .slice(0, 50) // 只显示前50个结果
    .map(p => ({
      label: `${p.productName} - ${p.warehouseSku}`,
      value: p.id,
    }));
});

// 表格列配置
const columns = [
  {
    title: '产品信息',
    key: 'productInfo',
    width: 150,
    fixed: 'left' as const,
  },
  {
    title: '产品成本',
    dataIndex: 'productCost',
    key: 'productCost',
    width: 90,
    customRender: ({ text }: any) => `¥${text ? text.toFixed(2) : '0.00'}`,
  },
  {
    title: '税金',
    dataIndex: 'tax',
    key: 'tax',
    width: 70,
    customRender: ({ text }: any) => `¥${text ? text.toFixed(2) : '0.00'}`,
  },
  {
    title: '国内运费',
    dataIndex: 'domesticShipping',
    key: 'domesticShipping',
    width: 90,
    customRender: ({ text }: any) => `¥${text ? text.toFixed(2) : '0.00'}`,
  },
  {
    title: '头程运费',
    dataIndex: 'firstLegShipping',
    key: 'firstLegShipping',
    width: 90,
    customRender: ({ text }: any) => `¥${text ? text.toFixed(2) : '0.00'}`,
  },
  {
    title: '总成本',
    dataIndex: 'totalCost',
    key: 'totalCost',
    width: 90,
    customRender: ({ text }: any) => `¥${text ? text.toFixed(2) : '0.00'}`,
  },
  {
    title: '报价/RMB',
    key: 'priceRmb',
    width: 110,
  },
  {
    title: '报价/JPY',
    key: 'priceJpy',
    width: 110,
  },
  {
    title: '运费补贴',
    key: 'shippingSubsidy',
    width: 100,
  },
  {
    title: '利润/RMB',
    key: 'profitRmb',
    width: 110,
  },
  {
    title: '利润率',
    key: 'profitRate',
    width: 80,
  },
  {
    title: '无补贴利润率',
    key: 'profitRateNoSubsidy',
    width: 110,
  },
  {
    title: '管理人',
    key: 'manager',
    width: 90,
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    fixed: 'right' as const,
  },
];

// 加载产品列表（按需加载）
async function loadProducts() {
  if (allProducts.value.length > 0) return; // 已加载则跳过

  try {
    productSearchLoading.value = true;
    const res = await getProductList({ page: 1, pageSize: 1000 });
    allProducts.value = res?.items || [];
    console.log('加载的产品数量:', allProducts.value.length);
  } catch (error) {
    console.error('加载产品列表异常:', error);
    message.error('加载产品列表失败');
  } finally {
    productSearchLoading.value = false;
  }
}

// 产品搜索处理
function handleProductSearch(value: string) {
  productSearchKeyword.value = value;
}

// 加载已保存的利润计算
async function loadSavedCalculations() {
  try {
    const res = await requestClient.get('/profit');
    if (res && Array.isArray(res)) {
      calculations.value = res.map(item => ({
        ...item,
        id: item.id || Date.now(),
      }));
      console.log('加载的利润计算数量:', calculations.value.length);
    }
  } catch (error) {
    console.error('加载利润计算异常:', error);
    message.error('加载利润计算失败');
  }
}

// 计算利润
function calculateProfit(record: any) {
  // 总成本 = 产品成本 + 税金 + 国内运费 + 头程运费
  record.totalCost = (record.productCost || 0) + (record.tax || 0) +
                     (record.domesticShipping || 0) + (record.firstLegShipping || 0);

  // 报价/JPY = 报价/RMB / 汇率
  record.priceJpy = (record.priceRmb || 0) / jpyExchangeRate.value;

  // 利润/RMB = 报价/RMB - 总成本 + 运费补贴
  record.profitRmb = (record.priceRmb || 0) - record.totalCost + (record.shippingSubsidy || 0);

  // 利润率 = (利润/RMB / 报价/RMB) * 100
  record.profitRate = record.priceRmb > 0 ? (record.profitRmb / record.priceRmb) * 100 : 0;

  // 无补贴利润率 = ((报价/RMB - 总成本) / 报价/RMB) * 100
  const profitNoSubsidy = (record.priceRmb || 0) - record.totalCost;
  record.profitRateNoSubsidy = record.priceRmb > 0 ? (profitNoSubsidy / record.priceRmb) * 100 : 0;
}

// 添加产品
async function handleAddProduct() {
  productModalVisible.value = true;
  selectedProductId.value = '';
  productSearchKeyword.value = '';

  // 打开弹窗时才加载产品列表
  await loadProducts();
}

// 选择产品
function handleProductSelect() {
  if (!selectedProductId.value) {
    message.warning('请选择产品');
    return;
  }

  const product = allProducts.value.find(p => p.id === selectedProductId.value);
  if (!product) return;

  const newRecord = {
    id: Date.now(),
    productId: Number(product.id),
    productName: product.productName,
    warehouseSku: product.warehouseSku,
    productCost: product.productCost || 0,
    tax: product.tax || 0,
    domesticShipping: product.domesticShipping || 0,
    firstLegShipping: product.firstLegShipping || 0,
    totalCost: 0,
    priceRmb: 0,
    priceJpy: 0,
    shippingSubsidy: 0,
    profitRmb: 0,
    profitRate: 0,
    profitRateNoSubsidy: 0,
    manager: product.manager,
  };

  calculateProfit(newRecord);
  calculations.value.push(newRecord);
  productModalVisible.value = false;
  message.success('添加成功');
}

// 保存利润
async function handleSaveProfit(record: any) {
  try {
    const res = await requestClient.post('/profit', {
      productId: record.productId,
      productName: record.productName,
      warehouseSku: record.warehouseSku,
      productCost: record.productCost,
      tax: record.tax,
      domesticShipping: record.domesticShipping,
      firstLegShipping: record.firstLegShipping,
      totalCost: record.totalCost,
      priceRmb: record.priceRmb,
      priceJpy: record.priceJpy,
      shippingSubsidy: record.shippingSubsidy,
      profitRmb: record.profitRmb,
      profitRate: record.profitRate,
      profitRateNoSubsidy: record.profitRateNoSubsidy,
      jpyExchangeRate: jpyExchangeRate.value,
      manager: record.manager,
    });

    if (res) {
      message.success('保存成功，利润已更新到产品管理');
      // 重新加载数据
      await loadSavedCalculations();
    }
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败');
  }
}

// 删除
async function handleDelete(record: any) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除产品"${record.productName}"的利润计算吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        // 如果有数据库ID，则从数据库删除
        if (record.id && typeof record.id === 'number' && record.id < Date.now() - 1000000) {
          await requestClient.delete(`/profit?id=${record.id}`);
        }

        // 从列表中移除
        const index = calculations.value.findIndex(c => c.id === record.id);
        if (index > -1) {
          calculations.value.splice(index, 1);
        }

        message.success('删除成功');
      } catch (error) {
        console.error('删除失败:', error);
        message.error('删除失败');
      }
    },
  });
}

// 管理人筛选
function handleManagerFilter() {
  // 筛选逻辑由 computed 自动处理
}

onMounted(async () => {
  // 只加载已保存的利润计算，不加载产品列表
  await loadSavedCalculations();
});
</script>
