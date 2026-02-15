<template>
  <div class="p-4">
    <Card title="仓库管理">
      <!-- 筛选区 -->
      <div class="mb-4">
        <Form layout="inline">
          <FormItem label="仓库名称">
            <Input placeholder="请输入仓库名称" style="width: 200px" />
          </FormItem>
          <FormItem label="仓库状态">
            <Select placeholder="请选择状态" style="width: 200px">
              <SelectOption value="1">启用</SelectOption>
              <SelectOption value="0">停用</SelectOption>
            </Select>
          </FormItem>
          <FormItem>
            <Button type="primary">查询</Button>
            <Button class="ml-2">重置</Button>
          </FormItem>
        </Form>
      </div>

      <!-- 表格区 -->
      <div class="mb-4">
        <Button type="primary">新增仓库</Button>
      </div>
      <Table :columns="columns" :data-source="[]" :pagination="{ pageSize: 10 }">
        <template #emptyText>
          <Empty description="暂无数据" />
        </template>
      </Table>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Button, Card, Empty, Form, FormItem, Input, Select, SelectOption, Table } from 'ant-design-vue';

const columns = [
  { title: '仓库编码', dataIndex: 'code', key: 'code' },
  { title: '仓库名称', dataIndex: 'name', key: 'name' },
  { title: '仓库地址', dataIndex: 'address', key: 'address' },
  { title: '负责人', dataIndex: 'manager', key: 'manager' },
  { title: '联系电话', dataIndex: 'phone', key: 'phone' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action' },
];
</script>
