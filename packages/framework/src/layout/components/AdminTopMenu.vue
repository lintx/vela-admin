<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import VaIcon from '../../icons/VaIcon.vue'
import type { AdminMenuItem } from '../../menu/create-menu-service'
import AdminFloatingMenu from './AdminFloatingMenu.vue'
import { useTopMenuOverflow } from './use-top-menu-overflow'

interface TopMenuFlyoutState {
  menu: AdminMenuItem
  rect: {
    left: number
    bottom: number
  }
}

const props = withDefaults(defineProps<{
  menus: AdminMenuItem[]
  currentPath?: string
  activePaths?: string[]
  flyout?: boolean
}>(), {
  currentPath: '',
  activePaths: () => [],
  flyout: true,
})

const emit = defineEmits<{
  navigate: [path: string]
}>()

const hoveredMenu = ref<TopMenuFlyoutState | null>(null)
const moreOpen = ref(false)
const moreFlyoutRect = ref({
  left: 0,
  bottom: 0,
})
const menusRef = computed(() => props.menus)
const activeTopPath = computed(() => {
  return props.menus.find((menu) => (
    props.currentPath === menu.path
    || props.activePaths.includes(menu.path)
    || props.currentPath.startsWith(`${menu.path}/`)
  ))?.path ?? props.menus[0]?.path
})
const {
  menuRoot,
  visibleMenus,
  overflowMenus,
  overflowActive,
} = useTopMenuOverflow(menusRef, activeTopPath)
const overflowFlyoutStyle = computed(() => {
  if (!moreOpen.value) {
    return {}
  }

  return {
    '--va-admin-top-menu-flyout-left': `${moreFlyoutRect.value.left}px`,
    '--va-admin-top-menu-flyout-top': `${moreFlyoutRect.value.bottom + 8}px`,
  }
})
const flyoutStyle = computed(() => {
  if (!hoveredMenu.value) {
    return {}
  }

  return {
    '--va-admin-top-menu-flyout-left': `${hoveredMenu.value.rect.left}px`,
    '--va-admin-top-menu-flyout-top': `${hoveredMenu.value.rect.bottom + 8}px`,
  }
})

function isTopMenuInteractiveTarget(target: EventTarget | null): target is Node {
  if (!(target instanceof Node)) {
    return false
  }

  const element = target instanceof Element ? target : target.parentElement

  return Boolean(
    element?.closest(
      '.va-admin-top-menu__item, .va-admin-top-menu__more, .va-admin-top-menu__flyout, .var-tabs__indicator, .var-tabs__indicator-inner',
    )
    || document.querySelector<HTMLElement>('.va-admin-top-menu__flyout')?.contains(target),
  )
}

function handleTopMenuClick(path: string | number) {
  moreOpen.value = false
  const menu = props.menus.find((item) => item.path === path)

  if (!menu) {
    return
  }

  if (menu.children.length > 0) {
    if (!props.flyout) {
      const targetPath = menu.firstNavigableChildPath

      if (targetPath) {
        emit('navigate', targetPath)
      }
    }

    return
  }

  if (!menu.navigable) {
    return
  }

  hoveredMenu.value = null
  const anchor = document.querySelector<HTMLAnchorElement>(`.va-admin-top-menu__link[href="${path}"]`)
  anchor?.click()
}

function updateMoreFlyoutRect() {
  const menuElement = menuRoot.value?.querySelector<HTMLElement>('.va-admin-top-menu__more')
  const rect = menuElement?.getBoundingClientRect()

  moreFlyoutRect.value = {
    left: rect?.left ?? 0,
    bottom: rect?.bottom ?? 0,
  }
}

function handleMoreEnter() {
  hoveredMenu.value = null
  updateMoreFlyoutRect()
  moreOpen.value = true
}

function handleMoreLeave(event: MouseEvent) {
  if (isTopMenuInteractiveTarget(event.relatedTarget)) {
    return
  }

  moreOpen.value = false
}

function handleMoreClick() {
  hoveredMenu.value = null
  updateMoreFlyoutRect()
  moreOpen.value = true
}

function handleFloatingMenuNavigate(path: string) {
  const menu = props.menus.find((item) => item.path === path)

  if (!props.flyout && menu?.children.length) {
    const targetPath = menu.firstNavigableChildPath ?? findFirstNavigableChildPath(menu)

    if (targetPath) {
      emit('navigate', targetPath)
    }

    return
  }

  emit('navigate', path)
}

function findFirstNavigableChildPath(menu: AdminMenuItem): string | undefined {
  for (const child of menu.children) {
    if (child.navigable) {
      return child.path
    }

    const childPath = findFirstNavigableChildPath(child)

    if (childPath) {
      return childPath
    }
  }

  return undefined
}

function handleMenuEnter(menu: AdminMenuItem, event?: MouseEvent | FocusEvent) {
  moreOpen.value = false

  if (!props.flyout || menu.children.length === 0) {
    hoveredMenu.value = null
    return
  }

  const menuElement = event?.currentTarget instanceof HTMLElement
    ? event.currentTarget
    : menuRoot.value?.querySelector<HTMLElement>(`.va-admin-top-menu__item[data-menu-path="${menu.path}"]`)
  const rect = menuElement?.getBoundingClientRect()

  hoveredMenu.value = {
    menu,
    rect: {
      left: rect?.left ?? 0,
      bottom: rect?.bottom ?? 0,
    },
  }
}

function handleMenuLeave(event: MouseEvent) {
  if (isTopMenuInteractiveTarget(event.relatedTarget)) {
    return
  }

  hoveredMenu.value = null
}

function handleTopMenuLeave(event: MouseEvent) {
  const relatedTarget = event.relatedTarget
  const currentTarget = event.currentTarget as HTMLElement | null
  const flyout = currentTarget?.querySelector<HTMLElement>('.va-admin-top-menu__flyout')
    ?? document.querySelector<HTMLElement>('.va-admin-top-menu__flyout')

  if (
    relatedTarget instanceof Node
    && (
      flyout?.contains(relatedTarget)
      || relatedTarget instanceof Element && relatedTarget.closest('.va-admin-top-menu__more')
    )
  ) {
    return
  }

  hoveredMenu.value = null
  moreOpen.value = false
}

function handleFlyoutLeave(event: MouseEvent) {
  if (isTopMenuInteractiveTarget(event.relatedTarget)) {
    return
  }

  hoveredMenu.value = null
  moreOpen.value = false
}

function handleWindowResize() {
  if (!moreOpen.value) {
    return
  }

  nextTick(updateMoreFlyoutRect)
}

watch(overflowMenus, () => {
  if (!moreOpen.value) {
    return
  }

  nextTick(updateMoreFlyoutRect)
})

onMounted(() => {
  window.addEventListener('resize', handleWindowResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize)
})
</script>

<template>
  <nav ref="menuRoot" class="va-admin-top-menu" aria-label="顶部菜单" @mouseleave="handleTopMenuLeave">
    <var-tabs
      class="va-admin-top-menu__tabs"
      :active="activeTopPath"
      active-color="var(--va-admin-menu-active-text)"
      inactive-color="var(--va-admin-menu-text)"
      indicator-color="var(--va-admin-menu-indicator)"
      :elevation="false"
      scrollable="always"
      @click="handleTopMenuClick"
    >
      <template v-for="menu in visibleMenus" :key="menu.path">
        <var-tab
          class="va-admin-top-menu__item"
          :class="{
            'va-admin-top-menu__item--active': currentPath === menu.path || activePaths.includes(menu.path),
          }"
          :data-menu-path="menu.path"
          :name="menu.path"
          @mouseenter="handleMenuEnter(menu, $event)"
          @mouseleave="handleMenuLeave"
          @focusin="handleMenuEnter(menu, $event)"
        >
          <RouterLink v-if="menu.navigable && menu.children.length === 0" class="va-admin-top-menu__link" :to="menu.path" tabindex="-1">
            <VaIcon v-if="menu.icon" class="va-admin-top-menu__icon" :name="menu.icon" />
            <span class="va-admin-top-menu__label">{{ menu.title }}</span>
          </RouterLink>
          <span v-else class="va-admin-top-menu__link va-admin-top-menu__link--group">
            <VaIcon v-if="menu.icon" class="va-admin-top-menu__icon" :name="menu.icon" />
            <span class="va-admin-top-menu__label">{{ menu.title }}</span>
          </span>
        </var-tab>
      </template>
    </var-tabs>

    <button
      v-if="overflowMenus.length"
      class="va-admin-top-menu__more"
      :class="{ 'va-admin-top-menu__more--active': overflowActive }"
      type="button"
      data-testid="admin-top-menu-more"
      :aria-expanded="moreOpen"
      @click="handleMoreClick"
      @mouseenter="handleMoreEnter"
      @mouseleave="handleMoreLeave"
      @focusin="handleMoreEnter"
    >
      <span class="va-admin-top-menu__label">更多</span>
      <VaIcon class="va-admin-top-menu__more-icon" library="tabler" name="chevron-right" :size="20" />
    </button>

    <div
      v-if="flyout && hoveredMenu"
      class="va-admin-top-menu__flyout"
      :style="flyoutStyle"
      role="menu"
      @mouseleave="handleFlyoutLeave"
    >
      <div class="va-admin-top-menu__flyout-panel va-admin-scrollbar">
        <AdminFloatingMenu
          :menus="hoveredMenu.menu.children"
          :active-paths="activePaths"
          :current-path="currentPath"
          @navigate="handleFloatingMenuNavigate"
        />
      </div>
    </div>

    <div
      v-if="moreOpen"
      class="va-admin-top-menu__flyout"
      :style="overflowFlyoutStyle"
      role="menu"
      @mouseleave="handleFlyoutLeave"
    >
      <div class="va-admin-top-menu__flyout-panel va-admin-scrollbar" data-testid="admin-top-menu-overflow">
        <AdminFloatingMenu
          :menus="overflowMenus"
          :active-paths="activePaths"
          :current-path="currentPath"
          :cascade="flyout"
          :navigate-parent="!flyout"
          @navigate="handleFloatingMenuNavigate"
        />
      </div>
    </div>
  </nav>
</template>

<style scoped>
.va-admin-top-menu {
  position: relative;
  display: flex;
  align-items: stretch;
  flex: 1 1 0;
  min-width: 120px;
  max-width: 100%;
  overflow: hidden;
}

.va-admin-top-menu__tabs {
  flex: 0 1 auto;
  min-width: 0;
  width: auto;
  max-width: 100%;
  height: var(--va-admin-header-height);
  padding-right: 0;
  background: transparent;
}

.va-admin-top-menu__tabs :deep(.var-tabs) {
  background: transparent;
}

.va-admin-top-menu__tabs :deep(.var-tabs__tab-wrap) {
  height: var(--va-admin-header-height);
}

.va-admin-top-menu__tabs :deep(.var-tabs__indicator) {
  display: none;
}

.va-admin-top-menu__item {
  position: relative;
  max-width: 148px;
  height: var(--va-admin-header-height);
}

.va-admin-top-menu__item:hover {
  background: var(--va-admin-menu-active-bg);
}

.va-admin-top-menu__item--active::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  content: '';
  background: var(--va-admin-menu-indicator);
}

.va-admin-top-menu__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  width: 100%;
  gap: 6px;
  color: inherit;
  text-decoration: none;
}

.va-admin-top-menu__icon {
  font-size: 20px;
}

.va-admin-top-menu__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.va-admin-top-menu__more {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: var(--va-admin-header-height);
  padding: 0 12px;
  gap: 4px;
  font-family: inherit;
  font-size: 14px;
  color: var(--va-admin-menu-text);
  cursor: pointer;
  background: transparent;
  border: 0;
}

.va-admin-top-menu__more:hover,
.va-admin-top-menu__more--active {
  color: var(--va-admin-menu-active-text);
  background: var(--va-admin-menu-active-bg);
}

.va-admin-top-menu__more--active {
  color: var(--va-admin-menu-active-text);
}

.va-admin-top-menu__more--active::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  content: '';
  background: var(--va-admin-menu-indicator);
}

.va-admin-top-menu__more-icon {
  font-size: 18px;
}

.va-admin-top-menu__flyout {
  position: fixed;
  top: calc(var(--va-admin-top-menu-flyout-top) - 8px);
  left: var(--va-admin-top-menu-flyout-left);
  z-index: 30;
  box-sizing: border-box;
  min-width: 220px;
  padding-top: 8px;
}

.va-admin-top-menu__flyout-panel {
  --va-admin-floating-menu-max-height: calc(100dvh - var(--va-admin-header-height) - 24px);

  box-sizing: border-box;
  min-width: max-content;
  max-height: var(--va-admin-floating-menu-max-height);
  padding: 0;
  overflow: visible;
}

</style>
