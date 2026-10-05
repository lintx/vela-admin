import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '商品管理',
  icon: 'data',
  order: 20,
  description: '规划商品资料、库存、上下架和分类管理。',
  todo: [
    '维护商品名称、规格、价格和图片',
    '支持商品上下架和库存预警',
    '补充商品分类、品牌和属性配置',
  ],
})
