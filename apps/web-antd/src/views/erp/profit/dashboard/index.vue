<template>
  <div class="p-4">
    <Card title="利润看板">
      <!-- 筛选区 -->
      <div class="mb-4">
        <Form layout="inline">
          <FormItem label="时间范围">
            <Input placeholder="请选择时间范围" style="width: 200px" />
          </FormItem>
          <FormItem label="产品分类">
            <Select placeholder="请选择分类" style="width: 200px">
              <SelectOption value="1">分类1</SelectOption>
              <SelectOption value="2">分类2</SelectOption>
            </Select>
          </FormItem>
          <FormItem>
            <Button type="primary">查询</Button>
            <Button class="ml-2">重置</Button>
          </FormItem>
        </Form>
      </div>

      <!-- 统计卡片区 -->
      <div class="mb-4 grid grid-cols-4 gap-4">
        <Card size="small">
          <div class="text-gray-500">总销售额</div>
          <div class="text-2xl font-bold">¥0.00</div>
        </Card>
        <Card size="small">
          <div class="text-gray-500">总成本</div>
          <div class="text-2xl font-bold">¥0.00</div>
        </Card>
        <Card size="small">
          <div class="text-gray-500">总利润</div>
          <div class="text-2xl font-bold text-green-600">¥0.00</div>
        </Card>
        <Card size="small">
          <div class="text-gray-500">利润率</div>
          <div class="text-2xl font-bold">0%</div>
        </Card>
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
  { title: '日期', dataIndex: 'date', key: 'date' },
  { title: '销售额', dataIndex: 'sales', key: 'sales' },
  { title: '成本', dataIndex: 'cost', key: 'cost' },
  { title: '利润', dataIndex: 'profit', key: 'profit' },
  { title: '利润率', dataIndex: 'profitRate', key: 'profitRate' },
];
</script>
