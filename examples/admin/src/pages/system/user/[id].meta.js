import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '用户详情',
  permission: 'system:user:view',
  hidden: true,
  activeMenu: '/system/user',
  order: 11,
})
