<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { VaIcon } from 'vela-admin/components'

const route = useRoute()
const router = useRouter()
const saving = ref(false)
const message = ref('')
const form = reactive({
  name: `用户 ${route.params.id}`,
  department: '平台组',
  email: `user${route.params.id}@example.com`,
  role: 'admin',
  notification: 'email',
  enabled: true,
})
const departments = [
  { label: '平台组', value: '平台组' },
  { label: '内容组', value: '内容组' },
  { label: '风控组', value: '风控组' },
  { label: '客户成功', value: '客户成功' },
]
const roles = [
  { label: '管理员', value: 'admin' },
  { label: '运营', value: 'operator' },
  { label: '审计员', value: 'auditor' },
]

async function save() {
  saving.value = true
  message.value = ''

  await new Promise((resolve) => window.setTimeout(resolve, 360))

  saving.value = false
  message.value = `已保存用户 ${route.params.id}`
}
</script>

<template>
  <section class="admin-user-detail admin-page-span">
    <header class="admin-user-detail__header">
      <div>
        <p class="admin-user-detail__eyebrow">动态路由</p>
        <h2>用户详情 #{{ route.params.id }}</h2>
        <p>当前页面用于验证文件路由 `system.user.[id].vue` 和菜单 active 回显。</p>
      </div>
      <var-button @click="router.push('/system/user')">返回列表</var-button>
    </header>

    <section class="admin-user-detail__form-card">
      <h3>基础信息</h3>
      <var-form class="admin-user-detail__form">
        <var-input v-model="form.name" placeholder="请输入姓名">
          <template #prepend-icon>
            <VaIcon name="user" />
          </template>
        </var-input>

        <var-select v-model="form.department" :options="departments" placeholder="请选择部门" />

        <var-input v-model="form.email" placeholder="请输入邮箱">
          <template #prepend-icon>
            <VaIcon name="email" />
          </template>
        </var-input>

        <var-select v-model="form.role" :options="roles" placeholder="请选择角色" />

        <var-cell title="通知方式" :description="form.notification">
          <template #extra>
            <var-radio-group v-model="form.notification" direction="horizontal">
              <var-radio checked-value="email">邮件</var-radio>
              <var-radio checked-value="sms">短信</var-radio>
            </var-radio-group>
          </template>
        </var-cell>

        <var-cell title="账号启用" description="关闭后该用户无法登录示例系统">
          <template #extra>
            <var-switch v-model="form.enabled" />
          </template>
        </var-cell>
      </var-form>

      <var-space class="admin-user-detail__actions" :size="[8, 8]">
        <var-button type="primary" :loading="saving" @click="save">保存</var-button>
        <var-button @click="router.push('/system/user')">取消</var-button>
      </var-space>

      <p v-if="message" class="admin-user-detail__message" role="status" aria-live="polite">
        {{ message }}
      </p>
    </section>
  </section>
</template>

<style scoped>
.admin-page-span {
  grid-column: 1 / -1;
}

.admin-user-detail {
  display: grid;
  gap: 16px;
}

.admin-user-detail__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-user-detail__eyebrow {
  margin: 0 0 6px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.admin-user-detail h2,
.admin-user-detail h3,
.admin-user-detail p {
  overflow-wrap: anywhere;
}

.admin-user-detail h2,
.admin-user-detail h3 {
  margin: 0;
  font-weight: 600;
}

.admin-user-detail__header p:not(.admin-user-detail__eyebrow) {
  margin: 8px 0 0;
  color: var(--color-on-surface-variant);
}

.admin-user-detail__form-card h3 {
  margin-bottom: 16px;
  font-size: 18px;
}

.admin-user-detail__form-card {
  min-width: 0;
  padding-top: 16px;
  border-top: 1px solid var(--color-outline-variant);
}

.admin-user-detail__form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

:deep(.var-cell) {
  background: transparent;
}

.admin-user-detail__actions {
  margin-top: 18px;
}

.admin-user-detail__message {
  margin: 12px 0 0;
  color: var(--color-success);
}

@media (max-width: 720px) {
  .admin-user-detail__header {
    flex-direction: column;
  }

  .admin-user-detail__form {
    grid-template-columns: 1fr;
  }
}
</style>
