import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '菜单管理',
  icon: 'menu-2',
  order: 50,
  description: '规划路由菜单、按钮权限和菜单可见范围。',
  todo: [
    '维护目录、菜单和按钮权限',
    '配置菜单图标、排序和可见状态',
    '关联角色权限并校验路由访问',
  ],
})
