<template>
  <div class="p-4">
    <Card title="库存概览">
      <!-- 筛选区 -->
      <div class="mb-4">
        <Form layout="inline">
          <FormItem label="仓库">
            <Select placeholder="请选择仓库" style="width: 200px">
              <SelectOption value="1">仓库1</SelectOption>
              <SelectOption value="2">仓库2</SelectOption>
            </Select>
          </FormItem>
          <FormItem label="产品名称">
            <Input placeholder="请输入产品名称" style="width: 200px" />
          </FormItem>
          <FormItem>
            <Button type="primary">查询</Button>
            <Button class="ml-2">重置</Button>
          </FormItem>
        </Form>
      </div>

      <!-- 表格区 -->
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
  { title: '产品名称', dataIndex: 'productName', key: 'productName' },
  { title: '产品编码', dataIndex: 'productCode', key: 'productCode' },
  { title: '仓库', dataIndex: 'warehouse', key: 'warehouse' },
  { title: '当前库存', dataIndex: 'stock', key: 'stock' },
  { title: '可用库存', dataIndex: 'availableStock', key: 'availableStock' },
  { title: '预警值', dataIndex: 'alertValue', key: 'alertValue' },
  { title: '状态', dataIndex: 'status', key: 'status' },
];
</script>
