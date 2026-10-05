import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '服务监控',
  icon: 'dashboard',
  order: 50,
  description: '规划服务健康、资源指标和运行状态展示。',
  todo: [
    '展示服务状态、版本和运行时间',
    '接入 CPU、内存、磁盘和网络指标',
    '补充服务异常、阈值和通知策略',
  ],
})
