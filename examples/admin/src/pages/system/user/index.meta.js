import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '用户管理',
  icon: 'users',
  permission: 'system:user:list',
  order: 10,
})
