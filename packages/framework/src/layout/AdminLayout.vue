<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue'
import { routeLocationKey, routerKey } from 'vue-router'

import VaIcon from '../icons/VaIcon.vue'
import { defaultAdminConfig } from '../settings/default-settings'
import type { AdminLayoutMode, AdminThemeMode } from '../app/define-admin-config'
import type { AdminMenuItem } from '../menu/create-menu-service'
import type { AdminTab } from '../tabs/create-tabs-service'
import type { AdminThemeBase } from '../theme/create-theme'
import type { AdminScrollbarMode } from '../theme/tokens'
import AdminMenuSearch from './components/AdminMenuSearch.vue'
import AdminSettingsDrawer from './components/AdminSettingsDrawer.vue'
import type { ThemeColorChip } from './components/AdminThemeGenerator.vue'
import type { AdminLayoutFeatures } from './layout-features'
import MixedLayout from './MixedLayout.vue'
import SideLayout from './SideLayout.vue'
import TopLayout from './TopLayout.vue'

const props = withDefaults(defineProps<{
  appName?: string
  menus: AdminMenuItem[]
  activePaths?: string[]
  currentPath?: string
  pageTitle?: string
  mode?: AdminLayoutMode
  mobileBreakpoint?: number
  sidebarWidth?: number
  sidebarCollapsedWidth?: number
  sidebarIconSize?: number
  sidebarCollapsedIconSize?: number
  expandedParentBackground?: boolean
  scrollbar?: AdminScrollbarMode
  tags?: AdminTab[]
  tagsMaximized?: boolean
  layoutFeatures?: Partial<AdminLayoutFeatures>
  themeBase?: AdminThemeBase
  themeMode?: AdminThemeMode
  sourceColor?: string
  customColors?: ThemeColorChip[]
}>(), {
  appName: 'Vela Admin',
  activePaths: () => [],
  currentPath: '',
  pageTitle: '',
  mode: 'side',
  mobileBreakpoint: 768,
  sidebarWidth: defaultAdminConfig.layout.sidebarWidth,
  sidebarCollapsedWidth: defaultAdminConfig.layout.sidebarCollapsedWidth,
  sidebarIconSize: defaultAdminConfig.layout.sidebarIconSize,
  sidebarCollapsedIconSize: defaultAdminConfig.layout.sidebarCollapsedIconSize,
  expandedParentBackground: defaultAdminConfig.layout.expandedParentBackground,
  scrollbar: defaultAdminConfig.layout.scrollbar,
  tags: () => [],
  tagsMaximized: false,
  layoutFeatures: () => ({
    tagsView: defaultAdminConfig.layout.tagsView,
    menuSearch: defaultAdminConfig.layout.menuSearch,
    settings: defaultAdminConfig.layout.settings,
  }),
  themeBase: defaultAdminConfig.theme.base,
  themeMode: defaultAdminConfig.theme.mode,
  sourceColor: defaultAdminConfig.theme.sourceColor,
  customColors: () => [],
})

const emit = defineEmits<{
  navigate: [path: string]
  closeTab: [path: string]
  closeOtherTabs: [path: string]
  closeLeftTabs: [path: string]
  closeRightTabs: [path: string]
  closeAllTabs: []
  refreshTab: [path: string]
  pinTab: [path: string]
  reorderTab: [path: string, targetPath: string]
  maximizeTabs: []
  restoreTabs: []
  closeHeaderTools: []
  'update:mode': [mode: AdminLayoutMode]
  'update:sidebarWidth': [value: number]
  'update:sidebarCollapsedWidth': [value: number]
  'update:sidebarCollapsedIconSize': [value: number]
  'update:expandedParentBackground': [value: boolean]
  'update:scrollbar': [value: AdminScrollbarMode]
  'update:tagsView': [value: boolean]
  'update:menuSearch': [value: boolean]
  'update:themeBase': [value: AdminThemeBase]
  'update:themeMode': [value: AdminThemeMode]
  'update:sourceColor': [value: string]
  openThemeGenerator: []
}>()

const route = inject(routeLocationKey, null)
const router = inject(routerKey, null)
const sidebarCollapsed = ref(false)
const drawerOpen = ref(false)
const settingsOpen = ref(false)
const mobile = ref(false)
const mediaQuery = computed(() => `(max-width: ${props.mobileBreakpoint}px)`)
let mediaList: MediaQueryList | null = null

function syncMobile(matches: boolean) {
  mobile.value = matches
  if (!matches) {
    drawerOpen.value = false
  }
}

function bindMediaQuery() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return
  }

  mediaList = window.matchMedia(mediaQuery.value)
  syncMobile(mediaList.matches)
  mediaList.addEventListener('change', handleMediaChange)
}

function handleMediaChange(event: MediaQueryListEvent) {
  syncMobile(event.matches)
}

function toggleSidebar() {
  if (mobile.value) {
    drawerOpen.value = !drawerOpen.value
    return
  }

  sidebarCollapsed.value = !sidebarCollapsed.value
}

const layoutComponent = computed(() => {
  if (props.mode === 'top') {
    return TopLayout
  }

  if (props.mode === 'mixed') {
    return MixedLayout
  }

  return SideLayout
})

const resolvedFeatures = computed<AdminLayoutFeatures>(() => ({
  tagsView: props.layoutFeatures?.tagsView ?? defaultAdminConfig.layout.tagsView,
  menuSearch: props.layoutFeatures?.menuSearch ?? defaultAdminConfig.layout.menuSearch,
  settings: props.layoutFeatures?.settings ?? defaultAdminConfig.layout.settings,
}))

const resolvedTags = computed<AdminTab[]>(() => {
  if (props.tags.length > 0) {
    return props.tags
  }

  if (!props.currentPath) {
    return []
  }

  return [
    {
      path: props.currentPath,
      title: props.pageTitle || props.currentPath,
      fixed: props.currentPath === defaultAdminConfig.homePath,
      closable: props.currentPath !== defaultAdminConfig.homePath,
    },
  ]
})

function navigate(path: string) {
  emit('navigate', path)
  router?.push(path)
}

function openThemeGenerator() {
  emit('openThemeGenerator')
}

bindMediaQuery()

watch(() => route?.fullPath, () => {
  drawerOpen.value = false
})

onBeforeUnmount(() => {
  mediaList?.removeEventListener('change', handleMediaChange)
})
</script>

<template>
  <component
    :is="layoutComponent"
    :app-name="appName"
    :menus="menus"
    :active-paths="activePaths"
    :current-path="currentPath"
    :page-title="pageTitle"
    :sidebar-collapsed="sidebarCollapsed"
    :drawer-open="drawerOpen"
    :mobile="mobile"
    :sidebar-width="sidebarWidth"
    :sidebar-collapsed-width="sidebarCollapsedWidth"
    :sidebar-icon-size="sidebarIconSize"
    :sidebar-collapsed-icon-size="sidebarCollapsedIconSize"
    :scrollbar="scrollbar"
    :tags="resolvedTags"
    :tags-maximized="tagsMaximized"
    :tags-view="resolvedFeatures.tagsView"
    @toggle-sidebar="toggleSidebar"
    @close-mobile-tools="emit('closeHeaderTools')"
    @close-drawer="drawerOpen = false"
    @navigate="navigate"
    @close-tab="emit('closeTab', $event)"
    @close-other-tabs="emit('closeOtherTabs', $event)"
    @close-left-tabs="emit('closeLeftTabs', $event)"
    @close-right-tabs="emit('closeRightTabs', $event)"
    @close-all-tabs="emit('closeAllTabs')"
    @refresh-tab="emit('refreshTab', $event)"
    @pin-tab="emit('pinTab', $event)"
    @reorder-tab="(path, targetPath) => emit('reorderTab', path, targetPath)"
    @maximize-tabs="emit('maximizeTabs')"
    @restore-tabs="emit('restoreTabs')"
  >
    <template #logo>
      <slot name="logo">{{ appName }}</slot>
    </template>
    <template #logoCollapsed>
      <slot name="logoCollapsed">{{ appName.slice(0, 1) }}</slot>
    </template>
    <template #headerTools>
      <AdminMenuSearch
        v-if="resolvedFeatures.menuSearch"
        :menus="menus"
        @navigate="navigate"
      />
      <slot name="headerTools" />
      <var-button
        v-if="resolvedFeatures.settings"
        class="va-admin-layout__tool-button"
        text
        aria-label="打开设置"
        data-testid="admin-settings-button"
        @click="settingsOpen = true"
      >
        <VaIcon name="settings" :size="22" />
        <span class="va-admin-layout__tool-label--adaptive">个性设置</span>
      </var-button>
    </template>
    <template #footer>
      <slot name="footer" />
    </template>
    <slot />
  </component>

  <AdminSettingsDrawer
    :open="settingsOpen"
    :mode="mode"
    :sidebar-width="sidebarWidth"
    :sidebar-collapsed-width="sidebarCollapsedWidth"
    :sidebar-collapsed-icon-size="sidebarCollapsedIconSize"
    :expanded-parent-background="expandedParentBackground"
    :scrollbar="scrollbar"
    :tags-view="resolvedFeatures.tagsView"
    :menu-search="resolvedFeatures.menuSearch"
    :theme-base="themeBase"
    :theme-mode="themeMode"
    :source-color="sourceColor"
    :custom-colors="customColors"
    @close="settingsOpen = false"
    @update:mode="emit('update:mode', $event)"
    @update:sidebar-width="emit('update:sidebarWidth', $event)"
    @update:sidebar-collapsed-width="emit('update:sidebarCollapsedWidth', $event)"
    @update:sidebar-collapsed-icon-size="emit('update:sidebarCollapsedIconSize', $event)"
    @update:expanded-parent-background="emit('update:expandedParentBackground', $event)"
    @update:scrollbar="emit('update:scrollbar', $event)"
    @update:tags-view="emit('update:tagsView', $event)"
    @update:menu-search="emit('update:menuSearch', $event)"
    @update:theme-base="emit('update:themeBase', $event)"
    @update:theme-mode="emit('update:themeMode', $event)"
    @update:source-color="emit('update:sourceColor', $event)"
    @open-theme-generator="openThemeGenerator"
  />
</template>

<style scoped>
.va-admin-layout__tool-label--adaptive {
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
</style>
