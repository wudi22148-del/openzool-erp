# 销售统计手动排序功能

## 功能说明

为销售统计页面添加了手动拖拽排序功能，允许用户自定义产品的显示顺序。

## 实现内容

### 1. 数据库层面
- 在 `products` 表中添加了 `sales_sort_order` 字段（INTEGER 类型，默认 NULL）
- 排序逻辑：优先按 `sales_sort_order` 升序排列，未设置排序的产品（NULL）排在后面，然后按总销量降序排列

### 2. 后端 API
- 新增接口：`POST /api/sales/save-sort-order`
- 文件位置：`apps/backend-mock/api/sales/save-sort-order.post.ts`
- 权限控制：仅 admin 和 supervisor 角色可以保存排序
- 功能：批量更新产品的排序顺序

### 3. 查询逻辑优化
- 修改文件：`apps/backend-mock/api/sales/statistics.ts`
- 在两种统计模式（销售数量模式和订单数量模式）的 SQL 查询中都添加了排序支持
- 排序规则：`ORDER BY p.sales_sort_order NULLS LAST, total_sales DESC`

### 4. 前端实现
- 修改文件：`apps/web-antd/src/views/erp/sales/components/SalesTable.vue`
- 添加了序号列（type: 'seq'）显示当前排序位置
- 启用了表格行拖拽功能（rowConfig.drag: true）
- 实现了拖拽结束后自动保存排序的逻辑
- 添加了 API 调用：`apps/web-antd/src/api/core/sales.ts` 中的 `saveSalesSortOrder` 方法

## 使用方法

1. 打开销售统计页面
2. 在表格左侧可以看到"排序"列，显示当前的序号
3. 鼠标悬停在任意行上，按住鼠标左键可以拖拽该行
4. 拖拽到目标位置后松开鼠标，系统会自动保存新的排序
5. 保存成功后会显示提示消息
6. 刷新页面后，产品会按照您设置的顺序显示

## 注意事项

- 只有 admin 和 supervisor 角色可以保存排序
- 手动排序优先级高于按销量排序
- 如果产品没有设置手动排序，则按照销量降序显示
- 拖拽排序会影响当前筛选条件下的所有产品
- 排序保存失败时，表格会自动重新加载恢复原顺序

## 技术细节

- 使用 vxe-table 的行拖拽功能
- 拖拽结束时触发 `row-drop-end` 事件
- 批量更新所有产品的排序顺序（基于当前表格数据的顺序）
- 数据库使用事务确保数据一致性
