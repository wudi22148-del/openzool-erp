<template>
  <div class="p-4">
    <!-- 搜索和操作区 -->
    <div class="mb-4 flex items-center justify-between">
      <!-- 左侧：搜索表单 -->
      <Space size="middle">
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

        <!-- 批量删除按钮 -->
        <Button
          v-show="selectedRows.length > 0"
          danger
          @click="handleBatchDelete"
        >
          <template #icon>
            <DeleteOutlined />
          </template>
          批量删除 ({{ selectedRows.length }})
        </Button>

        <!-- 调试信息 -->
        <span v-if="selectedRows.length > 0" class="ml-2 text-xs text-gray-500">
          已选中: {{ selectedRows.length }} 项
        </span>
      </Space>

      <!-- 右侧：操作按钮 -->
      <Space>
        <Button type="primary" @click="handleAdd">
          <template #icon>
            <PlusOutlined />
          </template>
          新增产品
        </Button>
        <Button @click="handleDownloadTemplate">
          <template #icon>
            <DownloadOutlined />
          </template>
          下载模板
        </Button>
        <Upload
          :before-upload="handleBeforeUpload"
          :show-upload-list="false"
          accept=".xlsx,.xls"
        >
          <Button>
            <template #icon>
              <UploadOutlined />
            </template>
            批量导入
          </Button>
        </Upload>
      </Space>
    </div>

    <!-- 表格区 -->
    <div style="height: calc(100vh - 180px); overflow: hidden;">
      <Grid>

        <!-- 产品图片列 -->
        <template #image="{ row }">
          <div class="flex items-center justify-center">
            <Image
              v-if="row.imageUrl"
              :src="row.imageUrl"
              :preview="{ mask: '预览' }"
              class="rounded-lg shadow-sm object-cover cursor-pointer"
              style="width: 70px; height: 70px; border: 1px solid #f0f0f0"
            />
            <div v-else class="flex h-[70px] w-[70px] items-center justify-center rounded-lg bg-gray-50 text-gray-300 border border-gray-200">
              <PictureOutlined :style="{ fontSize: '24px' }" />
            </div>
          </div>
        </template>

        <!-- 产品信息列 -->
        <template #product-info="{ row }">
          <div class="py-1">
            <div class="font-medium text-gray-900 text-[14px] leading-tight">{{ row.productName }}</div>
            <div class="text-[11px] text-gray-500 mt-1.5">{{ row.skuName }}</div>
          </div>
        </template>

        <!-- 产品规格列 -->
        <template #specs="{ row }">
          <div v-if="row.specs && typeof row.specs === 'object'" class="text-[12px] text-gray-700">
            <div v-if="row.specs.length || row.specs.width || row.specs.height">
              {{ row.specs.length || '-' }}×{{ row.specs.width || '-' }}×{{ row.specs.height || '-' }}cm
            </div>
            <div v-if="row.specs.weight" class="text-[11px] text-gray-500 mt-0.5">
              {{ row.specs.weight }}kg
            </div>
          </div>
          <span v-else class="text-gray-400 text-[12px]">-</span>
        </template>

        <!-- 平台 SKU 列 -->
        <template #platform-sku="{ row }">
          <div class="space-y-1.5 py-1">
            <div v-if="row.temuSku" class="flex items-center text-[12px]">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-orange-100 text-orange-700 mr-2">
                TEMU
              </span>
              <span class="text-gray-700">{{ row.temuSku }}</span>
            </div>
            <div v-if="row.sheinSku" class="flex items-center text-[12px]">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-sky-100 text-sky-700 mr-2">
                SHEIN
              </span>
              <span class="text-gray-700">{{ row.sheinSku }}</span>
            </div>
            <div v-if="!row.temuSku && !row.sheinSku" class="text-gray-400 text-[12px]">-</div>
          </div>
        </template>

        <!-- 管理人列 -->
        <template #manager="{ row }">
          <span v-if="row.manager" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[13px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            {{ row.manager }}
          </span>
          <span v-else class="text-gray-400 text-[13px]">-</span>
        </template>

        <!-- 操作列 -->
        <template #action="{ row }">
          <Space>
            <Button type="link" size="small" @click="handleEdit(row)">
              <template #icon>
                <EditOutlined />
              </template>
            </Button>
            <Popconfirm
              title="确定要删除这个产品吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleDelete(row)"
            >
              <Button type="link" danger size="small">
                <template #icon>
                  <DeleteOutlined />
                </template>
              </Button>
            </Popconfirm>
          </Space>
        </template>
      </Grid>
    </div>

    <!-- 新增/编辑产品弹窗 -->
    <Modal
      v-model:open="productModalVisible"
      :title="isEdit ? '编辑产品' : '新增产品'"
      width="800px"
      @ok="handleProductSubmit"
      @cancel="handleProductCancel"
    >
      <Form :model="productForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <Form.Item label="产品名" required>
          <Input v-model:value="productForm.productName" placeholder="请输入产品名" />
        </Form.Item>
        <Form.Item label="SKU名" required>
          <Input v-model:value="productForm.skuName" placeholder="请输入SKU名" />
        </Form.Item>
        <Form.Item label="仓库SKU" required>
          <Input v-model:value="productForm.warehouseSku" placeholder="请输入仓库SKU" />
        </Form.Item>
        <Form.Item label="TEMU SKU">
          <Input v-model:value="productForm.temuSku" placeholder="请输入TEMU SKU（可选）" />
        </Form.Item>
        <Form.Item label="SHEIN SKU">
          <Input v-model:value="productForm.sheinSku" placeholder="请输入SHEIN SKU（可选）" />
        </Form.Item>
        <Form.Item label="产品规格">
          <Space direction="vertical" style="width: 100%">
            <Input.Group compact>
              <Input v-model:value="productForm.specs.length" placeholder="长(cm)" style="width: 25%" />
              <Input v-model:value="productForm.specs.width" placeholder="宽(cm)" style="width: 25%" />
              <Input v-model:value="productForm.specs.height" placeholder="高(cm)" style="width: 25%" />
              <Input v-model:value="productForm.specs.weight" placeholder="重量(kg)" style="width: 25%" />
            </Input.Group>
          </Space>
        </Form.Item>
        <Form.Item label="产品成本" required>
          <Input v-model:value="productForm.productCost" type="number" placeholder="请输入产品成本" />
        </Form.Item>
        <Form.Item label="税金" required>
          <Input v-model:value="productForm.tax" type="number" placeholder="请输入税金" />
        </Form.Item>
        <Form.Item label="国内运费" required>
          <Input v-model:value="productForm.domesticShipping" type="number" placeholder="请输入国内运费" />
        </Form.Item>
        <Form.Item label="海外运费" required>
          <Input v-model:value="productForm.overseasShipping" type="number" placeholder="请输入海外运费" />
        </Form.Item>
        <Form.Item label="管理人" required>
          <Select v-model:value="productForm.manager" placeholder="请选择管理人">
            <SelectOption v-for="item in managerList" :key="item.value" :value="item.value">
              {{ item.label }}
            </SelectOption>
          </Select>
        </Form.Item>
        <Form.Item label="库存量">
          <Input v-model:value="productForm.stock" type="number" placeholder="请输入库存量（可选）" />
        </Form.Item>
        <Form.Item label="产品图片">
          <Upload
            :before-upload="handleImageUpload"
            :show-upload-list="false"
            accept="image/*"
          >
            <Button>
              <template #icon>
                <UploadOutlined />
              </template>
              浏览上传
            </Button>
          </Upload>
          <div v-if="productForm.imageUrl" class="mt-2">
            <Image :src="productForm.imageUrl" :width="100" :height="100" />
          </div>
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Button, Form, Image, Input, message, Modal, notification, Popconfirm, Select, SelectOption, Space, Upload } from 'ant-design-vue';
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PictureOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { batchImportProducts, deleteProduct, getManagerList, getProductList, updateProduct } from '#/api/core/product';
import { downloadProductTemplate, mapExcelToProduct, parseExcel } from '#/utils/excel';

// 搜索表单
const searchForm = reactive({
  keyword: '',
  manager: undefined,
});

// 选中的行
const selectedRows = ref<any[]>([]);

// 产品弹窗
const productModalVisible = ref(false);
const isEdit = ref(false);
const productForm = reactive({
  id: '',
  productName: '',
  skuName: '',
  warehouseSku: '',
  temuSku: '',
  sheinSku: '',
  specs: {
    length: '',
    width: '',
    height: '',
    weight: '',
  },
  productCost: '',
  tax: '',
  domesticShipping: '',
  overseasShipping: '',
  manager: '',
  stock: '',
  imageUrl: '',
});

// 管理人列表
const managerList = ref<Array<{ label: string; value: string }>>([]);

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

// 表格配置
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    height: '100%',
    rowConfig: {
      keyField: 'id',
      height: 75,
      isHover: true,
    },
    checkboxConfig: {
      highlight: true,
      reserve: true,
      trigger: 'default',
    },
    columnConfig: {
      resizable: true,
    },
    checkboxEvents: {
      change: () => {
        updateSelectedRows();
      },
    },
    columns: [
      {
        type: 'checkbox',
        width: 50,
        fixed: 'left',
      },
      {
        title: '产品图片',
        field: 'imageUrl',
        width: 110,
        align: 'center',
        slots: { default: 'image' },
      },
      {
        title: '产品信息',
        field: 'productName',
        minWidth: 220,
        slots: { default: 'product-info' },
      },
      {
        title: '仓库SKU',
        field: 'warehouseSku',
        width: 160,
      },
      {
        title: '产品规格',
        field: 'specs',
        width: 140,
        slots: { default: 'specs' },
      },
      {
        title: '平台 SKU',
        field: 'platformSku',
        minWidth: 220,
        slots: { default: 'platform-sku' },
      },
      {
        title: '产品成本',
        field: 'productCost',
        width: 120,
        align: 'right',
        formatter: ({ cellValue }) => (cellValue ? `¥${cellValue.toFixed(2)}` : '-'),
      },
      {
        title: '税金',
        field: 'tax',
        width: 100,
        align: 'right',
        formatter: ({ cellValue }) => (cellValue ? `¥${cellValue.toFixed(2)}` : '-'),
      },
      {
        title: '国内运费',
        field: 'domesticShipping',
        width: 120,
        align: 'right',
        formatter: ({ cellValue }) => (cellValue ? `¥${cellValue.toFixed(2)}` : '-'),
      },
      {
        title: '海外运费',
        field: 'overseasShipping',
        width: 120,
        align: 'right',
        formatter: ({ cellValue }) => (cellValue ? `¥${cellValue.toFixed(2)}` : '-'),
      },
      {
        title: '管理人',
        field: 'manager',
        width: 120,
        align: 'center',
        slots: { default: 'manager' },
      },
      {
        title: '库存量',
        field: 'stock',
        width: 100,
        align: 'center',
      },
      {
        title: '操作',
        field: 'action',
        width: 120,
        align: 'center',
        fixed: 'right',
        slots: { default: 'action' },
      },
    ],
    pagerConfig: {
      enabled: true,
      pageSize: 30,
      pageSizes: [30, 50, 200, 500],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          const params = {
            page: page.currentPage,
            pageSize: page.pageSize,
            keyword: searchForm.keyword || '',
            manager: searchForm.manager || '',
          };

          const result = await getProductList(params);

          // 直接返回 API 结果，让默认的 response 配置处理
          return result;
        },
      },
    },
    toolbarConfig: {
      enabled: false,
    },
  },
});

// 搜索
function handleSearch() {
  gridApi.reload();
}

// 更新选中的行
function updateSelectedRows() {
  try {
    const records = gridApi.getCheckboxRecords();
    selectedRows.value = records;
    console.log('选中的行数:', records.length, records);
  } catch (error) {
    console.error('获取选中行失败:', error);
  }
}

// 批量删除
async function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    message.warning('请先选择要删除的产品');
    return;
  }

  Modal.confirm({
    title: '确认批量删除',
    content: `确定要删除选中的 ${selectedRows.value.length} 个产品吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        // 批量删除
        await Promise.all(selectedRows.value.map(row => deleteProduct(row.id)));
        message.success(`成功删除 ${selectedRows.value.length} 个产品`);
        selectedRows.value = [];
        gridApi.reload();
      } catch (error) {
        message.error('批量删除失败');
      }
    },
  });
}

// 重置产品表单
function resetProductForm() {
  productForm.id = '';
  productForm.productName = '';
  productForm.skuName = '';
  productForm.warehouseSku = '';
  productForm.temuSku = '';
  productForm.sheinSku = '';
  productForm.specs = {
    length: '',
    width: '',
    height: '',
    weight: '',
  };
  productForm.productCost = '';
  productForm.tax = '';
  productForm.domesticShipping = '';
  productForm.overseasShipping = '';
  productForm.manager = '';
  productForm.stock = '';
  productForm.imageUrl = '';
}

// 新增产品
function handleAdd() {
  isEdit.value = false;
  resetProductForm();
  productModalVisible.value = true;
}

// 编辑产品
function handleEdit(row: any) {
  isEdit.value = true;
  productForm.id = row.id;
  productForm.productName = row.productName;
  productForm.skuName = row.skuName;
  productForm.warehouseSku = row.warehouseSku;
  productForm.temuSku = row.temuSku || '';
  productForm.sheinSku = row.sheinSku || '';

  // 确保 specs 对象正确赋值
  if (row.specs && typeof row.specs === 'object') {
    productForm.specs = {
      length: row.specs.length || '',
      width: row.specs.width || '',
      height: row.specs.height || '',
      weight: row.specs.weight || '',
    };
  } else {
    productForm.specs = {
      length: '',
      width: '',
      height: '',
      weight: '',
    };
  }

  productForm.productCost = String(row.productCost || '');
  productForm.tax = String(row.tax || '');
  productForm.domesticShipping = String(row.domesticShipping || '');
  productForm.overseasShipping = String(row.overseasShipping || '');
  productForm.manager = row.manager;
  productForm.stock = row.stock ? String(row.stock) : '';
  productForm.imageUrl = row.imageUrl || '';
  productModalVisible.value = true;
}

// 提交产品表单
async function handleProductSubmit() {
  // 验证必填字段
  if (!productForm.productName || !productForm.skuName || !productForm.warehouseSku ||
      !productForm.productCost || !productForm.tax || !productForm.domesticShipping ||
      !productForm.overseasShipping || !productForm.manager) {
    message.error('请填写所有必填字段');
    return;
  }

  try {
    const productData = {
      ...productForm,
      productCost: Number(productForm.productCost),
      tax: Number(productForm.tax),
      domesticShipping: Number(productForm.domesticShipping),
      overseasShipping: Number(productForm.overseasShipping),
      stock: productForm.stock ? Number(productForm.stock) : 0,
    };

    console.log('提交的产品数据:', productData);
    console.log('产品规格:', productData.specs);

    if (isEdit.value) {
      // 编辑产品
      const result = await updateProduct(productForm.id, productData);
      console.log('更新产品返回:', result);
      message.success('产品更新成功');
    } else {
      // 新增产品
      const result = await batchImportProducts([productData]);
      console.log('新增产品返回:', result);
      message.success('产品添加成功');
    }

    productModalVisible.value = false;
    gridApi.reload();
  } catch (error) {
    console.error('产品提交失败:', error);
    message.error(isEdit.value ? '产品更新失败' : '产品添加失败');
  }
}

// 取消产品表单
function handleProductCancel() {
  productModalVisible.value = false;
  resetProductForm();
}

// 图片上传
function handleImageUpload(file: File) {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件！');
    return false;
  }

  // 转换为 base64
  const reader = new FileReader();
  reader.onload = (e) => {
    productForm.imageUrl = e.target?.result as string;
  };
  reader.readAsDataURL(file);

  return false;
}

// 删除产品
async function handleDelete(row: any) {
  try {
    await deleteProduct(row.id);
    message.success('删除成功');
    gridApi.reload();
  } catch (error) {
    message.error('删除失败');
  }
}

// 下载模板
function handleDownloadTemplate() {
  try {
    // 创建模板数据
    const templateData = [
      {
        '产品名': '示例产品',
        'SKU名': 'XL红色',
        '仓库SKU': 'WH-001',
        'TEMU SKU': 'TEMU-001（可选）',
        'SHEIN SKU': 'SHEIN-001（可选）',
        '长(cm)': '10',
        '宽(cm)': '20',
        '高(cm)': '30',
        '重量(kg)': '0.5',
        '国内成本': '50.00',
        '海外成本': '80.00',
        '管理人': '张三',
        '库存量': '100（可选）',
        '图片URL': 'https://example.com/image.jpg（可选）',
      },
    ];

    // 使用现有的下载模板函数
    downloadProductTemplate();
    message.success('模板下载成功');
  } catch (error) {
    message.error('模板下载失败');
  }
}

// 批量导入
async function handleBeforeUpload(file: File) {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                  file.type === 'application/vnd.ms-excel';

  if (!isExcel) {
    message.error('只能上传 Excel 文件！');
    return false;
  }

  const loading = message.loading('正在导入数据...', 0);

  try {
    // 解析 Excel
    const excelData = await parseExcel(file);

    if (excelData.length === 0) {
      message.warning('Excel 文件中没有数据');
      loading();
      return false;
    }

    // 映射数据
    const products = mapExcelToProduct(excelData);

    if (products.length === 0) {
      message.warning('没有有效的产品数据');
      loading();
      return false;
    }

    // 调用 API 导入
    await batchImportProducts(products);

    loading();
    notification.success({
      message: '导入成功',
      description: `成功导入 ${products.length} 条产品数据`,
      duration: 3,
    });

    // 刷新表格
    gridApi.reload();
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
</script>

<style scoped>
/* 隐藏列宽调整时的提示和蓝线 */
:deep(.vxe-resizable.is--line:before) {
  display: none !important;
}

:deep(.vxe-table--resizable-bar) {
  display: none !important;
}

/* 鼠标悬停行颜色调整为更浅的蓝色 */
:deep(.vxe-body--row.row--hover),
:deep(.vxe-body--row:hover),
:deep(.vxe-table--body .vxe-body--row:hover) {
  background-color: #f0f7ff !important;
}

:deep(.vxe-table--body .vxe-body--row.row--hover .vxe-body--column) {
  background-color: #f0f7ff !important;
}
</style>
