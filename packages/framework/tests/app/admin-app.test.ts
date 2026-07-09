import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  createAdminApp,
  createSettingsService,
  defaultAdminConfig,
  defineAdminConfig,
  mergeAdminConfig,
} from '../../src/index'
import { createMemoryHistory, createRouter } from 'vue-router'

describe('defineAdminConfig and mergeAdminConfig', () => {
  it('keeps config object identity for JavaScript users while preserving type inference', () => {
    const config = {
      appName: 'Example Admin',
      homePath: '/dashboard',
      loginPath: '/login',
    }

    expect(defineAdminConfig(config)).toBe(config)
  })

  it('merges user layout and theme options with framework defaults', () => {
    const config = mergeAdminConfig({
      appName: 'Example Admin',
      layout: {
        sidebarWidth: 300,
        tagsView: false,
      },
      theme: {
        base: 'md3Dark',
        persist: false,
      },
    })

    expect(config.appName).toBe('Example Admin')
    expect(config.homePath).toBe(defaultAdminConfig.homePath)
    expect(config.layout.sidebarWidth).toBe(300)
    expect(config.layout.sidebarCollapsedWidth).toBe(56)
    expect(config.layout.tagsView).toBe(false)
    expect(config.theme.base).toBe('md3Dark')
    expect(config.theme.persist).toBe(false)
  })
})

describe('createSettingsService', () => {
  it('returns defaults and applies partial updates', () => {
    const service = createSettingsService({
      config: mergeAdminConfig({
        layout: {
          sidebarWidth: 288,
        },
      }),
      storage: createMemoryStorage(),
    })

    expect(service.getSettings().layout.sidebarWidth).toBe(288)

    service.updateSettings({
      layout: {
        sidebarCollapsedWidth: 64,
      },
    })

    expect(service.getSettings().layout.sidebarWidth).toBe(288)
    expect(service.getSettings().layout.sidebarCollapsedWidth).toBe(64)
  })

  it('persists settings when enabled and ignores storage when disabled', () => {
    const storage = createMemoryStorage()
    const enabled = createSettingsService({
      config: mergeAdminConfig(),
      storage,
    })

    enabled.updateSettings({
      theme: {
        mode: 'dark',
      },
    })

    const restored = createSettingsService({
      config: mergeAdminConfig(),
      storage,
    })

    expect(restored.getSettings().theme.mode).toBe('dark')

    const disabled = createSettingsService({
      config: mergeAdminConfig({
        settings: {
          persist: false,
        },
      }),
      storage,
    })

    disabled.updateSettings({
      theme: {
        mode: 'light',
      },
    })

    expect(storage.getItem('varlet-admin:settings')).toContain('"mode":"dark"')
  })

  it('loads and syncs settings through an optional remote adapter', async () => {
    const storage = createMemoryStorage()
    const loadRemoteSettings = vi.fn().mockResolvedValue({
      theme: {
        mode: 'dark',
      },
      layout: {
        sidebarWidth: 300,
      },
    })
    const saveRemoteSettings = vi.fn().mockResolvedValue(undefined)
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage,
      sync: {
        load: loadRemoteSettings,
        save: saveRemoteSettings,
      },
    })

    const loaded = await service.loadRemoteSettings()
    expect(loaded.theme.mode).toBe('dark')
    expect(loaded.layout.sidebarWidth).toBe(300)
    expect(service.getSettings().theme.mode).toBe('dark')
    expect(storage.getItem('varlet-admin:settings')).toContain('"sidebarWidth":300')

    service.updateSettings({
      theme: {
        mode: 'light',
      },
    })

    await service.syncSettings()
    expect(saveRemoteSettings).toHaveBeenCalledWith(service.getSettings())
  })
})

describe('createAdminApp', () => {
  it('creates a Vue app and installs provided plugins before returning it', () => {
    const install = vi.fn()
    const root = { template: '<main />' }

    const app = createAdminApp({
      root,
      config: defineAdminConfig({ appName: 'Example Admin' }),
      plugins: [{ install }],
    })

    expect(app.config.globalProperties.$admin.config.appName).toBe('Example Admin')
    expect(app.config.globalProperties.$admin.settings.getSettings().appName).toBe('Example Admin')
    expect(install).toHaveBeenCalledTimes(1)
  })

  it('installs the provided router before returning the app', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<main />' } }],
    })

    const app = createAdminApp({
      root: { template: '<router-view />' },
      router,
    })

    expect(app.config.globalProperties.$router).toBe(router)
  })
})

describe('example AdminLayout integration', () => {
  it('does not reset pinned route tabs when syncing the current route', () => {
    const source = readFileSync(resolve(__dirname, '../../../../examples/admin/src/App.vue'), 'utf8')
    const syncCurrentTabBody = source.match(/function syncCurrentTab\(\) \{[\s\S]*?\n\}/)?.[0] ?? ''

    expect(syncCurrentTabBody).toContain('tabsService.addTab')
    expect(syncCurrentTabBody).not.toContain('fixed: route.path ===')
    expect(syncCurrentTabBody).not.toContain('closable: route.path !==')
  })

  it('restores user pinned tabs as cancellable pins', () => {
    const source = readFileSync(resolve(__dirname, '../../../../examples/admin/src/App.vue'), 'utf8')

    expect(source).toContain('restorePinnedTabs(persistedSettings.fixedTabs)')
    expect(source).toContain('closable: true')
    expect(source).not.toContain('createInitialFixedTabs(persistedSettings.fixedTabs)')
  })

  it('navigates to the nearest left tab after closing the current route tab and falls back home', () => {
    const source = readFileSync(resolve(__dirname, '../../../../examples/admin/src/App.vue'), 'utf8')
    const closeTabBody = source.match(/function closeTab\(path\) \{[\s\S]*?\n\}/)?.[0] ?? ''

    expect(closeTabBody).toContain('const previousTabs = tabsService.getTabs()')
    expect(closeTabBody).toContain('const closingCurrentTab = path === route.path')
    expect(closeTabBody).toContain('resolveNextTabPathAfterClose')
    expect(closeTabBody).toContain('router.push(nextPath)')
    expect(source).toContain('function resolveNextTabPathAfterClose')
    expect(source).toContain("return '/'")
  })
})

function createMemoryStorage(): Storage {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear() {
      values.clear()
    },
    getItem(key: string) {
      return values.get(key) ?? null
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null
    },
    removeItem(key: string) {
      values.delete(key)
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
  }
}
