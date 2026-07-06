<script setup lang="ts">
import { cloneVNode, computed, h, ref, watch } from 'vue'

import VaIcon from '../../icons/VaIcon.vue'
import type { AdminMenuItem } from '../../menu/create-menu-service'
import AdminCollapsedSubMenu from './AdminCollapsedSubMenu.vue'
import AdminSidebarItem from './AdminSidebarItem.vue'

interface CollapsedSubMenuState {
  menu: AdminMenuItem
  top: number
}

const props = withDefaults(defineProps<{
  menus: AdminMenuItem[]
  activePaths?: string[]
  currentPath?: string
  collapsed?: boolean
  width?: number
  collapsedWidth?: number
  iconSize?: number
  collapsedIconSize?: number
}>(), {
  activePaths: () => [],
  currentPath: '',
  collapsed: false,
  width: 272,
  collapsedWidth: 56,
  iconSize: 22,
  collapsedIconSize: 26,
})

const emit = defineEmits<{
  navigate: [path: string]
}>()

const sidebarRef = ref<HTMLElement | null>(null)
const hoveredMenu = ref<CollapsedSubMenuState | null>(null)
const activeMenu = ref(props.currentPath)
const expandedMenus = ref<string[]>([])
const treeMenuItemIndent = 'var(--va-admin-sidebar-tree-menu-item-indent)'
const treeMenuIconTextOffset = 'var(--va-admin-sidebar-tree-menu-icon-text-offset)'
const rootStyle = computed(() => ({
  '--va-admin-sidebar-current-width': `${props.collapsed ? props.collapsedWidth : props.width}px`,
  '--va-admin-sidebar-current-icon-size': `${props.collapsed ? props.collapsedIconSize : props.iconSize}px`,
}))
const treeMenuOptions = computed(() => props.menus.map((menu) => createTreeMenuOption(menu)))

watch(
  () => [props.currentPath, props.activePaths] as const,
  () => {
    activeMenu.value = props.currentPath
    expandedMenus.value = props.activePaths.filter((path) => path !== props.currentPath)
  },
  { immediate: true },
)

function createTreeMenuOption(menu: AdminMenuItem, level = 0, parentTextOffset = '0px', parentHasIcon = false): AdminMenuItem & {
  value: string
  label: ReturnType<typeof renderTreeMenuLabel>
  icon?: ReturnType<typeof renderTreeMenuIcon>
  render?: ReturnType<typeof renderTreeMenuItem>
  disabled?: boolean
} {
  const hasIcon = Boolean(menu.icon)
  const visualStartOffset = getTreeMenuVisualStartOffset(level, parentTextOffset, parentHasIcon)
  const textOffset = hasIcon ? addOffset(visualStartOffset, treeMenuIconTextOffset) : visualStartOffset

  return {
    ...menu,
    value: menu.path,
    label: renderTreeMenuLabel(menu.title),
    icon: menu.icon ? renderTreeMenuIcon(menu.icon) : undefined,
    render: renderTreeMenuItem(visualStartOffset),
    // TreeMenu 对有 children 的节点只执行展开；禁用仅用于显式不可点击叶子兜底。
    disabled: !menu.navigable && menu.children.length === 0,
    children: menu.children.map((child) => createTreeMenuOption(child, level + 1, textOffset, hasIcon)),
  }
}

function getTreeMenuVisualStartOffset(level: number, parentTextOffset: string, parentHasIcon: boolean) {
  if (level === 0) {
    return '0px'
  }

  return parentHasIcon ? parentTextOffset : addOffset(parentTextOffset, treeMenuItemIndent)
}

function renderTreeMenuIcon(name: string) {
  return () => h(VaIcon, {
    class: 'va-admin-sidebar__tree-icon',
    name,
  })
}

function renderTreeMenuLabel(title: string) {
  return () => h('span', {
    class: 'va-admin-sidebar__tree-label',
  }, title)
}

function addOffset(left: string, right: string) {
  if (left === '0px') {
    return right
  }

  if (right === '0px') {
    return left
  }

  return `calc(${left} + ${right})`
}

function renderTreeMenuItem(contentOffset: string) {
  return ({ node }: { node: Parameters<typeof cloneVNode>[0] }) => cloneVNode(node, {
    style: contentOffset === '0px'
      ? undefined
      : { '--va-admin-sidebar-tree-menu-content-offset': contentOffset },
  })
}

function handleTreeMenuChange(path: string | number, option: AdminMenuItem) {
  if (!option.navigable || option.children.length > 0) {
    return
  }

  emit('navigate', String(path))
}

function openCollapsedSubMenu(menu: AdminMenuItem, event: MouseEvent | FocusEvent) {
  const triggerElement = event.currentTarget
  const top = triggerElement instanceof HTMLElement && sidebarRef.value
    ? Math.max(0, triggerElement.getBoundingClientRect().top - sidebarRef.value.getBoundingClientRect().top - 8)
    : 0

  hoveredMenu.value = { menu, top }
}

function handleCollapsedSubMenuLeave(event: MouseEvent) {
  const relatedTarget = event.relatedTarget

  if (
    relatedTarget instanceof Node
    && hoveredMenu.value
    && document
      .querySelector<HTMLElement>(`.va-admin-sidebar-item[data-menu-path="${hoveredMenu.value.menu.path}"]`)
      ?.contains(relatedTarget)
  ) {
    return
  }

  hoveredMenu.value = null
}

function handleCollapsedMenuLeave(event: MouseEvent) {
  const relatedTarget = event.relatedTarget

  if (
    relatedTarget instanceof Node
    && document.querySelector<HTMLElement>('.va-admin-collapsed-sub-menu')?.contains(relatedTarget)
  ) {
    return
  }

  hoveredMenu.value = null
}
</script>

<template>
  <aside
    ref="sidebarRef"
    class="va-admin-sidebar va-admin-scrollbar"
    :class="{ 'va-admin-sidebar--collapsed': collapsed }"
    :style="rootStyle"
  >
    <div class="va-admin-sidebar__brand">
      <template v-if="collapsed">
        <slot name="brandCollapsed">V</slot>
      </template>
      <template v-else>
        <slot name="brand">Vela Admin</slot>
      </template>
    </div>

    <nav class="va-admin-sidebar__menu" aria-label="后台菜单">
      <template v-if="collapsed">
        <AdminSidebarItem
          v-for="menu in menus"
          :key="menu.path"
          :item="menu"
          :level="0"
          :active-paths="activePaths"
          :current-path="currentPath"
          :collapsed="collapsed"
          @navigate="emit('navigate', $event)"
          @mouseenter="openCollapsedSubMenu(menu, $event)"
          @mouseleave="handleCollapsedMenuLeave"
          @focusin="openCollapsedSubMenu(menu, $event)"
        />
      </template>

      <template v-else>
        <var-tree-menu
          v-model:active="activeMenu"
          v-model:expanded-values="expandedMenus"
          class="va-admin-sidebar__tree-menu"
          :options="treeMenuOptions"
          value-key="value"
          label-key="label"
          icon-key="icon"
          children-key="children"
          :indent="treeMenuItemIndent"
          ripple
          @change="handleTreeMenuChange"
        />
      </template>
    </nav>

    <AdminCollapsedSubMenu
      v-if="collapsed && hoveredMenu && hoveredMenu.menu.children.length"
      :menu="hoveredMenu.menu"
      :top="hoveredMenu.top"
      :active-paths="activePaths"
      :current-path="currentPath"
      @navigate="emit('navigate', $event)"
      @mouseleave="handleCollapsedSubMenuLeave"
    />
  </aside>
</template>

<style scoped>
.va-admin-sidebar {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: var(--va-admin-sidebar-current-width);
  min-width: var(--va-admin-sidebar-current-width);
  height: 100dvh;
  min-height: 100dvh;
  color: var(--va-admin-menu-text);
  background: var(--va-admin-sidebar-bg);
  border-right: 1px solid var(--va-admin-sidebar-border);
  transition: width 180ms ease, min-width 180ms ease;
}

.va-admin-sidebar__brand {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: var(--va-admin-header-height);
  min-height: var(--va-admin-header-height);
  padding: 0 20px;
  overflow: hidden;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  border-bottom: 1px solid var(--va-admin-sidebar-border);
  transition: padding 180ms ease;
}

.va-admin-sidebar--collapsed .va-admin-sidebar__brand {
  justify-content: center;
  padding: 0;
}

.va-admin-sidebar__menu {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 8px 0;
  overflow-y: auto;
}

.va-admin-sidebar__tree-menu {
  --va-admin-sidebar-tree-menu-item-indent: var(--tree-menu-item-font-size, 1em);
  --va-admin-sidebar-tree-menu-icon-text-offset:
    calc(var(--tree-menu-item-icon-size) + var(--tree-menu-item-icon-margin-right));
  --tree-menu-background: transparent;
  --tree-menu-item-height: var(--va-admin-sidebar-menu-item-height);
  --tree-menu-item-padding: 0 20px;
  --tree-menu-item-indent: var(--va-admin-sidebar-tree-menu-item-indent);
  --tree-menu-item-icon-size: var(--va-admin-sidebar-current-icon-size);
  --tree-menu-item-icon-margin-right: 4px;
  --tree-menu-item-font-size: 14px;
  --tree-menu-item-color: var(--va-admin-menu-text);
  --tree-menu-item-active-color: var(--va-admin-menu-active-text);
  --tree-menu-item-active-background: var(--va-admin-menu-active-bg);
  --tree-menu-item-active-path-background: var(--va-admin-menu-expanded-bg);
  --tree-menu-item-active-path-color: var(--va-admin-menu-active-text);
  --tree-menu-item-hover-background: var(--va-admin-menu-hover-bg);
}

.va-admin-sidebar__tree-menu :deep(.var-tree-menu) {
  color: var(--va-admin-menu-text);
  background: transparent;
}

.va-admin-sidebar__tree-menu :deep(.var-tree-menu__item) {
  position: relative;
  min-height: var(--va-admin-sidebar-menu-item-height);
  color: var(--va-admin-menu-text);
  border-radius: 0;
}

.va-admin-sidebar__tree-menu :deep(.var-tree-menu__item-indicator) {
  left: 0;
  width: 4px;
  transform: translateY(-50%);
}

.va-admin-sidebar__tree-menu :deep(.var-tree-menu__item-indicator::after) {
  background: var(--va-admin-menu-indicator);
}

.va-admin-sidebar__tree-menu :deep(.var-tree-menu__item:hover) {
  background: var(--va-admin-menu-hover-bg);
}

.va-admin-sidebar__tree-menu :deep(.var-tree-menu__item-content) {
  min-width: 0;
  margin-left: var(
    --va-admin-sidebar-tree-menu-content-offset,
    calc(var(--tree-menu-item-indent) * var(--tree-menu-level))
  );
}

.va-admin-sidebar__tree-menu :deep(.var-tree-menu__label) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.va-admin-sidebar__tree-menu :deep(.va-admin-sidebar__tree-label) {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.va-admin-sidebar__tree-menu :deep(.va-admin-sidebar__tree-icon) {
  font-size: var(--va-admin-sidebar-current-icon-size);
}

.va-admin-sidebar__tree-menu :deep(.var-tree-menu--item-active-path) {
  color: var(--va-admin-menu-active-text);
  background: var(--va-admin-menu-expanded-bg);
}

.va-admin-sidebar__tree-menu :deep(.var-tree-menu--item-active) {
  color: var(--va-admin-menu-active-text);
  background: var(--va-admin-menu-active-bg);
}

:global(.varlet-admin-theme-md3 .va-admin-sidebar__tree-menu .var-tree-menu__item) {
  margin: 0 10px;
  border-radius: 999px;
}

:global(.varlet-admin-theme-md3 .va-admin-sidebar__tree-menu .var-tree-menu__item-indicator::after) {
  transform: scaleX(0);
}
</style>
