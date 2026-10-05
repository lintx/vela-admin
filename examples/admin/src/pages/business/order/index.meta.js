import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '订单管理',
  icon: 'table',
  order: 30,
  description: '规划订单查询、状态流转、售后和导出能力。',
  todo: [
    '支持按订单号、用户和状态筛选',
    '维护待支付、已支付、已完成等状态流转',
    '补充退款、售后和订单导出流程',
  ],
})
