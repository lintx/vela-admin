import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '接口文档',
  icon: 'link',
  order: 30,
  description: '规划接口目录、参数说明和在线调试能力。',
  todo: [
    '维护接口分组、请求参数和响应模型',
    '支持鉴权配置、示例请求和在线调试',
    '补充文档搜索、版本和导出能力',
  ],
})
