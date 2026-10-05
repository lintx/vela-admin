import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '部门管理',
  icon: 'users',
  order: 30,
  description: '规划组织层级、负责人和数据权限范围。',
  todo: [
    '维护部门树与上下级关系',
    '配置部门负责人和数据权限范围',
    '支持部门启用、停用和排序',
  ],
})
