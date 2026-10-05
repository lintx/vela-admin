import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '代码生成',
  icon: 'code',
  order: 10,
  description: '规划基于数据模型生成页面、接口和权限配置。',
  todo: [
    '选择数据表并配置字段、关系和校验规则',
    '生成列表、表单、详情页和接口骨架',
    '支持模板管理、预览和下载代码包',
  ],
})
