import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '操作日志',
  icon: 'table',
  order: 30,
  description: '规划用户操作审计、请求详情和日志留存策略。',
  todo: [
    '记录用户、模块、动作和操作结果',
    '支持查看请求参数、响应摘要和错误信息',
    '补充日志检索、导出和留存策略',
  ],
})
