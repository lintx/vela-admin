<script setup lang="ts">
import { computed } from 'vue'

import type { AdminMenuItem } from '../menu/create-menu-service'
import type { AdminTab } from '../tabs/create-tabs-service'
import type { AdminScrollbarMode } from '../theme/tokens'
import AdminDrawerSidebar from './components/AdminDrawerSidebar.vue'
import AdminHeader from './components/AdminHeader.vue'
import AdminMain from './components/AdminMain.vue'
import AdminSidebar from './components/AdminSidebar.vue'
import AdminTagsView from './components/AdminTagsView.vue'
import AdminTopMenu from './components/AdminTopMenu.vue'

const props = withDefaults(defineProps<{
  appName?: string
  menus: AdminMenuItem[]
  activePaths?: string[]
  currentPath?: string
  pageTitle?: string
  sidebarCollapsed?: boolean
  drawerOpen?: boolean
  mobile?: boolean
  sidebarWidth?: number
  sidebarCollapsedWidth?: number
  sidebarIconSize?: number
  sidebarCollapsedIconSize?: number
  scrollbar?: AdminScrollbarMode
  tags?: AdminTab[]
  tagsView?: boolean
  tagsMaximized?: boolean
}>(), {
  appName: 'Vela Admin',
  activePaths: () => [],
  currentPath: '',
  pageTitle: '',
  sidebarCollapsed: false,
  drawerOpen: false,
  mobile: false,
  sidebarWidth: 272,
  sidebarCollapsedWidth: 56,
  sidebarIconSize: 22,
  sidebarCollapsedIconSize: 26,
  scrollbar: 'thin',
  tags: () => [],
  tagsView: true,
  tagsMaximized: false,
})

const emit = defineEmits<{
  toggleSidebar: []
  closeMobileTools: []
  closeDrawer: []
  navigate: [path: string]
  closeTab: [path: string]
  closeOtherTabs: [path: string]
  closeLeftTabs: [path: string]
  closeRightTabs: [path: string]
  closeAllTabs: []
  refreshTab: [path: string]
  pinTab: [path: string]
  maximizeTabs: []
  restoreTabs: []
}>()

const mixedSidebarMenus = computed(() => {
  const activeRoot = props.menus.find((menu) => (
    props.currentPath === menu.path
    || props.activePaths.includes(menu.path)
    || props.currentPath.startsWith(`${menu.path}/`)
  ))

  if (!activeRoot) {
    return []
  }

  if (activeRoot.children.length === 0) {
    return [activeRoot]
  }

  return activeRoot.children
})
</script>

<template>
  <div
    class="va-admin-layout va-admin-layout--mixed"
    :class="[
      `va-admin-layout--scrollbar-${scrollbar}`,
      { 'va-admin-layout--mobile': mobile, 'va-admin-layout--tags-maximized': tagsMaximized },
    ]"
  >
    <a class="va-admin-layout__skip-link" href="#va-admin-main">跳到主内容</a>

    <div v-if="!mobile && !tagsMaximized" class="va-admin-layout__desktop-sidebar">
      <AdminSidebar
        :menus="mixedSidebarMenus"
        :active-paths="activePaths"
        :current-path="currentPath"
        :collapsed="sidebarCollapsed"
        :width="sidebarWidth"
        :collapsed-width="sidebarCollapsedWidth"
        :icon-size="sidebarIconSize"
        :collapsed-icon-size="sidebarCollapsedIconSize"
        @navigate="emit('navigate', $event)"
      >
        <template #brand>
          <slot name="logo">{{ appName }}</slot>
        </template>
        <template #brandCollapsed>
          <slot name="logoCollapsed">{{ appName.slice(0, 1) }}</slot>
        </template>
      </AdminSidebar>
    </div>

    <section class="va-admin-layout__workspace">
      <AdminHeader
        v-if="!tagsMaximized"
        :app-name="appName"
        page-title=""
        :sidebar-collapsed="sidebarCollapsed"
        :mobile="mobile"
        :show-sidebar-toggle="true"
        :show-app-name="false"
        @toggle-sidebar="emit('toggleSidebar')"
        @close-mobile-tools="emit('closeMobileTools')"
      >
        <template #brandCollapsed>
          <slot name="logoCollapsed">{{ appName.slice(0, 1) }}</slot>
        </template>
        <template #navigation>
          <AdminTopMenu
            v-if="!mobile"
            :menus="menus"
            :active-paths="activePaths"
            :current-path="currentPath"
            :flyout="false"
            @navigate="emit('navigate', $event)"
          />
        </template>
        <template #tools>
          <slot name="headerTools" />
        </template>
      </AdminHeader>

      <AdminTagsView
        v-if="tagsView"
        :tabs="tags"
        :current-path="currentPath"
        :maximized="tagsMaximized"
        :mobile="mobile"
        @navigate="emit('navigate', $event)"
        @close="emit('closeTab', $event)"
        @close-others="emit('closeOtherTabs', $event)"
        @close-left="emit('closeLeftTabs', $event)"
        @close-right="emit('closeRightTabs', $event)"
        @close-all="emit('closeAllTabs')"
        @refresh="emit('refreshTab', $event)"
        @pin="emit('pinTab', $event)"
        @maximize="emit('maximizeTabs')"
        @restore="emit('restoreTabs')"
      />

      <AdminMain>
        <slot />
      </AdminMain>

      <footer v-if="$slots.footer" class="va-admin-layout__footer">
        <slot name="footer" />
      </footer>
    </section>

    <AdminDrawerSidebar
      :open="mobile && drawerOpen"
      :app-name="appName"
      :menus="menus"
      :active-paths="activePaths"
      :current-path="currentPath"
      :width="sidebarWidth"
      :icon-size="sidebarIconSize"
      @navigate="emit('navigate', $event)"
      @close="emit('closeDrawer')"
    >
      <template #brand>
        <slot name="logo">{{ appName }}</slot>
      </template>
    </AdminDrawerSidebar>
  </div>
</template>

<style scoped>
.va-admin-layout {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  width: 100%;
  height: 100dvh;
  min-width: 0;
  overflow: hidden;
  color: var(--color-text);
  background: var(--color-body);
}

.va-admin-layout--mobile {
  grid-template-columns: minmax(0, 1fr);
}

.va-admin-layout__skip-link {
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 200;
  padding: 8px 12px;
  color: var(--color-on-primary);
  text-decoration: none;
  pointer-events: none;
  background: var(--color-primary);
  opacity: 0;
}

.va-admin-layout__skip-link:focus {
  pointer-events: auto;
  opacity: 1;
}

.va-admin-layout__desktop-sidebar {
  min-width: 0;
  height: 100dvh;
}

.va-admin-layout__workspace {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.va-admin-layout__footer {
  border-top: 1px solid var(--va-admin-sidebar-border);
}
</style>
