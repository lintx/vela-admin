import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '字典管理',
  icon: 'data',
  order: 60,
  description: '规划通用字典、枚举值和业务状态选项。',
  todo: [
    '维护字典类型和字典数据',
    '支持字典项启用、停用和排序',
    '为业务表单提供统一选项来源',
  ],
})
