export default defineEventHandler(async () => {
  // 返回管理人列表
  return {
    code: 0,
    data: [
      { id: '1', name: '张三' },
      { id: '2', name: '李四' },
      { id: '3', name: '王五' },
    ],
  };
});
