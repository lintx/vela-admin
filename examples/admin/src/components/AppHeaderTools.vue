<script setup>
import { computed, inject, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { VaIcon } from 'vela-admin/components'

import { mockAuthInjectionKey } from '../mock-auth'

const props = defineProps({
  layoutMode: {
    type: String,
    required: true,
  },
  themeMode: {
    type: String,
    required: true,
  },
})
const emit = defineEmits([
  'update:layoutMode',
  'toggleThemeMode',
  'openThemeGenerator',
])
const route = useRoute()
const router = useRouter()
const auth = inject(mockAuthInjectionKey, null)
const notificationMenuOpen = ref(false)
const userMenuOpen = ref(false)
const headerToolMenuVersion = ref(0)
const notifications = ref([
  { id: 1, title: '构建任务已完成', description: '示例工程最近一次构建通过', time: '2 分钟前', unread: true, path: '/' },
  { id: 2, title: '权限策略更新', description: 'mock admin 账号已同步最新权限码', time: '18 分钟前', unread: true, path: '/permission/button' },
  { id: 3, title: '主题预览已保存', description: '当前源颜色已加入本地偏好', time: '1 小时前', unread: false, path: '/' },
])
const currentUser = computed(() => auth?.session.value?.user ?? null)
const unreadNotificationCount = computed(() => notifications.value.filter(item => item.unread).length)
const layoutModeText = computed(() => ({
  side: '侧栏',
  top: '顶栏',
  mixed: '混合',
})[props.layoutMode] ?? props.layoutMode)

function toggleLayoutMode() {
  const nextMode = props.layoutMode === 'side' ? 'top' : props.layoutMode === 'top' ? 'mixed' : 'side'
  emit('update:layoutMode', nextMode)
}

function openGitHubRepository() {
  window.open('https://github.com/lintx/vela-admin', '_blank', 'noopener,noreferrer')
}

function markAllNotificationsRead() {
  notifications.value = notifications.value.map(item => ({ ...item, unread: false }))
}

function closeHeaderToolMenus() {
  notificationMenuOpen.value = false
  userMenuOpen.value = false
  headerToolMenuVersion.value += 1
}

function openNotification(item) {
  notifications.value = notifications.value.map(notification => notification.id === item.id
    ? { ...notification, unread: false }
    : notification)
  notificationMenuOpen.value = false

  if (item.path && item.path !== route.path) {
    router.push(item.path)
  }
}

function openUserProfile() {
  userMenuOpen.value = false
  router.push('/')
}

function openAccountSettings() {
  userMenuOpen.value = false
  router.push('/system/user')
}

function openPreferenceSettings() {
  userMenuOpen.value = false
  emit('openThemeGenerator')
}

function logout() {
  userMenuOpen.value = false
  auth?.logout()
  router.replace({
    path: '/login',
    query: {
      redirect: route.path === '/login' ? '/' : route.fullPath,
    },
  })
}

defineExpose({ closeMenus: closeHeaderToolMenus })
</script>

<template>
  <div class="admin-preview__header-actions">
    <var-button data-testid="header-layout-toggle" class="admin-preview__tool-button" text @click="toggleLayoutMode">
      {{ layoutModeText }}
    </var-button>
    <var-button class="admin-preview__tool-button" text aria-label="打开 GitHub 仓库" @click="openGitHubRepository">
      <VaIcon library="tabler" name="brand-github" :size="22" />
      <span class="admin-preview__tool-label admin-preview__tool-label--adaptive">GitHub</span>
    </var-button>
    <var-button
      data-testid="header-theme-toggle"
      class="admin-preview__tool-button"
      text
      @click="emit('toggleThemeMode', $event)"
    >
      <VaIcon :name="themeMode === 'light' ? 'moon' : 'sun'" :size="22" />
      <span class="admin-preview__tool-label admin-preview__tool-label--adaptive">
        {{ themeMode === 'light' ? '深色' : '浅色' }}
      </span>
    </var-button>
    <var-menu
      :key="`notification-${headerToolMenuVersion}`"
      v-model:show="notificationMenuOpen"
      class="admin-preview__tool-popover"
      placement="bottom-end"
      :offset-y="8"
      @open="userMenuOpen = false"
    >
      <var-button
        class="admin-preview__tool-button admin-preview__notification-button"
        text
        :aria-expanded="notificationMenuOpen"
        aria-label="打开通知"
      >
        <var-badge
          data-testid="unread-notification-count"
          :value="unreadNotificationCount"
          :hidden="!unreadNotificationCount"
          :max-value="99"
          position="right-top"
          :offset-x="-4"
          :offset-y="4"
        >
          <VaIcon name="notification" :size="22" />
        </var-badge>
        <span class="admin-preview__tool-label admin-preview__tool-label--adaptive">通知</span>
      </var-button>

      <template #menu>
        <div class="admin-preview__menu-panel admin-preview__notification-menu" role="menu">
          <div class="admin-preview__menu-header">
            <strong>通知</strong>
            <var-button data-testid="mark-all-notifications-read" text type="primary" @click="markAllNotificationsRead">
              全部已读
            </var-button>
          </div>
          <var-list class="admin-preview__notification-list" finished>
            <template #finished />
            <var-cell
              v-for="item in notifications"
              :key="item.id"
              class="admin-preview__menu-cell"
              :class="{ 'admin-preview__menu-cell--unread': item.unread }"
              :title="item.title"
              :description="`${item.description} · ${item.time}`"
              ripple
              role="menuitem"
              tabindex="0"
              @click="openNotification(item)"
              @keydown.enter.prevent="openNotification(item)"
              @keydown.space.prevent="openNotification(item)"
            >
              <template #icon>
                <span class="admin-preview__notification-dot" :class="{ 'admin-preview__notification-dot--read': !item.unread }" />
              </template>
            </var-cell>
          </var-list>
          <var-cell
            class="admin-preview__menu-cell"
            title="查看全部"
            ripple
            role="menuitem"
            tabindex="0"
            @click="openNotification({ path: '/' })"
            @keydown.enter.prevent="openNotification({ path: '/' })"
            @keydown.space.prevent="openNotification({ path: '/' })"
          >
            <template #icon><VaIcon name="view" /></template>
          </var-cell>
        </div>
      </template>
    </var-menu>

    <var-menu
      v-if="currentUser"
      :key="`user-${headerToolMenuVersion}`"
      v-model:show="userMenuOpen"
      class="admin-preview__tool-popover"
      placement="bottom-end"
      :offset-y="8"
      @open="notificationMenuOpen = false"
    >
      <var-button class="admin-preview__tool-button" text :aria-expanded="userMenuOpen">
        <VaIcon name="user" :size="22" />
        <span class="admin-preview__tool-label admin-preview__tool-label--adaptive">{{ currentUser.name }}</span>
      </var-button>

      <template #menu>
        <div class="admin-preview__menu-panel admin-preview__user-menu" role="menu">
          <div class="admin-preview__user-summary">
            <strong>{{ currentUser.name }}</strong>
            <span>{{ currentUser.title || '管理员' }}</span>
          </div>
          <var-cell class="admin-preview__menu-cell" title="个人资料" description="查看当前登录信息" ripple role="menuitem" @click="openUserProfile">
            <template #icon><VaIcon name="user" /></template>
          </var-cell>
          <var-cell class="admin-preview__menu-cell" title="账号设置" description="登录、安全与偏好" ripple role="menuitem" @click="openAccountSettings">
            <template #icon><VaIcon name="settings" /></template>
          </var-cell>
          <var-cell class="admin-preview__menu-cell" title="偏好设置" description="打开右侧设置中心" ripple role="menuitem" @click="openPreferenceSettings">
            <template #icon><VaIcon name="theme" /></template>
          </var-cell>
          <var-divider />
          <var-cell class="admin-preview__menu-cell admin-preview__menu-cell--danger" title="退出登录" ripple role="menuitem" @click="logout">
            <template #icon><VaIcon name="logout" /></template>
          </var-cell>
        </div>
      </template>
    </var-menu>
  </div>
</template>

<style scoped>
.admin-preview__header-actions {
  display: flex;
  align-items: center;
  max-width: 100%;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: nowrap;
}

.admin-preview__tool-popover {
  position: relative;
  display: inline-flex;
}

.admin-preview__notification-button {
  position: relative;
}

.admin-preview__menu-panel {
  box-sizing: border-box;
  width: min(340px, calc(100vw - 24px));
  padding: 8px;
  color: var(--color-text);
  background: var(--color-body);
  border: 1px solid var(--va-admin-sidebar-border);
}

.admin-preview__menu-header,
.admin-preview__user-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  padding: 6px 8px 8px;
  gap: 12px;
}

.admin-preview__notification-list {
  max-height: min(320px, calc(100vh - 180px));
  overflow: auto;
}

.admin-preview__menu-cell {
  cursor: pointer;
  transition: background-color 0.18s ease;
}

.admin-preview__menu-cell:hover,
.admin-preview__menu-cell:focus-visible {
  background: var(--va-admin-menu-hover-bg);
}

.admin-preview__menu-cell--unread :deep(.var-cell__title) {
  font-weight: 600;
}

.admin-preview__menu-cell--danger {
  color: var(--color-danger);
}

.admin-preview__user-summary {
  align-items: flex-start;
  flex-direction: column;
  gap: 2px;
}

.admin-preview__user-summary span {
  color: var(--color-on-surface-variant);
  font-size: 13px;
}

.admin-preview__notification-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: var(--color-primary);
  border-radius: 50%;
}

.admin-preview__notification-dot--read {
  background: var(--color-outline-variant);
}

@media (max-width: 1180px) {
  .admin-preview__tool-label--adaptive {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .admin-preview__tool-button {
    min-width: 40px;
    padding-right: 8px;
    padding-left: 8px;
  }
}

@media (max-width: 640px) {
  .admin-preview__header-actions {
    gap: 4px;
    align-items: stretch;
    width: 100%;
    flex-direction: column !important;
  }

  .admin-preview__tool-button {
    justify-content: flex-start !important;
    width: 100%;
    min-width: 0;
    padding-right: 8px;
    padding-left: 8px;
  }

  .admin-preview__tool-popover {
    display: flex;
    width: 100%;
  }

  .admin-preview__menu-panel {
    width: 100%;
  }
}
</style>
