<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, provide, ref, watch } from 'vue'

import VaIcon from '../../icons/VaIcon.vue'
import { resolveFloatingChildPanelPosition } from '../../layout/components/floating-menu-position'
import {
  vaContextMenuInjectionKey,
} from './context-menu-context'
import type {
  VaContextMenuGroupOption,
  VaContextMenuItemOption,
  VaContextMenuItemValue,
  VaContextMenuPlacement,
  VaContextMenuRegisteredGroup,
  VaContextMenuRegisteredItem,
  VaContextMenuTrigger,
} from './context-menu-types'

const props = withDefaults(defineProps<{
  groups?: VaContextMenuGroupOption[]
  trigger?: VaContextMenuTrigger
  showIcon?: boolean
  show?: boolean
  x?: number
  y?: number
  placement?: VaContextMenuPlacement
  clickPlacement?: VaContextMenuPlacement
  contextmenuPlacement?: VaContextMenuPlacement
  menuTestId?: string
  itemTestIdPrefix?: string
  dividerTestId?: string
  itemClass?: string
}>(), {
  groups: () => [],
  trigger: 'contextmenu',
  showIcon: true,
  show: undefined,
  x: undefined,
  y: undefined,
  placement: undefined,
  clickPlacement: undefined,
  contextmenuPlacement: undefined,
  menuTestId: 'va-context-menu',
  itemTestIdPrefix: 'va-context-menu-item',
  dividerTestId: 'va-context-menu-divider',
  itemClass: '',
})

const emit = defineEmits<{
  select: [value: VaContextMenuItemValue]
  'update:show': [value: boolean]
}>()

interface PanelPosition {
  left: string
  top: string
}

interface PanelState {
  groups: VaContextMenuGroupOption[]
  left: string
  top: string
}

interface MenuAnchor {
  type: 'point' | 'rect'
  x?: number
  y?: number
  rect?: DOMRect
  placement: VaContextMenuPlacement
}

const rootRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const uncontrolledOpen = ref(false)
const adjustedMenuX = ref(0)
const adjustedMenuY = ref(0)
const menuAnchor = ref<MenuAnchor | null>(null)
const registeredGroups = ref<VaContextMenuRegisteredGroup[]>([])
const registeredItems = ref<VaContextMenuRegisteredItem[]>([])
const hoveredValueByLevel = ref<VaContextMenuItemValue[]>([])
const hoveredPositionByLevel = ref<PanelPosition[]>([])
const panelPadding = 6
const isOpen = computed(() => props.show ?? uncontrolledOpen.value)
const templateGroups = computed<VaContextMenuGroupOption[]>(() => {
  return registeredGroups.value
    .map(group => registeredItems.value
      .filter(item => item.groupId === group.id)
      .map(item => item.item))
    .filter(group => group.length > 0)
})
const resolvedGroups = computed(() => {
  const sourceGroups = props.groups.length > 0 ? props.groups : templateGroups.value
  return sourceGroups
    .map(group => group.filter(item => item && item.text))
    .filter(group => group.length > 0)
})
const panels = computed<PanelState[]>(() => {
  const result: PanelState[] = [
    {
      groups: resolvedGroups.value,
      left: '0px',
      top: '0px',
    },
  ]

  let currentGroups = resolvedGroups.value

  for (let level = 0; level < hoveredValueByLevel.value.length; level += 1) {
    const item = findItem(currentGroups, hoveredValueByLevel.value[level])
    if (!item?.children?.length) {
      break
    }

    const position = hoveredPositionByLevel.value[level] ?? createFallbackPanelPosition(level + 1)
    result.push({
      groups: [item.children],
      left: position.left,
      top: position.top,
    })
    currentGroups = [item.children]
  }

  return result
})
const resolvedMenuX = computed(() => props.x ?? adjustedMenuX.value)
const resolvedMenuY = computed(() => props.y ?? adjustedMenuY.value)

provide(vaContextMenuInjectionKey, {
  registerGroup(group) {
    if (registeredGroups.value.some(item => item.id === group.id)) {
      return
    }

    registeredGroups.value = [...registeredGroups.value, group]
  },
  unregisterGroup(groupId) {
    registeredGroups.value = registeredGroups.value.filter(group => group.id !== groupId)
    registeredItems.value = registeredItems.value.filter(item => item.groupId !== groupId)
  },
  registerItem(item) {
    registeredItems.value = [
      ...registeredItems.value.filter(current => !(current.groupId === item.groupId && current.item.value === item.item.value)),
      item,
    ]
  },
  unregisterItem(groupId, value) {
    registeredItems.value = registeredItems.value.filter(item => !(item.groupId === groupId && item.item.value === value))
  },
})

watch(() => props.groups, () => {
  resetCascade()
}, { deep: true })

watch(isOpen, (open) => {
  if (!open) {
    resetCascade()
    removeDocumentListeners()
    return
  }

  nextTick(resolveRootMenuPosition)
  addDocumentListeners()
}, { immediate: true })

function shouldHandleClick() {
  return props.trigger === 'click' || props.trigger === 'both'
}

function shouldHandleContextmenu() {
  return props.trigger === 'contextmenu' || props.trigger === 'both'
}

async function openWithAnchor(anchor: MenuAnchor) {
  menuAnchor.value = anchor
  const position = resolveInitialPosition(anchor, 0, 0)
  adjustedMenuX.value = position.left
  adjustedMenuY.value = position.top
  uncontrolledOpen.value = true
  emit('update:show', true)
  await nextTick()
  resolveRootMenuPosition()
}

function handleClick(event: MouseEvent) {
  if (!shouldHandleClick()) {
    return
  }

  event.stopPropagation()
  const rect = resolveTriggerRect(event)
  const placement = props.clickPlacement ?? props.placement ?? 'target-center'

  openWithAnchor(rect && placement !== 'cursor'
    ? { type: 'rect', rect, placement }
    : { type: 'point', x: event.clientX, y: event.clientY, placement: 'cursor' })
}

function handleContextmenu(event: MouseEvent) {
  if (!shouldHandleContextmenu()) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  const placement = props.contextmenuPlacement ?? props.placement ?? 'cursor'
  const rect = placement === 'cursor' ? null : resolveTriggerRect(event)

  openWithAnchor(rect
    ? { type: 'rect', rect, placement }
    : { type: 'point', x: event.clientX, y: event.clientY, placement: 'cursor' })
}

function closeMenu() {
  uncontrolledOpen.value = false
  emit('update:show', false)
}

function resetCascade() {
  hoveredValueByLevel.value = []
  hoveredPositionByLevel.value = []
}

function addDocumentListeners() {
  document.removeEventListener('keydown', handleKeydown)
  document.addEventListener('keydown', handleKeydown)

  window.setTimeout(() => {
    if (!isOpen.value) {
      return
    }

    document.addEventListener('click', closeMenu, { once: true })
  }, 0)
}

function removeDocumentListeners() {
  document.removeEventListener('click', closeMenu)
  document.removeEventListener('keydown', handleKeydown)
}

function resolveRootMenuPosition() {
  if (props.x !== undefined || props.y !== undefined) {
    return
  }

  const menu = menuRef.value
  const anchor = menuAnchor.value
  if (!menu || !anchor) {
    return
  }

  const viewportMargin = 8
  const width = menu.offsetWidth
  const height = menu.offsetHeight
  const position = resolveInitialPosition(anchor, width, height)
  const maxLeft = window.innerWidth - viewportMargin - width
  const maxTop = window.innerHeight - viewportMargin - height
  const nextLeft = position.left + width > window.innerWidth - viewportMargin
    ? Math.max(viewportMargin, position.fallbackLeft ?? position.left - width)
    : Math.min(Math.max(viewportMargin, position.left), Math.max(viewportMargin, maxLeft))
  const nextTop = position.top + height > window.innerHeight - viewportMargin
    ? Math.max(viewportMargin, position.fallbackTop ?? position.top - height)
    : Math.min(Math.max(viewportMargin, position.top), Math.max(viewportMargin, maxTop))

  adjustedMenuX.value = Math.round(nextLeft)
  adjustedMenuY.value = Math.round(nextTop)
}

function resolveTriggerRect(event: MouseEvent) {
  const path = event.composedPath()
  const root = rootRef.value
  const target = path.find((item): item is HTMLElement => {
    return item instanceof HTMLElement && item !== root && root?.contains(item)
  })

  if (target) {
    return target.getBoundingClientRect()
  }

  return event.currentTarget instanceof HTMLElement
    ? event.currentTarget.getBoundingClientRect()
    : null
}

function resolveInitialPosition(anchor: MenuAnchor, menuWidth: number, menuHeight: number) {
  if (anchor.type === 'point') {
    const left = anchor.x ?? 0
    const top = anchor.y ?? 0

    return {
      left,
      top,
      fallbackLeft: left - menuWidth,
      fallbackTop: top - menuHeight,
    }
  }

  const rect = anchor.rect
  if (!rect) {
    return { left: 0, top: 0 }
  }

  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  switch (anchor.placement) {
    case 'target-top':
      return { left: centerX - menuWidth / 2, top: rect.top - menuHeight, fallbackTop: rect.bottom }
    case 'target-top-right':
      return { left: rect.right, top: rect.top - menuHeight, fallbackLeft: rect.left - menuWidth, fallbackTop: rect.bottom }
    case 'target-right':
      return { left: rect.right, top: centerY - menuHeight / 2, fallbackLeft: rect.left - menuWidth }
    case 'target-bottom-right':
      return { left: rect.right, top: rect.bottom, fallbackLeft: rect.left - menuWidth, fallbackTop: rect.top - menuHeight }
    case 'target-bottom':
      return { left: centerX - menuWidth / 2, top: rect.bottom, fallbackTop: rect.top - menuHeight }
    case 'target-bottom-left':
      return { left: rect.left - menuWidth, top: rect.bottom, fallbackLeft: rect.right, fallbackTop: rect.top - menuHeight }
    case 'target-left':
      return { left: rect.left - menuWidth, top: centerY - menuHeight / 2, fallbackLeft: rect.right }
    case 'target-top-left':
      return { left: rect.left - menuWidth, top: rect.top - menuHeight, fallbackLeft: rect.right, fallbackTop: rect.bottom }
    case 'cursor':
      return { left: rect.left, top: rect.top, fallbackLeft: rect.left - menuWidth, fallbackTop: rect.top - menuHeight }
    case 'target-center':
    default:
      return { left: centerX - menuWidth / 2, top: centerY - menuHeight / 2 }
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (!isOpen.value) {
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    closeMenu()
    return
  }

  const item = findShortcutItem(event.key)
  if (!item) {
    return
  }

  event.preventDefault()
  emit('select', item.value)
  closeMenu()
}

function findShortcutItem(key: string) {
  const normalizedKey = normalizeShortcut(key)

  return flattenItems(resolvedGroups.value).find((item) => {
    return !item.disabled
      && !item.children?.length
      && item.shortcut
      && normalizeShortcut(item.shortcut) === normalizedKey
  })
}

function flattenItems(groups: VaContextMenuGroupOption[]): VaContextMenuItemOption[] {
  return groups.flatMap(group => group.flatMap(item => [
    item,
    ...(item.children ? flattenItems([item.children]) : []),
  ]))
}

function normalizeShortcut(value: string) {
  return value.trim().toLowerCase() === 'del'
    ? 'delete'
    : value.trim().toLowerCase()
}

function handleItemEnter(item: VaContextMenuItemOption, level: number, event: MouseEvent | FocusEvent) {
  const position = resolveChildPanelPosition(level, event)

  hoveredValueByLevel.value = [
    ...hoveredValueByLevel.value.slice(0, level),
    item.value,
  ]
  hoveredPositionByLevel.value = [
    ...hoveredPositionByLevel.value.slice(0, level),
    position,
  ]
}

function handleItemClick(item: VaContextMenuItemOption) {
  if (item.disabled || item.children?.length) {
    return
  }

  emit('select', item.value)
  closeMenu()
}

function resolveChildPanelPosition(level: number, event: MouseEvent | FocusEvent): PanelPosition {
  const target = event.currentTarget
  const panel = target instanceof HTMLElement
    ? target.closest<HTMLElement>('.va-context-menu__panel')
    : null
  const root = menuRef.value

  if (!(target instanceof HTMLElement) || !panel || !root) {
    return createFallbackPanelPosition(level + 1)
  }

  const targetRect = target.getBoundingClientRect()
  const panelRect = panel.getBoundingClientRect()
  const rootRect = root.getBoundingClientRect()
  const panelBorderTop = Number.parseFloat(window.getComputedStyle(panel).borderTopWidth) || 0
  const hasLayoutRect = panelRect.width > 0 || panelRect.left !== 0 || targetRect.top !== 0 || rootRect.left !== 0

  if (!hasLayoutRect) {
    return createFallbackPanelPosition(level + 1)
  }

  return resolveFloatingChildPanelPosition({
    rootRect,
    parentPanelRect: panelRect,
    parentItemRect: targetRect,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    panelWidth: panelRect.width,
    panelHeight: panelRect.height,
    panelPadding,
    panelBorderTop,
  })
}

function createFallbackPanelPosition(level: number): PanelPosition {
  return {
    left: `calc(${level} * (100% - 1px))`,
    top: '0px',
  }
}

function findItem(groups: VaContextMenuGroupOption[], value: VaContextMenuItemValue) {
  return groups.flat().find(item => item.value === value)
}

function getItemTestId(item: VaContextMenuItemOption) {
  return `${props.itemTestIdPrefix}-${String(item.value)}`
}

onBeforeUnmount(() => {
  removeDocumentListeners()
})
</script>

<template>
  <span
    ref="rootRef"
    class="va-context-menu__trigger"
    @click="handleClick"
    @contextmenu="handleContextmenu"
  >
    <slot />
  </span>

  <div style="display: none">
    <slot name="menu" />
  </div>

  <div
    v-if="isOpen"
    ref="menuRef"
    class="va-context-menu"
    :class="{ 'va-context-menu--without-icons': !showIcon }"
    :data-testid="menuTestId"
    :style="{ left: `${resolvedMenuX}px`, top: `${resolvedMenuY}px` }"
    role="menu"
    @click.stop
  >
    <div
      v-for="(panel, panelIndex) in panels"
      :key="panelIndex"
      class="va-context-menu__panel"
      data-testid="va-context-menu-panel"
      :style="{
        '--va-context-menu-panel-left': panel.left,
        '--va-context-menu-panel-top': panel.top,
      }"
      :data-menu-level="panelIndex"
    >
      <template v-for="(group, groupIndex) in panel.groups" :key="groupIndex">
        <div
          v-if="groupIndex > 0"
          class="va-context-menu__divider"
          :data-testid="dividerTestId"
          role="separator"
        />

        <button
          v-for="item in group"
          :key="item.value"
          class="va-context-menu__item"
          :class="[
            itemClass,
            {
              'va-context-menu__item--danger': item.danger,
              'va-context-menu__item--open': hoveredValueByLevel[panelIndex] === item.value && item.children?.length,
            },
          ]"
          type="button"
          role="menuitem"
          :disabled="item.disabled"
          :data-testid="getItemTestId(item)"
          @mouseenter="handleItemEnter(item, panelIndex, $event)"
          @focusin="handleItemEnter(item, panelIndex, $event)"
          @click="handleItemClick(item)"
        >
          <template v-if="showIcon">
            <VaIcon v-if="item.icon" class="va-context-menu__icon" :name="item.icon" :size="18" />
            <span v-else class="va-context-menu__icon-placeholder" aria-hidden="true" />
          </template>
          <span class="va-context-menu__text">
            <slot name="item" :item="item">
              {{ item.text }}
            </slot>
          </span>
          <span v-if="item.shortcut && !item.children?.length" class="va-context-menu__shortcut">{{ item.shortcut }}</span>
          <VaIcon
            v-if="item.children?.length"
            class="va-context-menu__arrow"
            library="tabler"
            name="chevron-right"
            :size="18"
          />
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.va-context-menu__trigger {
  display: contents;
}

.va-context-menu {
  position: fixed;
  z-index: 160;
  color: var(--color-text);
  filter: drop-shadow(0 2px 6px rgb(0 0 0 / 12%)) drop-shadow(0 8px 24px rgb(0 0 0 / 10%));
}

.va-context-menu__panel {
  position: relative;
  box-sizing: border-box;
  min-width: 168px;
  padding: 6px;
  color: var(--color-text);
  background: var(--color-body);
  border: 1px solid var(--va-admin-sidebar-border);
}

.va-context-menu__panel + .va-context-menu__panel {
  position: absolute;
  top: var(--va-context-menu-panel-top);
  left: var(--va-context-menu-panel-left);
}

.va-context-menu__item {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) auto;
  align-items: center;
  width: 100%;
  min-height: 36px;
  padding: 0 10px;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  gap: 8px;
}

.va-context-menu--without-icons .va-context-menu__item {
  grid-template-columns: minmax(0, 1fr) auto;
}

.va-context-menu__item:hover,
.va-context-menu__item--open {
  background: var(--va-admin-menu-hover-bg);
}

.va-context-menu__item:disabled {
  cursor: default;
  opacity: 0.48;
}

.va-context-menu__item--danger {
  color: var(--color-danger, #c2410c);
}

.va-context-menu__icon,
.va-context-menu__arrow,
.va-context-menu__icon-placeholder {
  width: 18px;
  height: 18px;
}

.va-context-menu__text {
  min-width: 0;
  overflow: hidden;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.va-context-menu__shortcut {
  font-size: 12px;
  color: var(--color-on-surface-variant);
}

.va-context-menu__arrow {
  justify-self: end;
}

.va-context-menu__divider {
  height: 1px;
  margin: 6px 4px;
  background: var(--va-admin-sidebar-border);
}
</style>
