<script setup lang="ts">
import { Ripple } from '@varlet/ui'

import VaIcon from '../../icons/VaIcon.vue'
import type { AdminMenuItem } from '../../menu/create-menu-service'

const vRipple = Ripple

const props = withDefaults(defineProps<{
  item: AdminMenuItem
  level?: number
  activePaths?: string[]
  currentPath?: string
  collapsed?: boolean
}>(), {
  level: 0,
  activePaths: () => [],
  currentPath: '',
  collapsed: false,
})

const emit = defineEmits<{
  navigate: [path: string]
  mouseenter: [event: MouseEvent]
  mouseleave: [event: MouseEvent]
  focusin: [event: FocusEvent]
}>()

function handleClick() {
  emit('navigate', props.item.path)
}
</script>

<template>
  <RouterLink
    v-if="item.navigable && item.children.length === 0"
    v-ripple
    class="va-admin-sidebar-item"
    :class="{
      'va-admin-sidebar-item--active': currentPath === item.path,
      'va-admin-sidebar-item--expanded': activePaths.includes(item.path) && currentPath !== item.path,
      'va-admin-sidebar-item--collapsed': collapsed,
    }"
    :data-menu-path="collapsed ? item.path : undefined"
    :style="{ '--va-admin-menu-level': level }"
    :to="item.path"
    :title="collapsed ? item.title : undefined"
    @mouseenter="emit('mouseenter', $event)"
    @mouseleave="emit('mouseleave', $event)"
    @focusin="emit('focusin', $event)"
    @click="handleClick"
  >
    <VaIcon
      v-if="item.icon"
      class="va-admin-sidebar-item__icon"
      :style="{ '--va-admin-sidebar-current-icon-size': collapsed && level === 0 ? '26px' : undefined }"
      :name="item.icon"
    />
    <span v-else class="va-admin-sidebar-item__dot" aria-hidden="true" />
    <span v-if="!collapsed" class="va-admin-sidebar-item__label">{{ item.title }}</span>
  </RouterLink>
  <button
    v-else
    v-ripple
    class="va-admin-sidebar-item va-admin-sidebar-item--group"
    :class="{
      'va-admin-sidebar-item--active': currentPath === item.path,
      'va-admin-sidebar-item--expanded': activePaths.includes(item.path) && currentPath !== item.path,
      'va-admin-sidebar-item--collapsed': collapsed,
    }"
    :data-menu-path="collapsed ? item.path : item.path"
    :style="{ '--va-admin-menu-level': level }"
    :title="collapsed ? item.title : undefined"
    type="button"
    @mouseenter="emit('mouseenter', $event)"
    @mouseleave="emit('mouseleave', $event)"
    @focusin="emit('focusin', $event)"
  >
    <VaIcon
      v-if="item.icon"
      class="va-admin-sidebar-item__icon"
      :style="{ '--va-admin-sidebar-current-icon-size': collapsed && level === 0 ? '26px' : undefined }"
      :name="item.icon"
    />
    <span v-else class="va-admin-sidebar-item__dot" aria-hidden="true" />
    <span v-if="!collapsed" class="va-admin-sidebar-item__label">{{ item.title }}</span>
  </button>

  <template v-if="!collapsed">
    <AdminSidebarItem
      v-for="child in item.children"
      :key="child.path"
      :item="child"
      :level="level + 1"
      :active-paths="activePaths"
      :current-path="currentPath"
      @navigate="emit('navigate', $event)"
    />
  </template>
</template>

<style scoped>
.va-admin-sidebar-item {
  position: relative;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  box-sizing: border-box;
  min-height: var(--va-admin-sidebar-menu-item-height);
  padding: 0 20px 0 calc(20px + var(--va-admin-menu-level, 0) * 26px);
  color: var(--va-admin-menu-text);
  text-decoration: none;
  overflow: hidden;
}

.va-admin-sidebar-item--group {
  width: 100%;
  font: inherit;
  text-align: left;
  cursor: default;
  background: transparent;
  border: 0;
}

.va-admin-sidebar-item:hover {
  background: var(--va-admin-menu-hover-bg);
}

.va-admin-sidebar-item--expanded {
  color: var(--va-admin-menu-active-text);
  background: var(--va-admin-menu-expanded-bg);
}

.va-admin-sidebar-item--active {
  color: var(--va-admin-menu-active-text);
  background: var(--va-admin-menu-active-bg);
}

.va-admin-sidebar-item--active::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  content: '';
  background: var(--va-admin-menu-indicator);
}

.va-admin-sidebar-item--collapsed {
  grid-template-columns: 1fr;
  justify-items: center;
  padding: 0;
}

.va-admin-sidebar-item__icon {
  font-size: var(--va-admin-sidebar-current-icon-size);
}

.va-admin-sidebar-item__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.va-admin-sidebar-item__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.68;
}
</style>
