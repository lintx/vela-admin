import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '角色管理',
  icon: 'role',
  permission: 'system:role:list',
  order: 20,
})
