export interface AdminTab {
  path: string
  title: string
  fixed?: boolean
  closable?: boolean
}

export interface CreateTabsServiceOptions {
  homePath?: string
  fixedTabs?: AdminTab[]
}

export interface TabsService {
  getTabs(): AdminTab[]
  addTab(tab: AdminTab): AdminTab
  moveTab(path: string, targetPath: string): boolean
  closeCurrent(path: string): AdminTab | undefined
  closeOthers(path: string): AdminTab[]
  closeLeft(path: string): AdminTab[]
  closeRight(path: string): AdminTab[]
  closeAll(): AdminTab[]
  refresh(path: string): AdminTab | undefined
}

export function createTabsService(options: CreateTabsServiceOptions = {}): TabsService {
  const tabs = normalizeFixedTabs(options.fixedTabs ?? [])

  return {
    getTabs() {
      return tabs.map(cloneTab)
    },

    addTab(tab) {
      const existing = tabs.find((item) => item.path === tab.path)

      if (existing) {
        const wasFixed = isFixedTab(existing)
        if (!wasFixed || tab.title !== tab.path) {
          existing.title = tab.title || existing.title
        }
        if ('fixed' in tab) {
          existing.fixed = Boolean(tab.fixed)
        }
        if ('closable' in tab || 'fixed' in tab) {
          existing.closable = tab.closable ?? !existing.fixed
        }
        if (!wasFixed && isFixedTab(existing)) {
          moveExistingTab(existing.path, fixedCount() - 1)
        } else if (wasFixed && !isFixedTab(existing)) {
          moveExistingTab(existing.path, fixedCount())
        }
        return cloneTab(existing)
      }

      const nextTab = normalizeTab(tab)
      tabs.push(nextTab)
      if (isFixedTab(nextTab)) {
        moveExistingTab(nextTab.path, fixedCount() - 1)
      }
      return cloneTab(nextTab)
    },

    moveTab(path, targetPath) {
      if (path === targetPath) {
        return true
      }

      const sourceIndex = tabs.findIndex((tab) => tab.path === path)
      const targetIndex = tabs.findIndex((tab) => tab.path === targetPath)
      if (sourceIndex < 0 || targetIndex < 0) {
        return false
      }

      const source = tabs[sourceIndex]
      const target = tabs[targetIndex]
      const sourceFixed = isFixedTab(source)
      const targetFixed = isFixedTab(target)

      if (sourceFixed && !targetFixed) {
        return false
      }

      const [removed] = tabs.splice(sourceIndex, 1)
      let nextIndex = tabs.findIndex((tab) => tab.path === targetPath)

      if (sourceFixed) {
        nextIndex = Math.max(0, Math.min(nextIndex, fixedCount()))
      } else if (targetFixed) {
        nextIndex = fixedCount()
      } else {
        nextIndex = Math.max(fixedCount(), nextIndex)
      }

      tabs.splice(nextIndex, 0, removed)
      return true
    },

    closeCurrent(path) {
      const index = tabs.findIndex((tab) => tab.path === path)
      if (index < 0 || isFixedTab(tabs[index])) {
        return undefined
      }

      return cloneTab(tabs.splice(index, 1)[0])
    },

    closeOthers(path) {
      const removed = removeTabs((tab) => tab.path !== path && !isFixedTab(tab))
      return removed.map(cloneTab)
    },

    closeLeft(path) {
      const index = tabs.findIndex((tab) => tab.path === path)
      if (index < 0) {
        return []
      }

      const removed = removeTabs((tab, tabIndex) => tabIndex < index && !isFixedTab(tab))
      return removed.map(cloneTab)
    },

    closeRight(path) {
      const index = tabs.findIndex((tab) => tab.path === path)
      if (index < 0) {
        return []
      }

      const removed = removeTabs((tab, tabIndex) => tabIndex > index && !isFixedTab(tab))
      return removed.map(cloneTab)
    },

    closeAll() {
      const removed = removeTabs((tab) => !isFixedTab(tab))
      return removed.map(cloneTab)
    },

    refresh(path) {
      const tab = tabs.find((item) => item.path === path)
      return tab ? cloneTab(tab) : undefined
    },
  }

  function fixedCount() {
    return tabs.filter(isFixedTab).length
  }

  function moveExistingTab(path: string, index: number) {
    const currentIndex = tabs.findIndex((tab) => tab.path === path)
    if (currentIndex < 0) {
      return
    }

    const [tab] = tabs.splice(currentIndex, 1)
    const nextIndex = Math.max(0, Math.min(index, tabs.length))
    tabs.splice(nextIndex, 0, tab)
  }

  function removeTabs(predicate: (tab: AdminTab, index: number) => boolean) {
    const removed: AdminTab[] = []

    for (let index = tabs.length - 1; index >= 0; index -= 1) {
      const tab = tabs[index]
      if (predicate(tab, index)) {
        removed.unshift(tabs.splice(index, 1)[0])
      }
    }

    return removed
  }
}

function normalizeFixedTabs(tabs: AdminTab[]) {
  return tabs.map((tab) => ({
    ...normalizeTab(tab),
    fixed: true,
    closable: false,
  }))
}

function normalizeTab(tab: AdminTab): AdminTab {
  return {
    path: tab.path,
    title: tab.title || tab.path,
    fixed: Boolean(tab.fixed),
    closable: tab.closable ?? !tab.fixed,
  }
}

function isFixedTab(tab: AdminTab) {
  return tab.fixed || tab.closable === false
}

function cloneTab(tab: AdminTab): AdminTab {
  return { ...tab }
}
