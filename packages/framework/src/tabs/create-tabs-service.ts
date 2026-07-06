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
        if (!isFixedTab(existing) || tab.title !== tab.path) {
          existing.title = tab.title || existing.title
        }
        if ('fixed' in tab) {
          existing.fixed = Boolean(tab.fixed)
        }
        if ('closable' in tab || 'fixed' in tab) {
          existing.closable = tab.closable ?? !existing.fixed
        }
        return cloneTab(existing)
      }

      const nextTab = normalizeTab(tab)
      tabs.push(nextTab)
      return cloneTab(nextTab)
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
