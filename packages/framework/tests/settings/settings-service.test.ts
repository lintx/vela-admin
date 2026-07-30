import { describe, expect, it } from 'vitest'

import {
  createSettingsService,
  defaultAdminConfig,
  mergeAdminConfig,
} from '../../src/index'
import { createMemoryStorage } from './settings-test-utils'

describe('createSettingsService local settings', () => {
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

  it('migrates legacy flat demo settings into the versioned admin config', () => {
    const storage = createMemoryStorage()
    storage.setItem('vela-admin-example:settings', JSON.stringify({
      layoutMode: 'mixed',
      sidebarWidth: 300,
      scrollbar: 'hover',
      themeMode: 'dark',
      themeBase: 'md3Dark',
      sourceColor: '#0F766E',
      customColors: [{ color: '#0F766E', label: '自定义 #0F766E', removable: true }],
      layoutFeatures: { tagsView: true, menuSearch: false, settings: true },
      fixedTabs: [{ path: '/system/user', title: '用户管理' }],
    }))

    const service = createSettingsService({
      config: mergeAdminConfig({ settings: { storageKey: 'vela-admin-example:settings' } }),
      storage,
    })
    const settings = service.getSettings()

    expect(settings.layout).toMatchObject({
      mode: 'mixed',
      sidebarWidth: 300,
      scrollbar: 'hover',
      tagsView: true,
      menuSearch: false,
      settings: true,
    })
    expect(settings.theme).toMatchObject({
      mode: 'dark',
      base: 'md3Dark',
      sourceColor: '#0F766E',
      customColors: [{ color: '#0F766E', label: '自定义 #0F766E', removable: true }],
    })
    expect(settings.tabs?.fixedTabs).toEqual([{ path: '/system/user', title: '用户管理' }])
    expect(settings.settings.schemaVersion).toBe(1)
  })

  it('deep merges partial versioned settings with configured defaults', () => {
    const storage = createMemoryStorage()
    storage.setItem('versioned:settings', JSON.stringify({
      icons: { defaultLibrary: 'tabler' },
      layout: { tagsView: false },
      settings: { schemaVersion: 1 },
    }))

    const service = createSettingsService({
      config: mergeAdminConfig({
        icons: {
          fallbackLibrary: 'phosphor',
          phosphor: { weight: 'bold' },
        },
        layout: { sidebarWidth: 320 },
        settings: { storageKey: 'versioned:settings' },
      }),
      storage,
    })

    expect(service.getSettings().layout.tagsView).toBe(false)
    expect(service.getSettings().layout.sidebarWidth).toBe(320)
    expect(service.getSettings().icons).toEqual({
      defaultLibrary: 'tabler',
      fallbackLibrary: 'phosphor',
      phosphor: { weight: 'bold' },
    })
    expect(service.getSettings().settings.storageKey).toBe('versioned:settings')
  })

  it('migrates pre-versioned nested settings snapshots without losing validated values', () => {
    const storage = createMemoryStorage()
    storage.setItem('pre-versioned:settings', JSON.stringify({
      icons: {
        defaultLibrary: 'tabler',
        fallbackLibrary: 'phosphor',
        phosphor: { weight: 'bold' },
      },
      layout: { mode: 'mixed' },
      theme: { mode: 'dark', sourceColor: '#0F766E' },
      settings: { persist: true, storageKey: 'pre-versioned:settings' },
    }))

    const service = createSettingsService({
      config: mergeAdminConfig({ settings: { storageKey: 'pre-versioned:settings' } }),
      storage,
    })
    const settings = service.getSettings()

    expect(settings.layout.mode).toBe('mixed')
    expect(settings.theme.mode).toBe('dark')
    expect(settings.theme.sourceColor).toBe('#0F766E')
    expect(settings.icons).toEqual({
      defaultLibrary: 'tabler',
      fallbackLibrary: 'phosphor',
      phosphor: { weight: 'bold' },
    })
    expect(settings.settings.schemaVersion).toBe(1)
  })

  it('falls back to config for unknown future schema versions', () => {
    const storage = createMemoryStorage()
    storage.setItem('future:settings', JSON.stringify({
      layout: { mode: 'mixed' },
      layoutMode: 'top',
      themeMode: 'dark',
      settings: { schemaVersion: 2 },
    }))
    const config = mergeAdminConfig({
      layout: { mode: 'side' },
      theme: { mode: 'light' },
      settings: { storageKey: 'future:settings' },
    })

    const service = createSettingsService({ config, storage })

    expect(service.getSettings()).toEqual(config)
    expect(service.getSettings().settings.schemaVersion).toBe(1)
  })

  it('preserves zero and empty arrays when migrating legacy flat settings', () => {
    const storage = createMemoryStorage()
    storage.setItem('legacy-empty:settings', JSON.stringify({
      sidebarWidth: 0,
      customColors: [],
      fixedTabs: [],
    }))
    const service = createSettingsService({
      config: mergeAdminConfig({
        layout: { sidebarWidth: 320 },
        theme: { customColors: [{ color: '#6750A4', label: '基线颜色' }] },
        tabs: { fixedTabs: [{ path: '/baseline', title: '基线标签' }] },
        settings: { storageKey: 'legacy-empty:settings' },
      }),
      storage,
    })

    expect(service.getSettings().layout.sidebarWidth).toBe(0)
    expect(service.getSettings().theme.customColors).toEqual([])
    expect(service.getSettings().tabs?.fixedTabs).toEqual([])
  })

  it('ignores malformed legacy fields without losing valid false values', () => {
    const storage = createMemoryStorage()
    storage.setItem('legacy:settings', JSON.stringify({
      layoutMode: 'invalid',
      sidebarWidth: 'wide',
      scrollbar: 'visible',
      themeMode: 'night',
      themeBase: 'unknown',
      sourceColor: 123,
      customColors: [
        { color: '#123456', label: '合法', removable: false },
        { color: 123, label: '非法' },
      ],
      layoutFeatures: { tagsView: false, menuSearch: 'no', settings: null },
      fixedTabs: [
        { path: '/valid', title: '有效' },
        { path: 1, title: '无效' },
      ],
    }))

    const service = createSettingsService({
      config: mergeAdminConfig({ settings: { storageKey: 'legacy:settings' } }),
      storage,
    })
    const settings = service.getSettings()

    expect(settings.layout.mode).toBe(defaultAdminConfig.layout.mode)
    expect(settings.layout.sidebarWidth).toBe(defaultAdminConfig.layout.sidebarWidth)
    expect(settings.layout.scrollbar).toBe(defaultAdminConfig.layout.scrollbar)
    expect(settings.layout.tagsView).toBe(false)
    expect(settings.layout.menuSearch).toBe(defaultAdminConfig.layout.menuSearch)
    expect(settings.layout.settings).toBe(defaultAdminConfig.layout.settings)
    expect(settings.theme.mode).toBe(defaultAdminConfig.theme.mode)
    expect(settings.theme.base).toBe(defaultAdminConfig.theme.base)
    expect(settings.theme.sourceColor).toBe(defaultAdminConfig.theme.sourceColor)
    expect(settings.theme.customColors).toEqual([{ color: '#123456', label: '合法', removable: false }])
    expect(settings.tabs?.fixedTabs).toEqual([{ path: '/valid', title: '有效' }])
  })

  it('falls back to config when stored JSON is invalid', () => {
    const storage = createMemoryStorage()
    storage.setItem('invalid:settings', '{invalid')
    const config = mergeAdminConfig({
      layout: { sidebarWidth: 304 },
      settings: { storageKey: 'invalid:settings' },
    })

    const service = createSettingsService({ config, storage })

    expect(service.getSettings()).toBe(config)
  })
})
