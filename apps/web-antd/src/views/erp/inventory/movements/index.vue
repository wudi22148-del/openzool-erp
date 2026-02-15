<template>
  <div class="p-4">
    <Card title="出入库流水">
      <!-- 筛选区 -->
      <div class="mb-4">
        <Form layout="inline">
          <FormItem label="单据类型">
            <Select placeholder="请选择类型" style="width: 200px">
              <SelectOption value="in">入库</SelectOption>
              <SelectOption value="out">出库</SelectOption>
            </Select>
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
        <Button type="primary">新增入库</Button>
        <Button class="ml-2">新增出库</Button>
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
  { title: '单据编号', dataIndex: 'billNo', key: 'billNo' },
  { title: '单据类型', dataIndex: 'billType', key: 'billType' },
  { title: '产品名称', dataIndex: 'productName', key: 'productName' },
  { title: '仓库', dataIndex: 'warehouse', key: 'warehouse' },
  { title: '数量', dataIndex: 'quantity', key: 'quantity' },
  { title: '操作人', dataIndex: 'operator', key: 'operator' },
  { title: '操作时间', dataIndex: 'operateTime', key: 'operateTime' },
  { title: '操作', key: 'action' },
];
</script>
