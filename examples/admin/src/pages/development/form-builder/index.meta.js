import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '表单构建',
  icon: 'table',
  order: 20,
  description: '规划可视化表单设计、校验和发布能力。',
  todo: [
    '支持拖拽字段、布局和组件属性配置',
    '维护表单校验、联动和默认值规则',
    '提供预览、版本和发布状态管理',
  ],
})
