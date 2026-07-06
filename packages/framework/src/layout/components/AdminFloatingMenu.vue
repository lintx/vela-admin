<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import VaIcon from '../../icons/VaIcon.vue'
import type { AdminMenuItem } from '../../menu/create-menu-service'
import { resolveFloatingChildPanelPosition } from './floating-menu-position'

const props = withDefaults(defineProps<{
  menus: AdminMenuItem[]
  title?: string
  activePaths?: string[]
  currentPath?: string
  cascade?: boolean
  navigateParent?: boolean
}>(), {
  title: '',
  activePaths: () => [],
  currentPath: '',
  cascade: true,
  navigateParent: false,
})

const emit = defineEmits<{
  navigate: [path: string]
}>()

interface PanelPosition {
  left: string
  top: string
}

const hoveredPathByLevel = ref<string[]>([])
const hoveredPositionByLevel = ref<PanelPosition[]>([])
const floatingMenuPanelPadding = 8
const panels = computed(() => {
  const result: Array<{
    menus: AdminMenuItem[]
    left: string
    top: string
  }> = [{ menus: props.menus, left: '0px', top: '0px' }]

  if (!props.cascade) {
    return result
  }

  let currentLevelMenus = props.menus

  for (let level = 0; level < hoveredPathByLevel.value.length; level += 1) {
    const hoveredPath = hoveredPathByLevel.value[level]
    const hoveredMenu = currentLevelMenus.find((menu) => menu.path === hoveredPath)

    if (!hoveredMenu || hoveredMenu.children.length === 0) {
      break
    }

    const position = hoveredPositionByLevel.value[level] ?? createFallbackPanelPosition(level + 1, 0)

    result.push({
      menus: hoveredMenu.children,
      left: position.left,
      top: position.top,
    })
    currentLevelMenus = hoveredMenu.children
  }

  return result
})

watch(() => props.menus, () => {
  hoveredPathByLevel.value = []
  hoveredPositionByLevel.value = []
})

function handleItemEnter(item: AdminMenuItem, level: number, index: number, event: MouseEvent | FocusEvent) {
  const position = resolveChildPanelPosition(level, index, event)

  hoveredPathByLevel.value = [
    ...hoveredPathByLevel.value.slice(0, level),
    item.path,
  ]
  hoveredPositionByLevel.value = [
    ...hoveredPositionByLevel.value.slice(0, level),
    position,
  ]
}

function resolveChildPanelPosition(level: number, index: number, event: MouseEvent | FocusEvent): PanelPosition {
  const target = event.currentTarget
  const panel = target instanceof HTMLElement
    ? target.closest<HTMLElement>('.va-admin-floating-menu__panel')
    : null
  const root = target instanceof HTMLElement
    ? target.closest<HTMLElement>('.va-admin-floating-menu')
    : null

  if (!(target instanceof HTMLElement) || !panel || !root) {
    return createFallbackPanelPosition(level + 1, index)
  }

  const targetRect = target.getBoundingClientRect()
  const panelRect = panel.getBoundingClientRect()
  const rootRect = root.getBoundingClientRect()
  const panelBorderTop = Number.parseFloat(window.getComputedStyle(panel).borderTopWidth) || 0
  const hasLayoutRect = panelRect.width > 0 || panelRect.left !== 0 || targetRect.top !== 0 || rootRect.left !== 0

  if (hasLayoutRect) {
    return resolveFloatingChildPanelPosition({
      rootRect,
      parentPanelRect: panelRect,
      parentItemRect: targetRect,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      panelWidth: panelRect.width,
      panelHeight: panelRect.height,
      panelPadding: floatingMenuPanelPadding,
      panelBorderTop,
    })
  }

  return createFallbackPanelPosition(level + 1, index)
}

function createFallbackPanelPosition(level: number, index: number): PanelPosition {
  return {
    left: `calc(${level} * (100% - 1px))`,
    top: `calc(${index} * var(--va-admin-sidebar-menu-item-height))`,
  }
}

function handleItemClick(item: AdminMenuItem) {
  if (item.children.length > 0) {
    if (props.navigateParent) {
      emit('navigate', item.path)
    }

    return
  }

  if (!item.navigable) {
    return
  }

  emit('navigate', item.path)
}
</script>

<template>
  <div class="va-admin-floating-menu">
    <div
      v-for="(panel, level) in panels"
      :key="level"
      class="va-admin-floating-menu__panel va-admin-scrollbar"
      role="menu"
      :data-menu-level="level"
      :style="{
        '--va-admin-floating-menu-panel-left': panel.left,
        '--va-admin-floating-menu-panel-top': panel.top,
      }"
    >
      <div v-if="level === 0 && title" class="va-admin-floating-menu__title">{{ title }}</div>
      <button
        v-for="(item, index) in panel.menus"
        :key="item.path"
        class="va-admin-floating-menu__item"
        :class="{
          'va-admin-floating-menu__item--active': currentPath === item.path,
          'va-admin-floating-menu__item--expanded': activePaths.includes(item.path) && currentPath !== item.path,
          'va-admin-floating-menu__item--open': hoveredPathByLevel[level] === item.path && item.children.length > 0,
        }"
        type="button"
        role="menuitem"
        :data-menu-path="item.path"
        @mouseenter="handleItemEnter(item, level, index, $event)"
        @focusin="handleItemEnter(item, level, index, $event)"
        @click="handleItemClick(item)"
      >
        <VaIcon v-if="item.icon" class="va-admin-floating-menu__icon" :name="item.icon" />
        <span v-else class="va-admin-floating-menu__icon-placeholder" aria-hidden="true" />
        <span class="va-admin-floating-menu__label">{{ item.title }}</span>
        <VaIcon
          v-if="cascade && item.children.length > 0"
          class="va-admin-floating-menu__arrow"
          library="tabler"
          name="chevron-right"
          :size="18"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
.va-admin-floating-menu {
  position: relative;
  display: block;
  min-width: 220px;
  color: var(--va-admin-menu-text);
  filter: drop-shadow(0 2px 6px rgb(0 0 0 / 12%)) drop-shadow(0 8px 24px rgb(0 0 0 / 10%));
}

.va-admin-floating-menu__panel {
  position: relative;
  box-sizing: border-box;
  min-width: 220px;
  max-height: var(--va-admin-floating-menu-max-height, inherit);
  padding: 8px 0;
  overflow-y: auto;
  color: var(--va-admin-menu-text);
  background: var(--va-admin-sidebar-bg);
  border: 1px solid var(--va-admin-sidebar-border);
}

.va-admin-floating-menu__title {
  display: flex;
  align-items: center;
  min-height: 36px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-on-surface-variant);
}

.va-admin-floating-menu__panel + .va-admin-floating-menu__panel {
  position: absolute;
  top: var(--va-admin-floating-menu-panel-top);
  left: var(--va-admin-floating-menu-panel-left);
}

.va-admin-floating-menu__item {
  position: relative;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 20px;
  align-items: center;
  width: 100%;
  min-height: var(--va-admin-sidebar-menu-item-height);
  padding: 0 12px 0 16px;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.va-admin-floating-menu__item:hover,
.va-admin-floating-menu__item--open {
  background: var(--va-admin-menu-hover-bg);
}

.va-admin-floating-menu__item--expanded {
  color: var(--va-admin-menu-active-text);
  background: var(--va-admin-menu-expanded-bg);
}

.va-admin-floating-menu__item--active {
  color: var(--va-admin-menu-active-text);
  background: var(--va-admin-menu-active-bg);
}

.va-admin-floating-menu__item--active::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  content: '';
  background: var(--va-admin-menu-indicator);
}

.va-admin-floating-menu__icon,
.va-admin-floating-menu__arrow {
  font-size: 20px;
}

.va-admin-floating-menu__icon-placeholder {
  width: 20px;
  height: 20px;
}

.va-admin-floating-menu__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.va-admin-floating-menu__arrow {
  justify-self: end;
}
</style>
