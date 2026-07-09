<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import type { AdminMenuItem } from '../menu/create-menu-service'
import type { AdminTab } from '../tabs/create-tabs-service'
import type { AdminScrollbarMode } from '../theme/tokens'
import AdminDrawerSidebar from './components/AdminDrawerSidebar.vue'
import AdminFloatingMenu from './components/AdminFloatingMenu.vue'
import AdminHeader from './components/AdminHeader.vue'
import AdminMain from './components/AdminMain.vue'
import AdminSidebar from './components/AdminSidebar.vue'
import AdminTagsView from './components/AdminTagsView.vue'

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
  reorderTab: [path: string, targetPath: string]
  maximizeTabs: []
  restoreTabs: []
}>()

const breadcrumbItems = computed(() => findBreadcrumbItems(props.menus, props.currentPath, props.activePaths))
const breadcrumbMenuOpenState = ref<Record<string, boolean>>({})
let suppressNextBreadcrumbClick = false
let suppressBreadcrumbClickTimer: ReturnType<typeof window.setTimeout> | undefined

onMounted(() => {
  document.addEventListener('pointerdown', handleBreadcrumbPointerDown, true)
  document.addEventListener('click', handleBreadcrumbClick, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleBreadcrumbPointerDown, true)
  document.removeEventListener('click', handleBreadcrumbClick, true)
  clearSuppressBreadcrumbClickTimer()
})

function findBreadcrumbItems(menus: AdminMenuItem[], currentPath: string, activePaths: string[]) {
  const activePathSet = new Set([...activePaths, currentPath])
  const exactPath = findMenuPath(menus, currentPath)

  if (exactPath.length > 0) {
    return exactPath
  }

  return findActivePath(menus, activePathSet)
}

function findMenuPath(menus: AdminMenuItem[], targetPath: string, parents: AdminMenuItem[] = []): AdminMenuItem[] {
  for (const menu of menus) {
    const nextParents = [...parents, menu]

    if (menu.path === targetPath) {
      return nextParents
    }

    const childPath = findMenuPath(menu.children, targetPath, nextParents)
    if (childPath.length > 0) {
      return childPath
    }
  }

  return []
}

function findActivePath(menus: AdminMenuItem[], activePathSet: Set<string>, parents: AdminMenuItem[] = []): AdminMenuItem[] {
  for (const menu of menus) {
    const nextParents = [...parents, menu]
    const childPath = findActivePath(menu.children, activePathSet, nextParents)

    if (childPath.length > 0) {
      return childPath
    }

    if (activePathSet.has(menu.path)) {
      return nextParents
    }
  }

  return []
}

function isBreadcrumbNavigable(item: AdminMenuItem) {
  return item.navigable && item.children.length === 0 && item.path !== props.currentPath
}

function hasOpenBreadcrumbMenu() {
  return Object.values(breadcrumbMenuOpenState.value).some(Boolean)
}

function openBreadcrumbMenu(item: AdminMenuItem) {
  breadcrumbMenuOpenState.value = { [item.path]: true }
}

function toggleBreadcrumbMenu(item: AdminMenuItem) {
  breadcrumbMenuOpenState.value = breadcrumbMenuOpenState.value[item.path] ? {} : { [item.path]: true }
}

function closeBreadcrumbMenu() {
  breadcrumbMenuOpenState.value = {}
}

function navigateBreadcrumb(item: AdminMenuItem) {
  if (!isBreadcrumbNavigable(item)) {
    return
  }

  closeBreadcrumbMenu()
  emit('navigate', item.path)
}

function handleBreadcrumbPointerDown(event: PointerEvent) {
  if (!hasOpenBreadcrumbMenu()) {
    return
  }

  const targetElement = resolveEventElement(event.target)

  if (!targetElement || isInsideBreadcrumbMenu(targetElement)) {
    return
  }

  closeBreadcrumbMenu()

  if (!isInteractiveElement(targetElement)) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  suppressNextBreadcrumbClick = true
  scheduleSuppressBreadcrumbClickReset()
}

function handleBreadcrumbClick(event: MouseEvent) {
  if (!suppressNextBreadcrumbClick) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  suppressNextBreadcrumbClick = false
  clearSuppressBreadcrumbClickTimer()
}

function resolveEventElement(target: EventTarget | null) {
  if (target instanceof Element) {
    return target
  }

  return target instanceof Node ? target.parentElement : null
}

function isInsideBreadcrumbMenu(element: Element) {
  return Boolean(element.closest('.va-admin-layout__breadcrumb-menu, .va-admin-layout__breadcrumb-floating-menu'))
}

function isInteractiveElement(element: Element) {
  return Boolean(element.closest('button, a, input, textarea, select, [role="button"], [role="menuitem"], [tabindex]'))
}

function scheduleSuppressBreadcrumbClickReset() {
  clearSuppressBreadcrumbClickTimer()
  suppressBreadcrumbClickTimer = window.setTimeout(() => {
    suppressNextBreadcrumbClick = false
    suppressBreadcrumbClickTimer = undefined
  }, 300)
}

function clearSuppressBreadcrumbClickTimer() {
  if (!suppressBreadcrumbClickTimer) {
    return
  }

  window.clearTimeout(suppressBreadcrumbClickTimer)
  suppressBreadcrumbClickTimer = undefined
}
</script>

<template>
  <div
    class="va-admin-layout va-admin-layout--side"
    :class="[
      `va-admin-layout--scrollbar-${scrollbar}`,
      { 'va-admin-layout--mobile': mobile, 'va-admin-layout--tags-maximized': tagsMaximized },
    ]"
  >
    <a class="va-admin-layout__skip-link" href="#va-admin-main">跳到主内容</a>

    <div v-if="!mobile && !tagsMaximized" class="va-admin-layout__desktop-sidebar">
      <AdminSidebar
        :menus="menus"
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
        :show-app-name="false"
        @toggle-sidebar="emit('toggleSidebar')"
        @close-mobile-tools="emit('closeMobileTools')"
      >
        <template #brandCollapsed>
          <slot name="logoCollapsed">{{ appName.slice(0, 1) }}</slot>
        </template>
        <template #title>
          <var-breadcrumbs v-if="breadcrumbItems.length > 0" class="va-admin-layout__breadcrumb">
            <var-breadcrumb
              v-for="item in breadcrumbItems"
              :key="item.path"
            >
              <var-menu
                v-if="item.children.length > 0"
                :key="`${item.path}-${breadcrumbMenuOpenState[item.path] ? 'open' : 'closed'}`"
                class="va-admin-layout__breadcrumb-menu"
                v-model:show="breadcrumbMenuOpenState[item.path]"
                placement="bottom-start"
                :offset-y="8"
                @open="openBreadcrumbMenu(item)"
              >
                <button
                  class="va-admin-layout__breadcrumb-trigger"
                  type="button"
                  :aria-label="`打开${item.title}子页面`"
                  @click.stop="toggleBreadcrumbMenu(item)"
                >
                  {{ item.title }}
                </button>
                <template #menu>
                  <AdminFloatingMenu
                    v-if="breadcrumbMenuOpenState[item.path]"
                    class="va-admin-layout__breadcrumb-floating-menu"
                    :menus="item.children"
                    :active-paths="activePaths"
                    :current-path="currentPath"
                    @navigate="closeBreadcrumbMenu(); emit('navigate', $event)"
                  />
                </template>
              </var-menu>
              <button
                v-else-if="isBreadcrumbNavigable(item)"
                class="va-admin-layout__breadcrumb-trigger"
                type="button"
                @click="navigateBreadcrumb(item)"
              >
                {{ item.title }}
              </button>
              <span v-else>{{ item.title }}</span>
            </var-breadcrumb>
          </var-breadcrumbs>
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
        @reorder="(path, targetPath) => emit('reorderTab', path, targetPath)"
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

.va-admin-layout__breadcrumb {
  min-width: 0;
  color: var(--color-on-surface-variant);
}

.va-admin-layout__breadcrumb-menu {
  display: inline-flex;
}

.va-admin-layout__breadcrumb-trigger {
  padding: 0;
  color: inherit;
  font: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.va-admin-layout__breadcrumb-floating-menu {
  --va-admin-floating-menu-max-height: calc(100dvh - var(--va-admin-header-height) - 24px);
}
</style>
