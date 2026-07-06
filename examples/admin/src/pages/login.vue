<script setup>
import { computed, inject, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { VaIcon } from 'vela-admin/components'

import velaLogo from '../assets/vela-logo.png'
import { mockAuthInjectionKey } from '../mock-auth'

const route = useRoute()
const router = useRouter()
const auth = inject(mockAuthInjectionKey)
const form = reactive({
  username: 'admin',
  password: 'admin123',
})
const loading = ref(false)
const errorMessage = ref('')
const accounts = computed(() => auth?.accounts ?? [])

async function submit() {
  if (!auth || loading.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    auth.login(form)
    await router.replace(resolveRedirectPath())
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function fillAccount(account) {
  form.username = account.username
  form.password = account.password
}

function resolveRedirectPath() {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/'
}
</script>

<template>
  <main class="admin-login">
    <section class="admin-login__intro" aria-label="产品信息">
      <img class="admin-login__logo" :src="velaLogo" alt="Vela Admin" />
      <p class="admin-login__eyebrow">Vela Admin Example</p>
      <h1>Vela Admin</h1>
      <p class="admin-login__summary">
        轻量、可配置、以 Varlet UI 为组件基座的后台框架示例。
      </p>
      <var-space class="admin-login__points" :size="[8, 8]">
        <var-chip plain>文件路由</var-chip>
        <var-chip plain>权限过滤</var-chip>
        <var-chip plain>MD3 / MD2 主题</var-chip>
        <var-chip plain>标签页与设置中心</var-chip>
      </var-space>
    </section>

    <section class="admin-login__form-panel" aria-label="登录表单">
      <div class="admin-login__form-header">
        <h2>登录示例账号</h2>
        <p>登录后可进入控制台，并通过不同权限验证菜单与按钮状态。</p>
      </div>

      <var-form class="admin-login__form" @submit.prevent="submit">
        <label class="admin-login__field">
          <span>账号</span>
          <var-input v-model="form.username" autocomplete="username" placeholder="请输入账号" />
        </label>

        <label class="admin-login__field">
          <span>密码</span>
          <var-input
            v-model="form.password"
            autocomplete="current-password"
            placeholder="请输入密码"
            type="password"
          />
        </label>

        <p v-if="errorMessage" class="admin-login__error" role="alert" aria-live="polite">
          {{ errorMessage }}
        </p>

        <var-button class="admin-login__submit" block type="primary" native-type="submit" :loading="loading" @click="submit">
          登录
        </var-button>
      </var-form>

      <div class="admin-login__accounts">
        <p>示例账号</p>
        <var-row class="admin-login__account-grid" :gutter="[10, 10]">
          <var-col v-for="account in accounts" :key="account.username" :span="24" :sm="12">
            <button
              class="admin-login__account"
              type="button"
              @click="fillAccount(account)"
            >
              <var-cell
                :title="`${account.name} / ${account.title}`"
                :description="`${account.username} / ${account.password}`"
              >
                <template #icon>
                  <VaIcon name="user" />
                </template>
              </var-cell>
            </button>
          </var-col>
        </var-row>
      </div>
    </section>
  </main>
</template>

<style scoped>
.admin-login {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 448px);
  min-height: 100dvh;
  padding: clamp(24px, 6vw, 72px);
  color: var(--color-text);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 42%),
    var(--color-body);
  gap: clamp(32px, 7vw, 96px);
}

.admin-login__intro {
  align-self: center;
  max-width: 620px;
}

.admin-login__logo {
  display: block;
  width: 88px;
  height: 88px;
  margin-bottom: 22px;
  object-fit: contain;
  border-radius: var(--card-border-radius, 4px);
}

.admin-login__eyebrow {
  margin: 0 0 10px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.admin-login h1,
.admin-login h2,
.admin-login p {
  overflow-wrap: anywhere;
}

.admin-login h1 {
  margin: 0;
  font-size: clamp(40px, 7vw, 72px);
  font-weight: 700;
  line-height: 1.02;
}

.admin-login__summary {
  max-width: 520px;
  margin: 18px 0 0;
  color: var(--color-on-surface-variant);
  font-size: 17px;
  line-height: 1.7;
}

.admin-login__points {
  margin-top: 28px;
}

.admin-login__form-panel {
  align-self: center;
  box-sizing: border-box;
  width: 100%;
  padding: 24px;
  background: var(--color-body);
  border: 1px solid var(--color-outline-variant);
}

.admin-login__form-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.admin-login__form-header p,
.admin-login__accounts p {
  margin: 8px 0 0;
  color: var(--color-on-surface-variant);
}

.admin-login__form {
  display: grid;
  margin-top: 24px;
  gap: 16px;
}

.admin-login__field {
  display: grid;
  gap: 8px;
}

.admin-login__field > span {
  font-size: 14px;
  color: var(--color-on-surface-variant);
}

.admin-login__error {
  margin: 0;
  color: var(--color-danger);
  font-size: 14px;
}

.admin-login__submit {
  margin-top: 4px;
}

.admin-login__accounts {
  display: grid;
  margin-top: 22px;
  gap: 10px;
}

.admin-login__account-grid {
  width: 100%;
}

.admin-login__account {
  display: block;
  width: 100%;
  padding: 0;
  color: inherit;
  font: inherit;
  text-align: inherit;
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--color-outline-variant);
}

.admin-login__account :deep(.var-cell) {
  min-height: 72px;
  padding-right: 12px;
  padding-left: 12px;
}

.admin-login__account :deep(.var-cell__content) {
  min-width: 0;
  align-items: center;
}

.admin-login__account :deep(.var-cell__title),
.admin-login__account :deep(.var-cell__description) {
  width: 100%;
  text-align: center;
}

@media (max-width: 760px) {
  .admin-login {
    grid-template-columns: 1fr;
    align-content: start;
    padding: 24px 16px;
  }

  .admin-login__intro,
  .admin-login__form-panel {
    align-self: stretch;
  }

  .admin-login__form-panel {
    padding: 22px;
  }
}
</style>
