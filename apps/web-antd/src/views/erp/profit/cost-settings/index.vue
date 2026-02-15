<template>
  <div class="p-4">
    <Card title="成本设置">
      <!-- 筛选区 -->
      <div class="mb-4">
        <Form layout="inline">
          <FormItem label="产品名称">
            <Input placeholder="请输入产品名称" style="width: 200px" />
          </FormItem>
          <FormItem label="成本类型">
            <Select placeholder="请选择类型" style="width: 200px">
              <SelectOption value="material">材料成本</SelectOption>
              <SelectOption value="labor">人工成本</SelectOption>
              <SelectOption value="other">其他成本</SelectOption>
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
        <Button type="primary">新增成本</Button>
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
  { title: '产品名称', dataIndex: 'productName', key: 'productName' },
  { title: '成本类型', dataIndex: 'costType', key: 'costType' },
  { title: '成本金额', dataIndex: 'costAmount', key: 'costAmount' },
  { title: '计算方式', dataIndex: 'calcMethod', key: 'calcMethod' },
  { title: '生效日期', dataIndex: 'effectDate', key: 'effectDate' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action' },
];
</script>
