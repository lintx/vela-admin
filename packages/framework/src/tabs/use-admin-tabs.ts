import { getCurrentScope, nextTick, onScopeDispose, ref, shallowReadonly, watch, type Ref } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'

import type { PermissionService } from '../permission/create-permission-service'
import type { SettingsService } from '../settings/create-settings-service'
import * as tabsControllerUtils from './admin-tabs-controller-utils'
import { createTabsService, type AdminTab } from './create-tabs-service'

export interface UseAdminTabsOptions {
  router: Router
  route: RouteLocationNormalizedLoaded
  settings: SettingsService
  permission?: PermissionService | null
  homePath?: string
  resolveScroller?: () => HTMLElement | null
  requestFrame?: (callback: FrameRequestCallback) => number
}

export interface AdminTabsController {
  tabs: Readonly<Ref<AdminTab[]>>
  maximized: Readonly<Ref<boolean>>
  syncCurrentTab(): void
  closeTab(path: string): void
  closeOtherTabs(path: string): void
  closeLeftTabs(path: string): void
  closeRightTabs(path: string): void
  closeAllTabs(): void
  pinTab(path: string): void
  reorderTab(path: string, targetPath: string): void
  refreshTab(path?: string): void
  maximize(): void
  restore(): void
  getRouteCacheKey(route: RouteLocationNormalizedLoaded): string
  saveScroll(path?: string): void
  restoreScroll(path?: string): void
  dispose(): void
}

interface ScrollPosition { top: number; left: number }

export function useAdminTabs(options: UseAdminTabsOptions): AdminTabsController {
  const homePath = options.homePath ?? options.settings.settings.value.homePath
  const homeTitle = resolveTabTitle(homePath, homePath)
  const service = createTabsService({
    fixedTabs: [{ path: homePath, title: homeTitle }],
  })
  const tabsState = ref<AdminTab[]>(service.getTabs())
  const maximizedState = ref(false)
  const cacheVersions = ref<Record<string, number>>({})
  const scrollPositions = ref<Record<string, ScrollPosition>>({})
  let disposed = false
  let closeOperationGeneration = 0
  let scrollRestoreGeneration = 0

  reconcileFixedTabs()
  syncCurrentTab()

  const stopRouteWatch = watch(
    () => options.route.path,
    (nextPath, previousPath) => {
      if (disposed) {
        return
      }
      saveScroll(previousPath)
      syncCurrentTab()
      restoreScroll(nextPath)
    },
  )
  const stopSettingsWatch = watch(
    () => options.settings.settings.value.tabs?.fixedTabs,
    reconcileFixedTabs,
    { deep: true },
  )

  function resolveTabTitle(path: string, fallback = path) {
    return String(options.router.resolve(path).meta?.title || fallback || path)
  }

  function reconcileFixedTabs() {
    tabsControllerUtils.reconcileFixedTabs({
      service,
      fixedTabs: options.settings.settings.value.tabs?.fixedTabs,
      homePath,
      router: options.router,
      permission: options.permission,
      resolveTitle: resolveTabTitle,
    })
    syncTabs()
  }

  function syncTabs() {
    tabsState.value = service.getTabs()
  }

  function syncCurrentTab() {
    if (options.route.meta?.layout === 'plain') {
      syncTabs()
      return
    }
    service.addTab({
      path: options.route.path,
      title: resolveTabTitle(options.route.path, String(options.route.meta?.title ?? options.route.path)),
    })
    syncTabs()
  }

  function clearTabsState(paths: string[]) {
    const nextScrollPositions = { ...scrollPositions.value }
    paths.forEach((path) => {
      cacheVersions.value = {
        ...cacheVersions.value,
        [path]: (cacheVersions.value[path] ?? 0) + 1,
      }
      delete nextScrollPositions[path]
    })
    scrollPositions.value = nextScrollPositions
  }

  function navigateBeforeCommit(fallbackPath: string, generation: number, commit: () => void) {
    const targetPath = options.router.resolve(fallbackPath).fullPath
    options.router.push(fallbackPath).then((failure) => {
      const currentRoute = options.router.currentRoute.value
      if (disposed || generation !== closeOperationGeneration || failure || currentRoute.fullPath !== targetPath || currentRoute.redirectedFrom) {
        return
      }
      commit()
    }).catch(() => {
      // 导航拒绝属于关闭动作失败，保留现有标签状态且不产生未处理 Promise。
    })
  }

  function commitRemoval(paths: string[]) {
    const removed = paths.flatMap((path) => {
      const tab = service.closeCurrent(path)
      return tab ? [tab] : []
    })
    clearTabsState(removed.map(tab => tab.path))
    syncTabs()
  }

  function coordinateBatchClose(
    generation: number,
    fallbackPath: string,
    shouldRemove: (tab: AdminTab, index: number, tabs: AdminTab[]) => boolean,
  ) {
    const currentTabs = service.getTabs()
    const removedPaths = currentTabs.filter((tab, index) => shouldRemove(tab, index, currentTabs)).map(tab => tab.path)
    const removesCurrent = removedPaths.includes(options.route.path)
    const commit = () => commitRemoval(removedPaths)
    if (removesCurrent && fallbackPath !== options.route.path) {
      navigateBeforeCommit(fallbackPath, generation, commit)
      return
    }
    commit()
  }

  function closeTab(path: string) {
    const generation = ++closeOperationGeneration
    const previousTabs = service.getTabs()
    const targetTab = previousTabs.find(tab => tab.path === path)
    if (!targetTab || targetTab.fixed || targetTab.closable === false) {
      return
    }
    const closingCurrentTab = path === options.route.path
    const nextPath = closingCurrentTab
      ? tabsControllerUtils.resolveNextTabPathAfterClose(previousTabs, path, homePath)
      : ''
    const commit = () => commitRemoval([path])
    if (closingCurrentTab && nextPath !== options.route.path) {
      navigateBeforeCommit(nextPath, generation, commit)
      return
    }
    commit()
  }

  function closeOtherTabs(path: string) {
    const generation = ++closeOperationGeneration
    coordinateBatchClose(
      generation,
      path,
      tab => tab.path !== path && !tab.fixed && tab.closable !== false,
    )
  }

  function closeLeftTabs(path: string) {
    const generation = ++closeOperationGeneration
    const targetIndex = service.getTabs().findIndex(tab => tab.path === path)
    coordinateBatchClose(
      generation,
      path,
      (tab, index) => targetIndex >= 0 && index < targetIndex && !tab.fixed && tab.closable !== false,
    )
  }

  function closeRightTabs(path: string) {
    const generation = ++closeOperationGeneration
    const targetIndex = service.getTabs().findIndex(tab => tab.path === path)
    coordinateBatchClose(
      generation,
      path,
      (tab, index) => targetIndex >= 0 && index > targetIndex && !tab.fixed && tab.closable !== false,
    )
  }

  function closeAllTabs() {
    const generation = ++closeOperationGeneration
    const previousTabs = service.getTabs()
    const removedTabs = previousTabs.filter(tab => !tab.fixed && tab.closable !== false)
    coordinateBatchClose(
      generation,
      tabsControllerUtils.resolveFallbackPathAfterBatchClose(previousTabs, removedTabs, options.route.path, homePath),
      tab => !tab.fixed && tab.closable !== false,
    )
  }

  function persistFixedTabs() {
    options.settings.updateSettings({
      tabs: {
        fixedTabs: service.getTabs()
          .filter(tab => tab.fixed && tab.path !== homePath)
          .map(tab => ({ path: tab.path, title: tab.title })),
      },
    })
  }

  function pinTab(path: string) {
    const tab = service.getTabs().find(item => item.path === path)
    if (!tab || tab.closable === false) {
      return
    }
    service.addTab({ ...tab, fixed: !tab.fixed, closable: true })
    syncTabs()
    persistFixedTabs()
  }

  function reorderTab(path: string, targetPath: string) {
    if (service.moveTab(path, targetPath)) {
      syncTabs()
      persistFixedTabs()
    }
  }

  function getRouteCacheKey(route: RouteLocationNormalizedLoaded) {
    return `${route.path}:${cacheVersions.value[route.path] ?? 0}`
  }

  function refreshTab(path = options.route.path) {
    cacheVersions.value = {
      ...cacheVersions.value,
      [path]: (cacheVersions.value[path] ?? 0) + 1,
    }
    delete scrollPositions.value[path]
    syncCurrentTab()
    restoreScroll(path)
  }

  function resolveScroller() {
    return options.resolveScroller
      ? options.resolveScroller()
      : typeof document === 'undefined' ? null : document.getElementById('va-admin-main')
  }

  function saveScroll(path = options.route.path) {
    if (!options.settings.settings.value.layout.tagsView) {
      return
    }
    const scroller = resolveScroller()
    if (!scroller) {
      return
    }
    scrollPositions.value = {
      ...scrollPositions.value,
      [path]: { top: scroller.scrollTop, left: scroller.scrollLeft },
    }
  }

  function restoreScroll(path = options.route.path) {
    const generation = ++scrollRestoreGeneration
    if (!options.settings.settings.value.layout.tagsView) {
      return
    }
    nextTick(() => {
      if (disposed || generation !== scrollRestoreGeneration) {
        return
      }
      const run = () => {
        if (disposed || generation !== scrollRestoreGeneration) {
          return
        }
        const scroller = resolveScroller()
        if (!scroller) {
          return
        }
        const position = scrollPositions.value[path]
        scroller.scrollTop = position?.top ?? 0
        scroller.scrollLeft = position?.left ?? 0
      }
      if (options.requestFrame) {
        options.requestFrame(() => run())
      } else if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(run)
      } else {
        run()
      }
    })
  }

  function maximize() { maximizedState.value = true }

  function restore() { maximizedState.value = false }

  function dispose() {
    if (disposed) {
      return
    }
    disposed = true
    closeOperationGeneration += 1
    scrollRestoreGeneration += 1
    stopRouteWatch()
    stopSettingsWatch()
  }

  const controller: AdminTabsController = {
    tabs: shallowReadonly(tabsState),
    maximized: shallowReadonly(maximizedState),
    syncCurrentTab,
    closeTab,
    closeOtherTabs,
    closeLeftTabs,
    closeRightTabs,
    closeAllTabs,
    pinTab,
    reorderTab,
    refreshTab,
    maximize,
    restore,
    getRouteCacheKey,
    saveScroll,
    restoreScroll,
    dispose,
  }

  if (getCurrentScope()) {
    onScopeDispose(dispose)
  }

  return controller
}
