import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '内容管理',
  icon: 'text',
  order: 10,
  description: '规划文章、栏目、标签和评论等内容运营能力。',
  todo: [
    '维护文章标题、正文、封面、作者和发布状态',
    '管理栏目层级、展示顺序和访问权限',
    '维护标签及其关联内容，支持筛选和批量维护',
    '审核评论、处理举报并记录内容安全结果',
    '补充搜索、审核流转、版本管理和批量操作',
  ],
})
