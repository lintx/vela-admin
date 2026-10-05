import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '营销管理',
  icon: 'more',
  order: 40,
  description: '规划优惠券、活动和运营位配置。',
  todo: [
    '维护优惠券规则、有效期和发放范围',
    '配置活动状态、参与条件和展示时间',
    '管理首页轮播、推荐位和运营素材',
  ],
})
