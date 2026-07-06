<script>
export const route = {
  path: '/exception/404',
  name: 'exception-404',
}
</script>

<script setup>
import illustration from '../../assets/errors/404.png'
import ExceptionPage from '../../components/ExceptionPage.vue'
</script>

<template>
  <ExceptionPage
    code="404"
    title="页面不存在"
    description="当前路由没有匹配到示例页面，请返回控制台或通过菜单重新进入。"
    :image="illustration"
    type="empty"
  />
</template>
