import type { Router } from 'vue-router'

import type { PermissionService } from '../permission/create-permission-service'
import type { AdminTab, TabsService } from './create-tabs-service'

interface FixedTabInput {
  path: string
  title: string
}

interface ReconcileFixedTabsOptions {
  service: TabsService
  fixedTabs?: FixedTabInput[]
  homePath: string
  router: Router
  permission?: PermissionService | null
  resolveTitle: (path: string, fallback: string) => string
}

function canAccessTabPath(router: Router, permission: PermissionService | null | undefined, path: string) {
  const resolved = router.resolve(path)
  if (!resolved.matched.length) {
    return false
  }
  const routePermission = resolved.meta?.permission
  const requiredPermission = typeof routePermission === 'string' ? routePermission : Array.isArray(routePermission)
    ? routePermission.filter((item): item is string => typeof item === 'string') : undefined
  if (!requiredPermission) {
    return true
  }
  return Boolean(permission?.isLoggedIn() && permission.hasPermission(requiredPermission))
}

export function reconcileFixedTabs(options: ReconcileFixedTabsOptions) {
  const seenPaths = new Set([options.homePath])
  const fixedTabs = (options.fixedTabs ?? []).flatMap((tab) => {
    if (
      !tab?.path ||
      seenPaths.has(tab.path) ||
      !canAccessTabPath(options.router, options.permission, tab.path)
    ) {
      return []
    }
    seenPaths.add(tab.path)
    return [{ path: tab.path, title: options.resolveTitle(tab.path, tab.title) }]
  })

  // 远端固定列表只调整内存标签状态，不通过 SettingsService 回写形成同步循环。
  const fixedPaths = new Set(fixedTabs.map(tab => tab.path))
  options.service.getTabs().forEach((tab) => {
    if (tab.path !== options.homePath && tab.fixed && !fixedPaths.has(tab.path)) {
      options.service.addTab({ ...tab, fixed: false, closable: true })
    }
  })
  fixedTabs.forEach(tab => options.service.addTab({ ...tab, fixed: true, closable: true }))
  fixedTabs.forEach((tab, index) => {
    const currentTab = options.service.getTabs()[index + 1]
    if (currentTab && currentTab.path !== tab.path) {
      options.service.moveTab(tab.path, currentTab.path)
    }
  })
}

export function resolveNextTabPathAfterClose(previousTabs: AdminTab[], closingPath: string, homePath: string) {
  const closingIndex = previousTabs.findIndex(tab => tab.path === closingPath)
  return closingIndex > 0 ? previousTabs[closingIndex - 1].path : homePath
}

export function resolveFallbackPathAfterBatchClose(
  previousTabs: AdminTab[],
  removedTabs: AdminTab[],
  activePath: string,
  homePath: string,
) {
  const removedPaths = new Set(removedTabs.map(tab => tab.path))
  const activeIndex = previousTabs.findIndex(tab => tab.path === activePath)
  for (let index = activeIndex - 1; index >= 0; index -= 1) {
    const tab = previousTabs[index]
    if (!removedPaths.has(tab.path) && (tab.fixed || tab.closable === false)) {
      return tab.path
    }
  }
  for (let index = activeIndex - 1; index >= 0; index -= 1) {
    if (!removedPaths.has(previousTabs[index].path)) {
      return previousTabs[index].path
    }
  }
  for (let index = activeIndex + 1; index < previousTabs.length; index += 1) {
    if (!removedPaths.has(previousTabs[index].path)) {
      return previousTabs[index].path
    }
  }
  return homePath
}
