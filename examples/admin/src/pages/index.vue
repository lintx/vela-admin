<script>
import { defineRouteMeta } from 'vela-admin/router'

export const route = {
  meta: defineRouteMeta({
    title: '控制台',
    icon: 'dashboard',
    permission: 'dashboard:view',
    order: 10,
  }),
}
</script>

<script setup>
import { computed, inject } from 'vue'

import { VaIcon } from 'vela-admin/components'
import { permissionInjectionKey } from 'vela-admin/permission'

defineProps({
  sourceColor: {
    type: String,
    required: true,
  },
  themeBase: {
    type: String,
    required: true,
  },
  themeMode: {
    type: String,
    required: true,
  },
  layoutMode: {
    type: String,
    required: true,
  },
})

defineEmits(['update:source-color', 'apply-theme', 'reset-theme'])

const permission = inject(permissionInjectionKey)
const session = computed(() => permission?.getSession() ?? { user: {}, roles: [], permissions: [] })
const stats = computed(() => [
  { label: '可见菜单', value: '8', icon: 'data', tone: 'primary' },
  { label: '权限码', value: String(session.value.permissions.length), icon: 'shield-check', tone: 'success' },
  { label: '打开标签', value: '默认开启', icon: 'tabs', tone: 'info' },
  { label: '主题模式', value: 'MD3 / MD2', icon: 'theme', tone: 'warning' },
])
const quickColors = [
  { label: 'MD3 紫', value: '#6750A4' },
  { label: '海蓝', value: '#2563EB' },
  { label: '青绿', value: '#0F766E' },
  { label: '靛紫', value: '#7C3AED' },
]
const permissionProgress = computed(() => Math.min(100, Math.round((session.value.permissions.length / 10) * 100)))
const activities = [
  { title: '登录 mock admin 账号', icon: 'user-check' },
  { title: '访问用户管理并验证按钮权限', icon: 'users' },
  { title: '切换布局模式到顶栏或混合', icon: 'layout' },
  { title: '从设置中心打开主题生成器', icon: 'theme' },
]
</script>

<template>
  <section class="admin-dashboard admin-page-span">
    <header class="admin-dashboard__hero">
      <div class="admin-dashboard__hero-main">
        <p class="admin-dashboard__eyebrow">控制台</p>
        <h2>框架能力总览</h2>
        <p>当前示例用于验证路由、权限、菜单、标签页、设置中心和主题生成器的完整链路。</p>
      </div>
      <var-space :size="[8, 8]">
        <var-button type="primary" @click="$emit('apply-theme')">应用当前主题</var-button>
        <var-button @click="$router.push('/system/user')">查看用户</var-button>
      </var-space>
    </header>

    <div class="admin-dashboard__stats">
      <div v-for="item in stats" :key="item.label" class="admin-dashboard__stat">
        <VaIcon :name="item.icon" />
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </div>

    <section class="admin-dashboard__panel">
      <h3>当前登录状态</h3>
      <var-cell title="用户" :description="session.user?.name || '未登录'" />
      <var-cell title="角色" :description="session.roles.join('、') || '无'" />
      <var-cell title="权限" :description="session.permissions.slice(0, 5).join('、')" />
      <var-progress class="admin-dashboard__progress" :value="permissionProgress" label />
    </section>

    <section class="admin-dashboard__panel">
      <h3>主题与布局</h3>
      <var-cell title="布局模式" :description="layoutMode" />
      <var-cell title="主题版本" :description="themeBase" />
      <var-cell title="明暗模式" :description="themeMode" />
      <div class="admin-dashboard__palette" aria-label="源颜色">
        <var-button
          v-for="item in quickColors"
          :key="item.value"
          class="admin-dashboard__swatch"
          :class="{ 'admin-dashboard__swatch--active': sourceColor.toLowerCase() === item.value.toLowerCase() }"
          text
          @click="$emit('update:source-color', item.value)"
        >
          <span :style="{ backgroundColor: item.value }" />
          {{ item.label }}
        </var-button>
      </div>
    </section>

    <section class="admin-dashboard__panel">
      <h3>最近操作</h3>
      <var-cell v-for="activity in activities" :key="activity.title" :title="activity.title">
        <template #icon>
          <VaIcon :name="activity.icon" />
        </template>
      </var-cell>
    </section>

    <section class="admin-dashboard__panel">
      <h3>组件状态</h3>
      <var-space direction="column" :size="[12, 12]">
        <var-input placeholder="请输入关键词" />
        <var-space :size="[8, 8]">
          <var-button>默认按钮</var-button>
          <var-button type="primary">主要操作</var-button>
          <var-button type="danger" text>危险操作</var-button>
        </var-space>
      </var-space>
    </section>
  </section>
</template>

<style scoped>
.admin-page-span {
  grid-column: 1 / -1;
}

.admin-dashboard {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.admin-dashboard__hero,
.admin-dashboard__stats {
  grid-column: 1 / -1;
}

.admin-dashboard__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-dashboard__hero-main {
  min-width: 0;
}

.admin-dashboard__eyebrow {
  margin: 0 0 6px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.admin-dashboard h2,
.admin-dashboard h3,
.admin-dashboard p {
  overflow-wrap: anywhere;
}

.admin-dashboard h2,
.admin-dashboard h3 {
  margin: 0;
  font-weight: 600;
}

.admin-dashboard__hero p:not(.admin-dashboard__eyebrow) {
  max-width: 680px;
  margin: 8px 0 0;
  color: var(--color-on-surface-variant);
}

.admin-dashboard__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.admin-dashboard__stat {
  display: grid;
  padding: 14px 0;
  gap: 6px;
  border-top: 1px solid var(--color-outline-variant);
}

.admin-dashboard__stat .va-icon {
  color: var(--color-primary);
}

.admin-dashboard__stat span {
  color: var(--color-on-surface-variant);
  font-size: 13px;
}

.admin-dashboard__stat strong {
  font-size: 20px;
  font-weight: 600;
}

.admin-dashboard__panel {
  min-width: 0;
  padding-top: 16px;
  border-top: 1px solid var(--color-outline-variant);
}

.admin-dashboard__panel h3 {
  margin-bottom: 12px;
  font-size: 17px;
}

.admin-dashboard__progress {
  margin-top: 12px;
}

.admin-dashboard__palette {
  display: flex;
  flex-wrap: wrap;
  margin-top: 12px;
  gap: 8px;
}

.admin-dashboard__swatch {
  min-width: 0;
}

.admin-dashboard__swatch span {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 6px;
  border: 1px solid var(--va-admin-sidebar-border);
  border-radius: 50%;
  vertical-align: -2px;
}

.admin-dashboard__swatch--active {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

@media (max-width: 900px) {
  .admin-dashboard,
  .admin-dashboard__stats {
    grid-template-columns: 1fr;
  }

  .admin-dashboard__hero {
    flex-direction: column;
  }
}
</style>
