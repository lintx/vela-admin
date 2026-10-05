import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '定时任务',
  icon: 'sortable',
  order: 40,
  description: '规划任务调度、执行记录和失败重试能力。',
  todo: [
    '维护任务表达式、执行器和启停状态',
    '查看任务执行记录、耗时和结果',
    '支持失败重试、手动执行和告警通知',
  ],
})
