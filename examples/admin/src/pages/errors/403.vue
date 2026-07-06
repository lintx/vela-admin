<script>
export const route = {
  path: '/exception/403',
  name: 'exception-403',
}
</script>

<script setup>
import illustration from '../../assets/errors/403.png'
import ExceptionPage from '../../components/ExceptionPage.vue'
</script>

<template>
  <ExceptionPage
    code="403"
    title="没有访问权限"
    description="当前账号缺少访问该页面所需的权限码，请切换账号或联系管理员。"
    :image="illustration"
    type="warning"
  >
    <template #actions>
      <var-button @click="$router.push('/login')">
        重新登录
      </var-button>
    </template>
  </ExceptionPage>
</template>
