<script setup>
import { computed, inject, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  VaIcon,
} from 'vela-admin/components'
import {
  AdminLayout,
  AdminThemeGenerator,
} from 'vela-admin/layout'
import {
  useMenu,
} from 'vela-admin/menu'
import {
  applyAdminTheme,
  createAdminTheme,
  createSourceColorAdminTheme,
} from 'vela-admin/theme'
import {
  createTabsService,
} from 'vela-admin/tabs'

import velaLogo from './assets/vela-logo.svg'
import { mockAuthInjectionKey } from './mock-auth'

const route = useRoute()
const router = useRouter()
const menu = useMenu()
const auth = inject(mockAuthInjectionKey, null)
const tabsService = createTabsService({
  homePath: '/',
  fixedTabs: [{ path: '/', title: '控制台' }],
})
const persistedSettings = loadAdminSettings()
const layoutMode = ref(persistedSettings.layoutMode)
const sidebarWidth = ref(persistedSettings.sidebarWidth)
const scrollbar = ref(persistedSettings.scrollbar)
const themeMode = ref(persistedSettings.themeMode)
const themeBase = ref(persistedSettings.themeBase)
const sourceColor = ref(persistedSettings.sourceColor)
const customColors = ref(persistedSettings.customColors)
const themeGeneratorOpen = ref(false)
const themePreviewBarOpen = ref(false)
const previewThemePayload = ref(null)
const currentThemeSnapshot = ref(null)
const previewThemeVisible = ref(false)
const tabs = ref(tabsService.getTabs())
const tagsMaximized = ref(false)
const tabCacheVersions = ref({})
const tabScrollPositions = ref({})
const layoutFeatures = ref({
  tagsView: true,
  menuSearch: true,
  settings: true,
  ...persistedSettings.layoutFeatures,
})
const menus = computed(() => menu.getMenus())
const activePaths = computed(() => menu.getActivePaths(route.path))
const pageTitle = computed(() => String(route.meta?.title ?? ''))
const plainLayout = computed(() => route.meta?.layout === 'plain')
const currentUser = computed(() => auth?.session.value?.user ?? null)
const notificationMenuOpen = ref(false)
const userMenuOpen = ref(false)
const headerToolMenuVersion = ref(0)
const notifications = ref([
  { id: 1, title: '构建任务已完成', description: '示例工程最近一次构建通过', time: '2 分钟前', unread: true, path: '/' },
  { id: 2, title: '权限策略更新', description: 'mock admin 账号已同步最新权限码', time: '18 分钟前', unread: true, path: '/permission/button' },
  { id: 3, title: '主题预览已保存', description: '当前源颜色已加入本地偏好', time: '1 小时前', unread: false, path: '/' },
])
const resolvedThemeMode = computed(() => {
  if (themeMode.value !== 'system') {
    return themeMode.value
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
})
const resolvedThemeBase = computed(() => {
  const family = themeBase.value.startsWith('md2') ? 'md2' : 'md3'
  const mode = resolvedThemeMode.value === 'dark' ? 'Dark' : 'Light'

  return `${family}${mode}`
})
const currentTheme = computed(() => createSourceColorAdminTheme({
  sourceColor: sourceColor.value,
  themeBase: resolvedThemeBase.value,
  themeMode: resolvedThemeMode.value,
}))
const layoutModeText = computed(() => {
  const names = {
    side: '侧栏',
    top: '顶栏',
    mixed: '混合',
  }

  return names[layoutMode.value] ?? layoutMode.value
})
const unreadNotificationCount = computed(() => notifications.value.filter(item => item.unread).length)

applyAdminTheme(createThemeFromState())
syncCurrentTab()

function loadAdminSettings() {
  const defaults = {
    layoutMode: 'side',
    sidebarWidth: 272,
    scrollbar: 'thin',
    themeMode: 'light',
    themeBase: 'md3Light',
    sourceColor: '#6750A4',
    customColors: defaultCustomColors(),
    layoutFeatures: {
      tagsView: true,
      menuSearch: true,
      settings: true,
    },
  }

  try {
    const rawSettings = window.localStorage?.getItem('vela-admin-example:settings')
    const settings = rawSettings ? { ...defaults, ...JSON.parse(rawSettings) } : defaults

    return {
      ...settings,
      customColors: normalizeCustomColors(settings.customColors, settings.sourceColor),
    }
  } catch {
    return defaults
  }
}

function defaultCustomColors() {
  return []
}

function normalizeCustomColors(value, currentSourceColor = '#6750A4') {
  const presetColors = new Set(['#6750A4', '#2563EB', '#0F766E', '#7C3AED', '#EA580C', '#DC2626'])
  const customColorMap = new Map()

  for (const item of Array.isArray(value) ? value : []) {
    if (!item?.color || presetColors.has(item.color)) {
      continue
    }

    customColorMap.set(item.color, {
      color: item.color,
      label: item.label || `自定义 ${item.color}`,
      removable: item.removable !== false,
    })
  }

  if (currentSourceColor && !presetColors.has(currentSourceColor) && !customColorMap.has(currentSourceColor)) {
    customColorMap.set(currentSourceColor, {
      color: currentSourceColor,
      label: `自定义 ${currentSourceColor}`,
      removable: true,
    })
  }

  return Array.from(customColorMap.values())
}

function persistAdminSettings() {
  window.localStorage?.setItem('vela-admin-example:settings', JSON.stringify({
    layoutMode: layoutMode.value,
    sidebarWidth: sidebarWidth.value,
    scrollbar: scrollbar.value,
    themeMode: themeMode.value,
    themeBase: themeBase.value,
    sourceColor: sourceColor.value,
    customColors: customColors.value,
    layoutFeatures: layoutFeatures.value,
  }))
}

async function syncAdminSettingsToServer() {
  // 示例工程用异步 mock 保留服务器同步接入点，业务项目可替换为真实 API。
  await Promise.resolve()
}

function commitAdminSettings() {
  persistAdminSettings()
  syncAdminSettingsToServer()
}

function applyCurrentTheme() {
  applyAdminTheme(createThemeFromState())
}

function createThemeFromState(next = {}) {
  const nextSourceColor = next.sourceColor ?? sourceColor.value
  const nextThemeBase = next.themeBase ?? themeBase.value
  const nextThemeMode = resolveThemeMode(next.themeMode ?? themeMode.value)
  const family = nextThemeBase.startsWith('md2') ? 'md2' : 'md3'
  const base = `${family}${nextThemeMode === 'dark' ? 'Dark' : 'Light'}`

  return createSourceColorAdminTheme({
    sourceColor: nextSourceColor,
    themeBase: base,
    themeMode: nextThemeMode,
  })
}

function resolveThemeMode(mode) {
  if (mode !== 'system') {
    return mode
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function syncThemePayload(payload) {
  sourceColor.value = payload.sourceColor
  themeBase.value = payload.themeBase
  themeMode.value = payload.themeMode
  commitAdminSettings()
}

function previewGeneratedTheme(payload) {
  currentThemeSnapshot.value = createThemeFromState()
  previewThemePayload.value = payload
  previewThemeVisible.value = true
  themeGeneratorOpen.value = false
  themePreviewBarOpen.value = true
  applyAdminTheme(payload.theme)
}

function applyGeneratedTheme(payload) {
  syncThemePayload(payload)
  applyAdminTheme(payload.theme)
  themeGeneratorOpen.value = false
  themePreviewBarOpen.value = false
  previewThemePayload.value = null
  currentThemeSnapshot.value = null
}

function closeThemeGenerator() {
  themeGeneratorOpen.value = false
  applyCurrentTheme()
}

function showCurrentThemePreview() {
  if (!currentThemeSnapshot.value) {
    return
  }

  previewThemeVisible.value = false
  applyAdminTheme(currentThemeSnapshot.value)
}

function showGeneratedThemePreview() {
  if (!previewThemePayload.value) {
    return
  }

  previewThemeVisible.value = true
  applyAdminTheme(previewThemePayload.value.theme)
}

function cancelGeneratedThemePreview() {
  if (currentThemeSnapshot.value) {
    applyAdminTheme(currentThemeSnapshot.value)
  }

  themePreviewBarOpen.value = false
  previewThemeVisible.value = false
  currentThemeSnapshot.value = null
  previewThemePayload.value = null
  themeGeneratorOpen.value = true
}

function openThemeGenerator() {
  if (themePreviewBarOpen.value) {
    cancelGeneratedThemePreview()
    return
  }

  themeGeneratorOpen.value = true
}

function applyPreviewedTheme() {
  if (!previewThemePayload.value) {
    return
  }

  applyGeneratedTheme(previewThemePayload.value)
}

function resetTheme() {
  sourceColor.value = '#6750A4'
  themeMode.value = 'light'
  themeBase.value = 'md3Light'
  applyAdminTheme(createAdminTheme())
  commitAdminSettings()
}

function updateCustomColors(value) {
  customColors.value = normalizeCustomColors(value, sourceColor.value)
  commitAdminSettings()
}

function updateThemeColor(color) {
  sourceColor.value = color
  applyAdminTheme(createThemeFromState({ sourceColor: color }))
  commitAdminSettings()
}

function syncTabs() {
  tabs.value = tabsService.getTabs()
}

function getRouteCacheKey(viewRoute) {
  return `${viewRoute.path}:${tabCacheVersions.value[viewRoute.path] ?? 0}`
}

function getMainScroller() {
  return document.getElementById('va-admin-main')
}

function saveTabScroll(path = route.path) {
  if (!layoutFeatures.value.tagsView) {
    return
  }

  const scroller = getMainScroller()
  if (!scroller) {
    return
  }

  tabScrollPositions.value = {
    ...tabScrollPositions.value,
    [path]: {
      top: scroller.scrollTop,
      left: scroller.scrollLeft,
    },
  }
}

function restoreTabScroll(path = route.path) {
  if (!layoutFeatures.value.tagsView) {
    return
  }

  nextTick(() => {
    const run = () => {
      const scroller = getMainScroller()
      if (!scroller) {
        return
      }

      const position = tabScrollPositions.value[path]
      scroller.scrollTop = position?.top ?? 0
      scroller.scrollLeft = position?.left ?? 0
    }

    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(run)
      return
    }

    run()
  })
}

function bumpTabCacheVersion(path) {
  tabCacheVersions.value = {
    ...tabCacheVersions.value,
    [path]: (tabCacheVersions.value[path] ?? 0) + 1,
  }
}

function clearTabsState(paths) {
  const nextScrollPositions = { ...tabScrollPositions.value }

  paths.forEach((path) => {
    bumpTabCacheVersion(path)
    delete nextScrollPositions[path]
  })

  tabScrollPositions.value = nextScrollPositions
}

function syncCurrentTab() {
  if (plainLayout.value) {
    syncTabs()
    return
  }

  tabsService.addTab({
    path: route.path,
    title: pageTitle.value || route.path,
  })
  syncTabs()
}

function closeTab(path) {
  const previousTabs = tabsService.getTabs()
  const closingCurrentTab = path === route.path
  const nextPath = closingCurrentTab ? resolveNextTabPathAfterClose(previousTabs, path) : ''
  const removed = tabsService.closeCurrent(path)

  if (removed) {
    clearTabsState([removed.path])
  }
  syncTabs()

  if (closingCurrentTab && nextPath !== route.path) {
    router.push(nextPath)
  }
}

function resolveNextTabPathAfterClose(previousTabs, closingPath) {
  const closingIndex = previousTabs.findIndex((tab) => tab.path === closingPath)

  if (closingIndex > 0) {
    return previousTabs[closingIndex - 1].path
  }

  return '/'
}

function closeOtherTabs(path) {
  const removed = tabsService.closeOthers(path)
  clearTabsState(removed.map(tab => tab.path))
  syncTabs()
  navigateAfterTabsRemoved(removed, path)
}

function closeLeftTabs(path) {
  const removed = tabsService.closeLeft(path)
  clearTabsState(removed.map(tab => tab.path))
  syncTabs()
  navigateAfterTabsRemoved(removed, path)
}

function closeRightTabs(path) {
  const removed = tabsService.closeRight(path)
  clearTabsState(removed.map(tab => tab.path))
  syncTabs()
  navigateAfterTabsRemoved(removed, path)
}

function closeAllTabs() {
  const previousTabs = tabsService.getTabs()
  const removed = tabsService.closeAll()
  clearTabsState(removed.map(tab => tab.path))
  syncTabs()
  navigateAfterTabsRemoved(removed, resolveFallbackPathAfterBatchClose(previousTabs, removed, route.path))
}

function navigateAfterTabsRemoved(removed, fallbackPath) {
  if (!removed.some(tab => tab.path === route.path) || !fallbackPath || fallbackPath === route.path) {
    return
  }

  router.push(fallbackPath)
}

function resolveFallbackPathAfterBatchClose(previousTabs, removedTabs, activePath) {
  const removedPaths = new Set(removedTabs.map(tab => tab.path))
  const activeIndex = previousTabs.findIndex(tab => tab.path === activePath)

  for (let index = activeIndex - 1; index >= 0; index -= 1) {
    const tab = previousTabs[index]
    if (!removedPaths.has(tab.path) && (tab.fixed || tab.closable === false)) {
      return tab.path
    }
  }

  for (let index = activeIndex - 1; index >= 0; index -= 1) {
    const tab = previousTabs[index]
    if (!removedPaths.has(tab.path)) {
      return tab.path
    }
  }

  for (let index = activeIndex + 1; index < previousTabs.length; index += 1) {
    const tab = previousTabs[index]
    if (!removedPaths.has(tab.path)) {
      return tab.path
    }
  }

  return '/'
}

function pinTab(path) {
  const tab = tabs.value.find((item) => item.path === path)
  if (!tab || path === '/') {
    return
  }

  tabsService.addTab({
    ...tab,
    fixed: !tab.fixed,
    closable: Boolean(tab.fixed),
  })
  syncTabs()
}

function maximizeTabs() {
  tagsMaximized.value = true
}

function restoreTabs() {
  tagsMaximized.value = false
}

function refreshTab(path = route.path) {
  bumpTabCacheVersion(path)
  delete tabScrollPositions.value[path]
  syncCurrentTab()
  restoreTabScroll(path)
}

function updateThemeBase(base) {
  themeBase.value = base
  applyAdminTheme(createThemeFromState({ themeBase: base }))
  commitAdminSettings()
}

function updateThemeMode(mode) {
  themeMode.value = mode
  applyAdminTheme(createThemeFromState({ themeMode: mode }))
  commitAdminSettings()
}

function toggleThemeMode(event) {
  const nextMode = themeMode.value === 'light' ? 'dark' : 'light'
  runThemeModeTransition(event, () => updateThemeMode(nextMode))
}

function runThemeModeTransition(event, update) {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduceMotion) {
    update()
    return
  }

  const target = event.currentTarget
  const rect = target instanceof HTMLElement ? target.getBoundingClientRect() : null
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
  const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  )
  const transition = document.startViewTransition(update)

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 420,
        easing: 'cubic-bezier(.2, 0, 0, 1)',
        pseudoElement: '::view-transition-new(root)',
      },
    )
  })
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
  openThemeGenerator()
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

watch(() => route.path, (nextPath, previousPath) => {
  saveTabScroll(previousPath)
  syncCurrentTab()
  restoreTabScroll(nextPath)
})
watch(layoutMode, commitAdminSettings)
watch(sidebarWidth, commitAdminSettings)
watch(scrollbar, commitAdminSettings)
watch(layoutFeatures, commitAdminSettings, { deep: true })
</script>

<template>
  <router-view v-if="plainLayout" />

  <AdminLayout
    v-else
    app-name="Vela Admin"
    :menus="menus"
    :active-paths="activePaths"
    :current-path="route.path"
    :page-title="pageTitle"
    :mode="layoutMode"
    :sidebar-width="sidebarWidth"
    :scrollbar="scrollbar"
    :tags="tabs"
    :tags-maximized="tagsMaximized"
    :layout-features="layoutFeatures"
    :theme-base="themeBase"
    :theme-mode="themeMode"
    :source-color="sourceColor"
    :custom-colors="customColors"
    @close-tab="closeTab"
    @close-other-tabs="closeOtherTabs"
    @close-left-tabs="closeLeftTabs"
    @close-right-tabs="closeRightTabs"
    @close-all-tabs="closeAllTabs"
    @refresh-tab="refreshTab"
    @pin-tab="pinTab"
    @maximize-tabs="maximizeTabs"
    @restore-tabs="restoreTabs"
    @close-header-tools="closeHeaderToolMenus"
    @update:mode="layoutMode = $event"
    @update:sidebar-width="sidebarWidth = $event"
    @update:scrollbar="scrollbar = $event"
    @update:tags-view="layoutFeatures.tagsView = $event"
    @update:menu-search="layoutFeatures.menuSearch = $event"
    @update:theme-base="updateThemeBase"
    @update:theme-mode="updateThemeMode"
    @update:source-color="updateThemeColor"
    @open-theme-generator="openThemeGenerator"
  >
    <template #logo>
      <span class="admin-preview__brand">
        <img class="admin-preview__brand-logo" :src="velaLogo" alt="Vela Admin" />
        <span class="admin-preview__brand-name">Vela Admin</span>
      </span>
    </template>

    <template #logoCollapsed>
      <img class="admin-preview__brand-logo admin-preview__brand-logo--solo" :src="velaLogo" alt="Vela Admin" />
    </template>

    <template #headerTools>
      <div class="admin-preview__header-actions">
        <var-button class="admin-preview__tool-button" text @click="layoutMode = layoutMode === 'side' ? 'top' : layoutMode === 'top' ? 'mixed' : 'side'">
          {{ layoutModeText }}
        </var-button>
        <var-button class="admin-preview__tool-button" text @click="toggleThemeMode($event)">
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
                <var-button text type="primary" @click="markAllNotificationsRead">全部已读</var-button>
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
          <var-button
            class="admin-preview__tool-button"
            text
            :aria-expanded="userMenuOpen"
          >
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

    <router-view v-slot="{ Component, route: viewRoute }">
      <KeepAlive v-if="layoutFeatures.tagsView" :max="20">
        <component
          :is="Component"
          :key="getRouteCacheKey(viewRoute)"
          :source-color="sourceColor"
          :theme-base="themeBase"
          :theme-mode="themeMode"
          :layout-mode="layoutMode"
          @update:source-color="updateThemeColor"
          @apply-theme="applyCurrentTheme"
          @reset-theme="resetTheme"
        />
      </KeepAlive>
      <component
        :is="Component"
        v-else
        :key="viewRoute.fullPath"
        :source-color="sourceColor"
        :theme-base="themeBase"
        :theme-mode="themeMode"
        :layout-mode="layoutMode"
        @update:source-color="updateThemeColor"
        @apply-theme="applyCurrentTheme"
        @reset-theme="resetTheme"
      />
    </router-view>
  </AdminLayout>

  <AdminThemeGenerator
    v-if="!plainLayout"
    :open="themeGeneratorOpen"
    :source-color="sourceColor"
    :theme-base="themeBase"
    :theme-mode="resolvedThemeMode"
    :custom-colors="customColors"
    developer-export
    @close="closeThemeGenerator"
    @update:custom-colors="updateCustomColors"
    @preview="previewGeneratedTheme"
    @apply="applyGeneratedTheme"
  />

  <div
    v-if="themePreviewBarOpen"
    class="admin-preview__theme-preview-bar"
    :class="{
      'admin-preview__theme-preview-bar--md3': themeBase.startsWith('md3'),
      'admin-preview__theme-preview-bar--md2': themeBase.startsWith('md2'),
    }"
    role="region"
    aria-label="主题预览"
  >
    <span class="admin-preview__theme-preview-title">主题预览</span>
    <var-button
      class="admin-preview__theme-preview-action"
      :class="{ 'admin-preview__theme-preview-action--active': !previewThemeVisible }"
      text
      @click="showCurrentThemePreview"
    >
      当前主题
    </var-button>
    <var-button
      class="admin-preview__theme-preview-action"
      :class="{ 'admin-preview__theme-preview-action--active': previewThemeVisible }"
      text
      @click="showGeneratedThemePreview"
    >
      预览主题
    </var-button>
    <var-button class="admin-preview__theme-preview-action" text @click="cancelGeneratedThemePreview">
      取消预览
    </var-button>
    <var-button class="admin-preview__theme-preview-apply" type="primary" @click="applyPreviewedTheme">
      应用主题
    </var-button>
  </div>
</template>

<style scoped>
:global(html),
:global(body),
:global(#app) {
  max-width: 100%;
  overflow-x: hidden;
}

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

.admin-preview__brand {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.admin-preview__brand-logo {
  display: block;
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.admin-preview__brand-logo--solo {
  flex: 0 0 auto;
}

.admin-preview__brand-name {
  min-width: 0;
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-preview__theme-preview-bar {
  position: fixed;
  bottom: 18px;
  left: 50%;
  z-index: 2400;
  display: inline-flex;
  align-items: center;
  max-width: calc(100vw - 24px);
  min-height: 44px;
  padding: 5px 10px 5px 6px;
  color: var(--color-text);
  background: color-mix(in srgb, var(--color-body) 94%, transparent);
  border: 1px solid var(--va-admin-sidebar-border);
  border-radius: 18px;
  box-shadow: 0 8px 28px rgb(0 0 0 / 18%);
  transform: translateX(-50%);
  backdrop-filter: blur(10px);
  gap: 4px;
}

.admin-preview__theme-preview-bar--md2 {
  padding-right: 12px;
  border-radius: 6px;
}

.admin-preview__theme-preview-bar--md3 {
  border-radius: 18px;
}

.admin-preview__theme-preview-title {
  padding: 0 10px;
  color: var(--color-on-surface-variant);
  font-size: 12px;
  white-space: nowrap;
}

.admin-preview__theme-preview-action,
.admin-preview__theme-preview-apply {
  min-width: 0;
  height: 32px;
  white-space: nowrap;
}

.admin-preview__theme-preview-action--active {
  color: var(--color-primary);
  background: var(--va-admin-menu-active-bg);
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
  .admin-preview__theme-preview-bar {
    right: 12px;
    left: 12px;
    justify-content: center;
    width: auto;
    transform: none;
  }

  .admin-preview__theme-preview-title {
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

  .admin-preview__theme-preview-action,
  .admin-preview__theme-preview-apply {
    flex: 1 1 0;
    padding-right: 6px;
    padding-left: 6px;
  }

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

:global(::view-transition-old(root)),
:global(::view-transition-new(root)) {
  animation: none;
  mix-blend-mode: normal;
}

@media (prefers-reduced-motion: reduce) {
  :global(::view-transition-old(root)),
  :global(::view-transition-new(root)) {
    animation: none;
  }
}

</style>
