import { computed, nextTick, onBeforeUnmount, onMounted, ref, type ComputedRef, type Ref, watch } from 'vue'

import type { AdminMenuItem } from '../../menu/create-menu-service'
import { resolveTopMenuOverflow } from './top-menu-overflow'

export function useTopMenuOverflow(menus: ComputedRef<AdminMenuItem[]>, activePath: ComputedRef<string>) {
  const menuRoot = ref<HTMLElement | null>(null)
  const measuredWidths = ref<Record<string, number>>({})
  const overflowState = ref({
    visiblePaths: [] as string[],
    overflowPaths: [] as string[],
    overflowActive: false,
  })
  let resizeObserver: ResizeObserver | null = null

  const visiblePathSet = computed(() => {
    if (overflowState.value.visiblePaths.length === 0) {
      return new Set(menus.value.map((menu) => menu.path))
    }

    return new Set(overflowState.value.visiblePaths)
  })
  const overflowPathSet = computed(() => new Set(overflowState.value.overflowPaths))
  const visibleMenus = computed(() => menus.value.filter((menu) => visiblePathSet.value.has(menu.path)))
  const overflowMenus = computed(() => menus.value.filter((menu) => overflowPathSet.value.has(menu.path)))
  const overflowActive = computed(() => overflowState.value.overflowActive)

  function measureTopMenu() {
    const root = menuRoot.value

    if (!root) {
      return
    }

    const availableWidth = root.getBoundingClientRect().width
    if (availableWidth <= 0) {
      overflowState.value = {
        visiblePaths: menus.value.map((menu) => menu.path),
        overflowPaths: [],
        overflowActive: false,
      }
      return
    }

    const nextWidths = { ...measuredWidths.value }
    root
      .querySelectorAll<HTMLElement>('.va-admin-top-menu__item[data-menu-path]')
      .forEach((element) => {
        const path = element.dataset.menuPath
        const width = element.getBoundingClientRect().width

        if (path && width > 0) {
          nextWidths[path] = width
        }
      })

    measuredWidths.value = nextWidths

    const menuWidths = menus.value.map((menu) => ({
      path: menu.path,
      width: nextWidths[menu.path] ?? 96,
    }))
    const moreWidth = root.querySelector<HTMLElement>('.va-admin-top-menu__more')?.getBoundingClientRect().width ?? 72

    overflowState.value = resolveTopMenuOverflow({
      menuWidths,
      availableWidth,
      overflowWidth: moreWidth,
      activePath: activePath.value,
    })
  }

  function scheduleMeasureTopMenu() {
    nextTick(measureTopMenu)
  }

  onMounted(() => {
    scheduleMeasureTopMenu()

    if (typeof ResizeObserver !== 'undefined' && menuRoot.value) {
      resizeObserver = new ResizeObserver(scheduleMeasureTopMenu)
      resizeObserver.observe(menuRoot.value)
      return
    }

    window.addEventListener('resize', scheduleMeasureTopMenu)
  })

  watch([menus, activePath], scheduleMeasureTopMenu, { deep: true })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    window.removeEventListener('resize', scheduleMeasureTopMenu)
  })

  return {
    menuRoot: menuRoot as Ref<HTMLElement | null>,
    visibleMenus,
    overflowMenus,
    overflowActive,
  }
}
