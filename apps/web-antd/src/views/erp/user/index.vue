<template>
  <div class="p-4">
    <Card title="用户管理">
      <!-- 筛选区 -->
      <div class="mb-4">
        <Form layout="inline">
          <FormItem label="用户名">
            <Input placeholder="请输入用户名" style="width: 200px" />
          </FormItem>
          <FormItem label="角色">
            <Select placeholder="请选择角色" style="width: 200px">
              <SelectOption value="admin">管理员</SelectOption>
              <SelectOption value="user">普通用户</SelectOption>
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
        <Button type="primary">新增用户</Button>
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
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '姓名', dataIndex: 'realName', key: 'realName' },
  { title: '角色', dataIndex: 'role', key: 'role' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '手机号', dataIndex: 'phone', key: 'phone' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '操作', key: 'action' },
];
</script>
