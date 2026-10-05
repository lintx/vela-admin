import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '在线用户',
  icon: 'users',
  order: 10,
  description: '规划在线会话、登录设备和强制下线能力。',
  todo: [
    '查看在线用户、登录时间和客户端信息',
    '支持按用户、部门和设备类型筛选',
    '提供强制下线和异常会话处理',
  ],
})
