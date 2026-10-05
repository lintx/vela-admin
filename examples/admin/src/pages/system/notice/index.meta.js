import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '通知公告',
  icon: 'notification',
  order: 80,
  description: '规划站内公告、消息发布和阅读状态。',
  todo: [
    '维护公告草稿、发布和撤回状态',
    '支持按角色、部门或用户定向发布',
    '记录阅读状态并提供消息归档',
  ],
})
