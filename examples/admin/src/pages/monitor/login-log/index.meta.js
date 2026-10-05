import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '登录日志',
  icon: 'security',
  order: 20,
  description: '规划登录成功、失败和风险事件查询。',
  todo: [
    '记录登录时间、用户、IP 和客户端信息',
    '支持按结果、用户和时间范围筛选',
    '标记异常登录并接入安全告警',
  ],
})
