<script>
export const route = {
  path: '/exception/500',
  name: 'exception-500',
}
</script>

<script setup>
import illustration from '../../assets/errors/500.png'
import ExceptionPage from '../../components/ExceptionPage.vue'
</script>

<template>
  <ExceptionPage
    code="500"
    title="服务暂时不可用"
    description="示例服务返回了异常状态，请稍后重试或回到控制台继续其它操作。"
    :image="illustration"
    type="error"
  />
</template>
