<template>
  <div class="p-4">
    <Card title="订单利润明细">
      <!-- 筛选区 -->
      <div class="mb-4">
        <Form layout="inline">
          <FormItem label="订单编号">
            <Input placeholder="请输入订单编号" style="width: 200px" />
          </FormItem>
          <FormItem label="日期范围">
            <Input placeholder="请选择日期" style="width: 200px" />
          </FormItem>
          <FormItem>
            <Button type="primary">查询</Button>
            <Button class="ml-2">重置</Button>
          </FormItem>
        </Form>
      </div>

      <!-- 表格区 -->
      <div class="mb-4">
        <Button type="primary">导出报表</Button>
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
import { Button, Card, Empty, Form, FormItem, Input, Table } from 'ant-design-vue';

const columns = [
  { title: '订单编号', dataIndex: 'orderNo', key: 'orderNo' },
  { title: '产品名称', dataIndex: 'productName', key: 'productName' },
  { title: '销售数量', dataIndex: 'quantity', key: 'quantity' },
  { title: '销售金额', dataIndex: 'salesAmount', key: 'salesAmount' },
  { title: '成本金额', dataIndex: 'costAmount', key: 'costAmount' },
  { title: '利润', dataIndex: 'profit', key: 'profit' },
  { title: '利润率', dataIndex: 'profitRate', key: 'profitRate' },
  { title: '订单日期', dataIndex: 'orderDate', key: 'orderDate' },
];
</script>
