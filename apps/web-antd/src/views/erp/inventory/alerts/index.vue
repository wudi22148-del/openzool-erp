<template>
  <div class="p-4">
    <Card title="库存预警">
      <!-- 筛选区 -->
      <div class="mb-4">
        <Form layout="inline">
          <FormItem label="预警类型">
            <Select placeholder="请选择类型" style="width: 200px">
              <SelectOption value="low">低库存</SelectOption>
              <SelectOption value="high">高库存</SelectOption>
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
  { title: '当前库存', dataIndex: 'currentStock', key: 'currentStock' },
  { title: '预警值', dataIndex: 'alertValue', key: 'alertValue' },
  { title: '预警类型', dataIndex: 'alertType', key: 'alertType' },
  { title: '预警时间', dataIndex: 'alertTime', key: 'alertTime' },
];
</script>
