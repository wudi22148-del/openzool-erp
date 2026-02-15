<template>
  <div class="p-4">
    <Card title="费用分摊规则">
      <!-- 筛选区 -->
      <div class="mb-4">
        <Form layout="inline">
          <FormItem label="规则名称">
            <Input placeholder="请输入规则名称" style="width: 200px" />
          </FormItem>
          <FormItem label="费用类型">
            <Select placeholder="请选择类型" style="width: 200px">
              <SelectOption value="rent">租金</SelectOption>
              <SelectOption value="utility">水电费</SelectOption>
              <SelectOption value="other">其他</SelectOption>
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
        <Button type="primary">新增规则</Button>
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
  { title: '规则名称', dataIndex: 'ruleName', key: 'ruleName' },
  { title: '费用类型', dataIndex: 'feeType', key: 'feeType' },
  { title: '分摊方式', dataIndex: 'allocMethod', key: 'allocMethod' },
  { title: '分摊比例', dataIndex: 'allocRatio', key: 'allocRatio' },
  { title: '生效日期', dataIndex: 'effectDate', key: 'effectDate' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action' },
];
</script>
