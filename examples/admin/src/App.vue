<script setup>
import { computed, inject, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAdminSettings } from 'vela-admin/app'
import {
  AdminLayout,
  AdminThemeGenerator,
  AdminThemePreviewBar,
} from 'vela-admin/layout'
import { useMenu } from 'vela-admin/menu'
import { permissionInjectionKey } from 'vela-admin/permission'
import { useAdminTabs } from 'vela-admin/tabs'
import { useAdminTheme, useThemePreview } from 'vela-admin/theme'

import AppHeaderTools from './components/AppHeaderTools.vue'
import velaLogo from './assets/vela-logo.svg'

const route = useRoute()
const router = useRouter()
const menu = useMenu()
const permission = inject(permissionInjectionKey, null)
const settings = useAdminSettings()
const theme = useAdminTheme({ settings })
const preview = useThemePreview({ theme })
const tabs = useAdminTabs({ router, route, settings, permission })
const headerToolsRef = ref(null)

const adminSettings = computed(() => settings.settings.value)
const layoutFeatures = computed(() => ({
  tagsView: adminSettings.value.layout.tagsView,
  menuSearch: adminSettings.value.layout.menuSearch,
  settings: adminSettings.value.layout.settings,
}))
const menus = computed(() => menu.getMenus())
const activePaths = computed(() => menu.getActivePaths(route.path))
const pageTitle = computed(() => String(route.meta?.title ?? ''))
const plainLayout = computed(() => route.meta?.layout === 'plain')

function updateLayout(layout) {
  settings.updateSettings({ layout })
}

function closeHeaderToolMenus() {
  headerToolsRef.value?.closeMenus()
}
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
    :mode="adminSettings.layout.mode"
    :sidebar-width="adminSettings.layout.sidebarWidth"
    :scrollbar="adminSettings.layout.scrollbar"
    :tags="tabs.tabs.value"
    :tags-maximized="tabs.maximized.value"
    :layout-features="layoutFeatures"
    :theme-base="theme.themeBase.value"
    :theme-mode="theme.themeMode.value"
    :source-color="theme.sourceColor.value"
    :custom-colors="theme.customColors.value"
    @close-tab="tabs.closeTab"
    @close-other-tabs="tabs.closeOtherTabs"
    @close-left-tabs="tabs.closeLeftTabs"
    @close-right-tabs="tabs.closeRightTabs"
    @close-all-tabs="tabs.closeAllTabs"
    @refresh-tab="tabs.refreshTab"
    @pin-tab="tabs.pinTab"
    @reorder-tab="tabs.reorderTab"
    @maximize-tabs="tabs.maximize"
    @restore-tabs="tabs.restore"
    @close-header-tools="closeHeaderToolMenus"
    @update:mode="updateLayout({ mode: $event })"
    @update:sidebar-width="updateLayout({ sidebarWidth: $event })"
    @update:scrollbar="updateLayout({ scrollbar: $event })"
    @update:tags-view="updateLayout({ tagsView: $event })"
    @update:menu-search="updateLayout({ menuSearch: $event })"
    @update:theme-base="theme.updateBase"
    @update:theme-mode="(mode, target) => theme.updateMode(mode, target)"
    @update:source-color="theme.updateSourceColor"
    @open-theme-generator="preview.openGenerator"
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
      <AppHeaderTools
        ref="headerToolsRef"
        :layout-mode="adminSettings.layout.mode"
        :theme-mode="theme.themeMode.value"
        @update:layout-mode="updateLayout({ mode: $event })"
        @toggle-theme-mode="theme.toggleMode"
        @open-theme-generator="preview.openGenerator"
      />
    </template>

    <router-view v-slot="{ Component, route: viewRoute }">
      <KeepAlive v-if="layoutFeatures.tagsView" :max="20">
        <component
          :is="Component"
          :key="tabs.getRouteCacheKey(viewRoute)"
          :source-color="theme.sourceColor.value"
          :theme-base="theme.themeBase.value"
          :theme-mode="theme.themeMode.value"
          :layout-mode="adminSettings.layout.mode"
          @update:source-color="theme.updateSourceColor"
          @apply-theme="theme.applyCurrent"
          @reset-theme="theme.reset"
        />
      </KeepAlive>
      <component
        :is="Component"
        v-else
        :key="viewRoute.fullPath"
        :source-color="theme.sourceColor.value"
        :theme-base="theme.themeBase.value"
        :theme-mode="theme.themeMode.value"
        :layout-mode="adminSettings.layout.mode"
        @update:source-color="theme.updateSourceColor"
        @apply-theme="theme.applyCurrent"
        @reset-theme="theme.reset"
      />
    </router-view>
  </AdminLayout>

  <AdminThemeGenerator
    v-if="!plainLayout"
    :open="preview.generatorOpen.value"
    :source-color="theme.sourceColor.value"
    :theme-base="theme.themeBase.value"
    :theme-mode="theme.resolvedThemeMode.value"
    :custom-colors="theme.customColors.value"
    developer-export
    @close="preview.closeGenerator"
    @update:custom-colors="theme.updateCustomColors"
    @preview="preview.preview"
    @apply="preview.apply"
  />

  <AdminThemePreviewBar
    :open="preview.barOpen.value"
    :theme-base="theme.themeBase.value"
    :preview-visible="preview.previewVisible.value"
    @show-current="preview.showCurrent"
    @show-generated="preview.showGenerated"
    @cancel="preview.cancel"
    @apply="preview.apply"
  />
</template>

<style scoped>
:global(html),
:global(body),
:global(#app) {
  max-width: 100%;
  overflow-x: hidden;
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
</style>
