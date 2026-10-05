import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '岗位管理',
  icon: 'user-check',
  order: 40,
  description: '规划岗位字典、岗位状态和岗位关联权限。',
  todo: [
    '维护岗位名称、编码和排序',
    '设置岗位启用状态和归属部门',
    '关联岗位默认角色和数据范围',
  ],
})
