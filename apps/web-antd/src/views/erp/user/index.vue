<template>
  <div class="p-4">
    <Card title="用户管理">
      <!-- 筛选区 -->
      <div class="mb-4">
        <Form layout="inline">
          <FormItem label="关键词">
            <Input v-model:value="searchForm.keyword" placeholder="用户名/姓名/邮箱" style="width: 200px" />
          </FormItem>
          <FormItem label="角色">
            <Select v-model:value="searchForm.role" placeholder="请选择角色" style="width: 150px" allow-clear>
              <SelectOption value="admin">管理员</SelectOption>
              <SelectOption value="supervisor">主管</SelectOption>
              <SelectOption value="operator">运营</SelectOption>
            </Select>
          </FormItem>
          <FormItem label="状态">
            <Select v-model:value="searchForm.status" placeholder="请选择状态" style="width: 120px" allow-clear>
              <SelectOption value="active">启用</SelectOption>
              <SelectOption value="inactive">禁用</SelectOption>
            </Select>
          </FormItem>
          <FormItem>
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button class="ml-2" @click="handleReset">重置</Button>
          </FormItem>
        </Form>
      </div>

      <!-- 操作按钮 -->
      <div class="mb-4">
        <Button type="primary" @click="handleAdd">新增用户</Button>
      </div>

      <!-- 表格 -->
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'role'">
            <Tag v-if="record.role === 'admin'" color="red">管理员</Tag>
            <Tag v-else-if="record.role === 'supervisor'" color="blue">主管</Tag>
            <Tag v-else color="green">运营</Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag v-if="record.status === 'active'" color="success">启用</Tag>
            <Tag v-else color="default">禁用</Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" @click="handleEdit(record)">编辑</Button>
            <Button type="link" size="small" danger @click="handleDelete(record)">删除</Button>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 新增/编辑用户弹窗 -->
    <Modal
      v-model:open="modalVisible"
      :title="modalTitle"
      :confirm-loading="modalLoading"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <Form :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <FormItem label="用户名" required>
          <Input v-model:value="formData.username" :disabled="isEdit" placeholder="请输入用户名" />
        </FormItem>
        <FormItem v-if="!isEdit" label="密码" required>
          <InputPassword v-model:value="formData.password" placeholder="请输入密码" />
        </FormItem>
        <FormItem label="姓名" required>
          <Input v-model:value="formData.realName" placeholder="请输入姓名" />
        </FormItem>
        <FormItem label="邮箱">
          <Input v-model:value="formData.email" placeholder="请输入邮箱" />
        </FormItem>
        <FormItem label="手机号">
          <Input v-model:value="formData.phone" placeholder="请输入手机号" />
        </FormItem>
        <FormItem label="角色" required>
          <Select v-model:value="formData.role" placeholder="请选择角色">
            <SelectOption value="admin">管理员</SelectOption>
            <SelectOption value="supervisor">主管</SelectOption>
            <SelectOption value="operator">运营</SelectOption>
          </Select>
        </FormItem>
        <FormItem v-if="formData.role === 'operator'" label="管理人" required>
          <Input v-model:value="formData.managerName" placeholder="请输入管理人名称" />
        </FormItem>
        <FormItem label="状态" required>
          <Select v-model:value="formData.status" placeholder="请选择状态">
            <SelectOption value="active">启用</SelectOption>
            <SelectOption value="inactive">禁用</SelectOption>
          </Select>
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  InputPassword,
  Select,
  SelectOption,
  Table,
  Tag,
  Modal,
  message,
} from 'ant-design-vue';
import { requestClient } from '#/api/request';

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '姓名', dataIndex: 'realName', key: 'realName' },
  { title: '角色', dataIndex: 'role', key: 'role' },
  { title: '管理人', dataIndex: 'managerName', key: 'managerName' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '手机号', dataIndex: 'phone', key: 'phone' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 150 },
];

const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const searchForm = reactive({
  keyword: '',
  role: undefined,
  status: undefined,
});

const modalVisible = ref(false);
const modalLoading = ref(false);
const modalTitle = ref('新增用户');
const isEdit = ref(false);
const formData = reactive({
  id: undefined,
  username: '',
  password: '',
  realName: '',
  email: '',
  phone: '',
  role: 'operator',
  managerName: '',
  status: 'active',
});

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true;
  try {
    const result = await requestClient.get('/users/list', {
      params: {
        page: pagination.current,
        pageSize: pagination.pageSize,
        keyword: searchForm.keyword,
        role: searchForm.role,
        status: searchForm.status,
      },
    });
    dataSource.value = result.items;
    pagination.total = result.total;
  } catch (error: any) {
    message.error(error.message || '获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchUsers();
};

// 重置
const handleReset = () => {
  searchForm.keyword = '';
  searchForm.role = undefined;
  searchForm.status = undefined;
  pagination.current = 1;
  fetchUsers();
};

// 表格变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchUsers();
};

// 新增用户
const handleAdd = () => {
  isEdit.value = false;
  modalTitle.value = '新增用户';
  resetFormData();
  modalVisible.value = true;
};

// 编辑用户
const handleEdit = (record: any) => {
  isEdit.value = true;
  modalTitle.value = '编辑用户';
  Object.assign(formData, {
    id: record.id,
    username: record.username,
    password: '',
    realName: record.realName,
    email: record.email,
    phone: record.phone,
    role: record.role,
    managerName: record.managerName,
    status: record.status,
  });
  modalVisible.value = true;
};

// 删除用户
const handleDelete = (record: any) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除用户 "${record.realName}" 吗？`,
    onOk: async () => {
      try {
        await requestClient.delete(`/users/${record.id}`);
        message.success('删除成功');
        fetchUsers();
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
  });
};

// 弹窗确定
const handleModalOk = async () => {
  // 验证必填项
  if (!formData.username || !formData.realName || !formData.role) {
    message.error('请填写必填项');
    return;
  }

  if (!isEdit.value && !formData.password) {
    message.error('请输入密码');
    return;
  }

  if (formData.role === 'operator' && !formData.managerName) {
    message.error('运营角色必须指定管理人');
    return;
  }

  modalLoading.value = true;
  try {
    if (isEdit.value) {
      await requestClient.put(`/users/${formData.id}`, formData);
    } else {
      await requestClient.post('/users/create', formData);
    }
    message.success(isEdit.value ? '更新成功' : '创建成功');
    modalVisible.value = false;
    fetchUsers();
  } catch (error: any) {
    message.error(error.message || '操作失败');
  } finally {
    modalLoading.value = false;
  }
};

// 弹窗取消
const handleModalCancel = () => {
  modalVisible.value = false;
  resetFormData();
};

// 重置表单
const resetFormData = () => {
  Object.assign(formData, {
    id: undefined,
    username: '',
    password: '',
    realName: '',
    email: '',
    phone: '',
    role: 'operator',
    managerName: '',
    status: 'active',
  });
};

onMounted(() => {
  fetchUsers();
});
</script>
