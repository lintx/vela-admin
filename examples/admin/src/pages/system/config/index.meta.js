import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '参数设置',
  icon: 'settings',
  order: 70,
  description: '规划系统参数、开关配置和运行时偏好。',
  todo: [
    '维护全局参数和业务开关',
    '支持参数分组、类型校验和默认值',
    '记录参数修改历史并提供回滚能力',
  ],
})
