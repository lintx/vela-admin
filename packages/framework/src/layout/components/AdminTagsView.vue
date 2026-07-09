<script setup lang="ts">
import { Ripple } from '@varlet/ui'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import VaContextMenu from '../../components/context-menu/VaContextMenu.vue'
import type { VaContextMenuGroupOption, VaContextMenuItemValue } from '../../components/context-menu/context-menu-types'
import VaSortable from '../../components/sortable/VaSortable.vue'
import type { VaSortableDropContext, VaSortablePayload } from '../../components/sortable/sortable-types'
import VaIcon from '../../icons/VaIcon.vue'
import type { AdminTab } from '../../tabs/create-tabs-service'

const vRipple = Ripple

const props = withDefaults(defineProps<{
  tabs: AdminTab[]
  currentPath?: string
  maximized?: boolean
  mobile?: boolean
}>(), {
  currentPath: '',
  maximized: false,
  mobile: false,
})

const emit = defineEmits<{
  navigate: [path: string]
  close: [path: string]
  closeOthers: [path: string]
  closeLeft: [path: string]
  closeRight: [path: string]
  closeAll: []
  refresh: [path: string]
  pin: [path: string]
  reorder: [path: string, targetPath: string]
  maximize: []
  restore: []
}>()

const listRef = ref<HTMLElement | null>(null)
const menuOpen = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const contextPath = ref('')
const scrolledToEnd = ref(false)

type TagMenuAction = 'navigate' | 'refresh' | 'pin' | 'maximize' | 'close' | 'close-others' | 'close-left' | 'close-right' | 'close-all'

const contextTab = computed(() => props.tabs.find((tab) => tab.path === contextPath.value))
const contextMenuGroups = computed<VaContextMenuGroupOption[]>(() => {
  const tab = contextTab.value
  const closeDisabled = !tab || !canClose(tab)
  const primaryGroup: VaContextMenuGroupOption = []

  if (tab && tab.path !== props.currentPath) {
    primaryGroup.push(createMenuOption('切换到此标签', 'navigate', 'tabs'))
  }

  primaryGroup.push(createMenuOption('刷新', 'refresh', 'refresh'))

  if (tab && canPin(tab)) {
    primaryGroup.push(createMenuOption(tab.fixed ? '取消固定' : '固定', 'pin', tab.fixed ? 'pin-off' : 'pin'))
  }

  primaryGroup.push(createMenuOption('最大化', 'maximize', 'maximize'))

  const closeGroup: VaContextMenuGroupOption = []
  if (!closeDisabled) {
    closeGroup.push(createMenuOption('关闭', 'close', 'close'))
  }

  closeGroup.push(
    createMenuOption('关闭左侧', 'close-left', 'text-outdent'),
    createMenuOption('关闭右侧', 'close-right', 'text-indent'),
    createMenuOption('关闭其他', 'close-others', 'tabs'),
  )

  return [
    primaryGroup,
    closeGroup,
    [
      createMenuOption('关闭全部', 'close-all', 'close'),
    ],
  ]
})

function canClose(tab: AdminTab) {
  return !tab.fixed && tab.closable !== false
}

function canPin(tab: AdminTab) {
  return tab.closable !== false
}

function scrollTags(direction: 'left' | 'right') {
  const list = listRef.value
  if (!list) {
    return
  }

  const distance = Math.max(160, Math.floor(list.clientWidth * 0.8))
  list.scrollBy({
    left: direction === 'left' ? -distance : distance,
    behavior: 'smooth',
  })
}

function updateScrollEdge() {
  const list = listRef.value
  if (!list) {
    scrolledToEnd.value = false
    return
  }

  const hasOverflow = list.scrollWidth > list.clientWidth + 1
  scrolledToEnd.value = hasOverflow && list.scrollLeft + list.clientWidth >= list.scrollWidth - 1
}

function scrollActiveTabIntoView() {
  const activeTab = Array.from(listRef.value?.querySelectorAll<HTMLElement>('.va-admin-tags-view__item') ?? [])
    .find(item => item.querySelector<HTMLElement>(`[data-testid="admin-tag-${props.currentPath}"]`))

  activeTab?.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
    behavior: 'smooth',
  })
  nextTick(updateScrollEdge)
}

async function openContextMenu(event: MouseEvent | KeyboardEvent, tab: AdminTab) {
  event.preventDefault()
  contextPath.value = tab.path
  updateContextMenuPosition(event)
  menuOpen.value = true
  await nextTick()

  window.setTimeout(() => {
    document.addEventListener('click', closeContextMenu, { once: true })
  })
}

function updateContextMenuPosition(event: MouseEvent | KeyboardEvent) {
  if ('clientX' in event && (event.clientX > 0 || event.clientY > 0)) {
    menuX.value = event.clientX
    menuY.value = event.clientY
    return
  }

  const target = event.currentTarget
  if (target instanceof HTMLElement) {
    const rect = target.getBoundingClientRect()
    menuX.value = rect.left
    menuY.value = rect.bottom
    return
  }

  menuX.value = 0
  menuY.value = 0
}

function closeContextMenu() {
  menuOpen.value = false
}

function handleAuxClick(event: MouseEvent, tab: AdminTab) {
  if (event.button === 1 && canClose(tab)) {
    event.preventDefault()
    emit('close', tab.path)
  }
}

function handleTabClick(event: MouseEvent, tab: AdminTab) {
  if (props.mobile) {
    openContextMenu(event, tab)
    return
  }

  emit('navigate', tab.path)
}

function handleTabPointerUp(event: PointerEvent, tab: AdminTab) {
  if (!props.mobile || event.button !== 0) {
    return
  }

  openContextMenu(event, tab)
}

function handleTabKeydown(event: KeyboardEvent, tab: AdminTab) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('navigate', tab.path)
    return
  }

  if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
    openContextMenu(event, tab)
  }
}

function handleTabReorder(payload: VaSortablePayload<AdminTab>) {
  const path = payload.keys[0]
  const targetPath = props.tabs[payload.toIndex]?.path ?? props.tabs.at(-1)?.path
  if (typeof path === 'string' && targetPath && path !== targetPath) {
    emit('reorder', path, targetPath)
  }
}

function canDropTab(context: VaSortableDropContext<AdminTab>) {
  const tabMap = new Map(props.tabs.map(tab => [tab.path, tab]))
  const ranks = context.previewKeys.map((key) => getTabFixedRank(tabMap.get(String(key))))

  return ranks.every((rank, index) => index === 0 || rank >= ranks[index - 1])
}

function getTabFixedRank(tab: AdminTab | undefined) {
  if (tab?.fixed && tab.closable === false) {
    return 0
  }

  if (tab?.fixed) {
    return 1
  }

  return 2
}

function handleMenuSelect(value: VaContextMenuItemValue) {
  const action = value as TagMenuAction
  const tab = contextTab.value
  if (!tab) {
    closeContextMenu()
    return
  }

  if (action === 'navigate') {
    emit('navigate', tab.path)
  } else if (action === 'refresh') {
    emit('refresh', tab.path)
  } else if (action === 'pin') {
    emit('pin', tab.path)
  } else if (action === 'maximize') {
    emit('maximize')
  } else if (action === 'close' && canClose(tab)) {
    emit('close', tab.path)
  } else if (action === 'close-others') {
    emit('closeOthers', tab.path)
  } else if (action === 'close-left') {
    emit('closeLeft', tab.path)
  } else if (action === 'close-right') {
    emit('closeRight', tab.path)
  } else if (action === 'close-all') {
    emit('closeAll')
  }

  closeContextMenu()
}

function createMenuOption(text: string, value: TagMenuAction, icon: string, disabled = false) {
  return {
    type: 'item' as const,
    text,
    value,
    icon,
    disabled,
  }
}

watch(() => props.currentPath, () => {
  nextTick(scrollActiveTabIntoView)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeContextMenu)
})
</script>

<template>
  <nav
    class="va-admin-tags-view"
    :class="{ 'va-admin-tags-view--scroll-end': scrolledToEnd }"
    aria-label="标签页导航"
  >
    <button
      v-ripple
      class="va-admin-tags-view__scroll"
      type="button"
      aria-label="向左滚动标签"
      data-testid="admin-tags-scroll-left"
      @click="scrollTags('left')"
    >
      <VaIcon library="tabler" name="chevron-left" :size="22" />
    </button>

    <div ref="listRef" class="va-admin-tags-view__list" @scroll="updateScrollEdge">
      <VaSortable
        list-id="admin-tags"
        class="va-admin-tags-view__items"
        :items="tabs"
        item-key="path"
        strategy="horizontal-list"
        :disabled="mobile"
        :can-drop="canDropTab"
        @reorder="handleTabReorder"
      >
        <template #item="{ item: tab, handleProps }">
          <div
            class="va-admin-tags-view__item"
            :class="{
              'va-admin-tags-view__item--active': tab.path === currentPath,
              'va-admin-tags-view__item--fixed': tab.fixed,
            }"
            @auxclick="handleAuxClick($event, tab)"
          >
            <div
              v-ripple
              class="va-admin-tags-view__surface"
              role="link"
              tabindex="0"
              :aria-current="tab.path === currentPath ? 'page' : undefined"
              @pointerup="handleTabPointerUp($event, tab)"
              @click="handleTabClick($event, tab)"
              @keydown="handleTabKeydown($event, tab)"
              @contextmenu="openContextMenu($event, tab)"
            >
              <button
                v-if="!mobile"
                class="va-admin-tags-view__drag"
                type="button"
                :data-testid="`admin-tag-drag-${tab.path}`"
                v-bind="handleProps"
                @click.stop
                @keydown.stop
              >
                <VaIcon library="tabler" name="grip-vertical" :size="16" />
              </button>

              <span
                class="va-admin-tags-view__content"
                :data-testid="`admin-tag-${tab.path}`"
              >
                <VaIcon v-if="tab.fixed && canPin(tab)" name="pin" class="va-admin-tags-view__pin" :size="18" />
                <span class="va-admin-tags-view__title">{{ tab.title }}</span>
              </span>

              <button
                v-if="canClose(tab)"
                v-ripple
                class="va-admin-tags-view__close va-admin-tags-view__close--round"
                type="button"
                :aria-label="`关闭${tab.title}`"
                @click.stop="emit('close', tab.path)"
              >
                <VaIcon name="close" :size="20" />
              </button>
            </div>
          </div>
        </template>
      </VaSortable>
    </div>

    <button
      v-ripple
      class="va-admin-tags-view__scroll va-admin-tags-view__scroll--right"
      type="button"
      aria-label="向右滚动标签"
      data-testid="admin-tags-scroll-right"
      @click="scrollTags('right')"
    >
      <VaIcon library="tabler" name="chevron-right" :size="22" />
    </button>

    <button
      v-ripple
      class="va-admin-tags-view__maximize"
      type="button"
      :aria-label="maximized ? '还原标签布局' : '最大化标签内容'"
      :data-testid="maximized ? 'admin-tags-restore' : 'admin-tags-maximize'"
      @click="maximized ? emit('restore') : emit('maximize')"
    >
      <VaIcon :name="maximized ? 'minimize' : 'maximize'" :size="20" />
    </button>

    <VaContextMenu
      v-model:show="menuOpen"
      trigger="manual"
      :groups="contextMenuGroups"
      :x="menuX"
      :y="menuY"
      menu-test-id="admin-tag-context-menu"
      item-test-id-prefix="admin-tag-menu"
      divider-test-id="admin-tag-menu-divider"
      item-class="va-admin-tags-view__menu-option"
      @select="handleMenuSelect"
    >
      <span />
    </VaContextMenu>
  </nav>
</template>

<style scoped>
.va-admin-tags-view {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  box-sizing: border-box;
  height: var(--va-admin-tags-view-height);
  min-height: var(--va-admin-tags-view-height);
  color: var(--color-on-surface-variant);
  background: var(--color-body);
  border-bottom: 1px solid var(--va-admin-sidebar-border);
}

.va-admin-tags-view__scroll,
.va-admin-tags-view__maximize,
.va-admin-tags-view__close {
  position: relative;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.va-admin-tags-view__scroll,
.va-admin-tags-view__maximize,
.va-admin-tags-view__close {
  overflow: hidden;
}

.va-admin-tags-view__scroll {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: var(--va-admin-tags-view-height);
  border-right: 1px solid var(--va-admin-sidebar-border);
}

.va-admin-tags-view__scroll--right {
  border-right: 0;
  border-left: 1px solid var(--va-admin-sidebar-border);
}

.va-admin-tags-view__maximize {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: var(--va-admin-tags-view-height);
  border-left: 1px solid var(--va-admin-sidebar-border);
}

.va-admin-tags-view__list {
  display: flex;
  min-width: 0;
  height: var(--va-admin-tags-view-height);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.va-admin-tags-view__list::-webkit-scrollbar {
  display: none;
}

.va-admin-tags-view__items {
  display: flex;
  flex: 0 0 auto;
  min-width: max-content;
  height: var(--va-admin-tags-view-height);
}

.va-admin-tags-view__items :deep(.va-sortable__placeholder) {
  background-color: transparent;
}

.va-admin-tags-view__item {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  box-sizing: border-box;
  max-width: 220px;
  height: var(--va-admin-tags-view-height);
  border-right: 1px solid var(--va-admin-sidebar-border);
}

.va-admin-tags-view--scroll-end .va-admin-tags-view__item:last-child {
  border-right-color: transparent;
}

.va-admin-tags-view__item--active {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.va-admin-tags-view__item--active::after {
  position: absolute;
  z-index: 2;
  right: -1px;
  bottom: 0;
  left: -1px;
  height: 2px;
  content: "";
  pointer-events: none;
  background: var(--color-primary);
}

.va-admin-tags-view__surface {
  position: relative;
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  height: var(--va-admin-tags-view-height);
  min-width: 0;
  color: inherit;
  cursor: pointer;
  background: transparent;
}

.va-admin-tags-view__drag {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: var(--va-admin-tags-view-height);
  margin-left: 4px;
  color: inherit;
  cursor: grab;
  background: transparent;
  border: 0;
  opacity: 0.58;
}

.va-admin-tags-view__drag:active {
  cursor: grabbing;
}

.va-admin-tags-view__content {
  display: inline-flex;
  flex: 1 1 auto;
  align-items: center;
  min-width: 0;
  height: var(--va-admin-tags-view-height);
  padding: 0 10px;
  gap: 6px;
}

.va-admin-tags-view__drag + .va-admin-tags-view__content {
  padding-left: 4px;
}

.va-admin-tags-view__title {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.va-admin-tags-view__pin {
  flex: 0 0 auto;
  font-size: 14px;
}

.va-admin-tags-view__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 14px;
  color: inherit;
  border-radius: 50%;
}

.va-admin-tags-view__close--round {
  border-radius: 50%;
}

.va-admin-tags-view__scroll:hover,
.va-admin-tags-view__maximize:hover,
.va-admin-tags-view__item:hover .va-admin-tags-view__surface,
.va-admin-tags-view__close:hover {
  background: var(--va-admin-menu-hover-bg);
}
</style>
