import { afterEach, describe, expect, it, vi } from 'vitest'

import { createSettingsService, mergeAdminConfig, type AdminConfig, type SettingsSyncErrorContext } from '../../src/index'
import { createDeferred, createMemoryStorage } from './settings-test-utils'

describe('createSettingsService sync concurrency and lifecycle', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('serializes saves and does not report synced before the newest revision is saved', async () => {
    vi.useFakeTimers()
    const first = createDeferred<void>()
    const second = createDeferred<void>()
    const save = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: { save },
      syncDebounce: 0,
    })
    service.updateSettings({ layout: { mode: 'top' } })
    const syncing = service.syncSettings()
    expect(save).toHaveBeenCalledTimes(1)
    service.updateSettings({ layout: { mode: 'mixed' } })
    first.resolve()
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(2))
    expect(save.mock.calls[1]?.[0].layout.mode).toBe('mixed')
    expect(service.syncStatus.value).toBe('syncing')
    second.resolve()
    await syncing
    expect(service.syncStatus.value).toBe('synced')
  })
  it('isolates internal settings and storage from deep save adapter mutations', async () => {
    const storage = createMemoryStorage()
    const save = vi.fn(async (settings: AdminConfig) => {
      settings.layout.mode = 'mixed'
      settings.theme.customColors?.push({ color: '#000000', label: '适配器修改' })
      settings.tabs?.fixedTabs.push({ path: '/mutated', title: '适配器修改' })
    })
    const service = createSettingsService({
      config: mergeAdminConfig({
        theme: { customColors: [{ color: '#6750A4', label: '原始颜色' }] },
        tabs: { fixedTabs: [{ path: '/original', title: '原始标签' }] },
      }),
      storage,
      sync: { save },
    })
    service.updateSettings({ layout: { mode: 'top' } })
    const persisted = storage.getItem('varlet-admin:settings')
    await service.syncSettings()
    expect(service.settings.value.layout.mode).toBe('top')
    expect(service.settings.value.theme.customColors).toEqual([
      { color: '#6750A4', label: '原始颜色' },
    ])
    expect(service.settings.value.tabs?.fixedTabs).toEqual([
      { path: '/original', title: '原始标签' },
    ])
    expect(storage.getItem('varlet-admin:settings')).toBe(persisted)
  })
  it('isolates internal and retry snapshots from onSyncError context mutations', async () => {
    const saveError = new Error('save failed')
    let saveAttempt = 0
    const save = vi.fn(async (settings: AdminConfig) => {
      saveAttempt += 1
      if (saveAttempt === 1) {
        settings.layout.mode = 'side'
        settings.theme.customColors?.push({ color: '#111111', label: '保存修改' })
        throw saveError
      }
    })
    const errorContextModes: string[] = []
    const onSyncError = vi.fn((context: SettingsSyncErrorContext) => {
      errorContextModes.push(context.settings.layout.mode)
      context.settings.layout.mode = 'mixed'
      context.settings.theme.customColors?.push({ color: '#000000', label: '回调修改' })
      context.settings.tabs?.fixedTabs.push({ path: '/mutated', title: '回调修改' })
    })
    const service = createSettingsService({
      config: mergeAdminConfig({
        theme: { customColors: [{ color: '#6750A4', label: '原始颜色' }] },
        tabs: { fixedTabs: [{ path: '/original', title: '原始标签' }] },
      }),
      storage: createMemoryStorage(),
      sync: { save },
      onSyncError,
    })
    service.updateSettings({ layout: { mode: 'top' } })
    await expect(service.syncSettings()).rejects.toBe(saveError)
    await service.retrySync()
    expect(errorContextModes).toEqual(['top'])
    expect(save.mock.calls[1]?.[0].layout.mode).toBe('top')
    expect(save.mock.calls[1]?.[0].theme.customColors).toEqual([
      { color: '#6750A4', label: '原始颜色' },
    ])
    expect(save.mock.calls[1]?.[0].tabs?.fixedTabs).toEqual([
      { path: '/original', title: '原始标签' },
    ])
    expect(service.settings.value.layout.mode).toBe('top')
  })

  it('ignores an in-flight load success after dispose resolves', async () => {
    const load = createDeferred<{ layout: { mode: 'mixed' } }>()
    const storage = createMemoryStorage()
    const onSyncError = vi.fn()
    const service = createSettingsService({
      config: mergeAdminConfig({ layout: { mode: 'top' } }),
      storage,
      sync: { load: () => load.promise },
      onSyncError,
    })
    const initialSettings = service.getSettings()
    const loading = service.loadRemoteSettings()
    await expect(service.dispose()).resolves.toBe(initialSettings)
    load.resolve({ layout: { mode: 'mixed' } })
    await expect(loading).resolves.toBe(initialSettings)
    expect(service.getSettings()).toBe(initialSettings)
    expect(storage.getItem('varlet-admin:settings')).toBeNull()
    expect(service.syncStatus.value).toBe('idle')
    expect(service.lastError.value).toBeNull()
    expect(onSyncError).not.toHaveBeenCalled()
  })

  it('keeps a disposed service unchanged when an older load rejects', async () => {
    const load = createDeferred<{ layout: { mode: 'mixed' } }>()
    const loadError = new Error('load failed after dispose')
    const onSyncError = vi.fn()
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: { load: () => load.promise },
      onSyncError,
    })
    const loading = service.loadRemoteSettings()
    await service.dispose()
    load.reject(loadError)
    await expect(loading).rejects.toBe(loadError)
    expect(service.syncStatus.value).toBe('idle')
    expect(service.lastError.value).toBeNull()
    expect(onSyncError).not.toHaveBeenCalled()
  })

  it('rejects new operations after dispose without calling adapters', async () => {
    const load = vi.fn().mockResolvedValue(undefined)
    const save = vi.fn().mockResolvedValue(undefined)
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: { load, save },
    })
    await service.dispose()
    expect(() => service.updateSettings({ layout: { mode: 'top' } }))
      .toThrow('Settings service has been disposed')
    expect(() => service.resetSettings()).toThrow('Settings service has been disposed')
    await expect(service.loadRemoteSettings()).rejects.toThrow('Settings service has been disposed')
    await expect(service.syncSettings()).rejects.toThrow('Settings service has been disposed')
    await expect(service.retrySync()).rejects.toThrow('Settings service has been disposed')
    expect(load).not.toHaveBeenCalled()
    expect(save).not.toHaveBeenCalled()
  })

  it('does not include a remote load in an already scheduled local save snapshot', async () => {
    vi.useFakeTimers()
    const save = vi.fn().mockResolvedValue(undefined)
    const service = createSettingsService({
      config: mergeAdminConfig({ layout: { sidebarWidth: 320 } }),
      storage: createMemoryStorage(),
      sync: {
        load: vi.fn().mockResolvedValue({ layout: { sidebarWidth: 444 } }),
        save,
      },
    })
    service.updateSettings({ layout: { mode: 'top' } })
    await service.loadRemoteSettings()
    await vi.advanceTimersByTimeAsync(500)
    expect(service.settings.value.layout.sidebarWidth).toBe(444)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save.mock.calls[0]?.[0].layout).toMatchObject({
      mode: 'top',
      sidebarWidth: 320,
    })
  })

  it('keeps syncing status while a load remains in flight after save completes', async () => {
    const load = createDeferred<{ layout: { mode: 'mixed' } }>()
    const save = vi.fn().mockResolvedValue(undefined)
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: { load: () => load.promise, save },
    })
    const loading = service.loadRemoteSettings()
    service.updateSettings({ layout: { mode: 'top' } })
    await service.syncSettings()
    expect(service.syncStatus.value).toBe('syncing')
    load.resolve({ layout: { mode: 'mixed' } })
    await loading
    expect(service.syncStatus.value).toBe('synced')
  })

  it('keeps syncing status when an empty load completes before an in-flight save', async () => {
    const save = createDeferred<void>()
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: {
        load: vi.fn().mockResolvedValue(null),
        save: () => save.promise,
      },
    })
    service.updateSettings({ layout: { mode: 'top' } })
    const syncing = service.syncSettings()
    await service.loadRemoteSettings()
    expect(service.syncStatus.value).toBe('syncing')
    save.resolve()
    await syncing
    expect(service.syncStatus.value).toBe('synced')
  })

  it('ignores stale remote load completions in favor of the newest request', async () => {
    const first = createDeferred<{ layout: { mode: 'mixed' } }>()
    const second = createDeferred<{ layout: { mode: 'top' } }>()
    const load = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: { load },
    })
    const firstRequest = service.loadRemoteSettings()
    const secondRequest = service.loadRemoteSettings()
    second.resolve({ layout: { mode: 'top' } })
    await secondRequest
    first.resolve({ layout: { mode: 'mixed' } })
    await firstRequest
    expect(service.settings.value.layout.mode).toBe('top')
    expect(service.syncStatus.value).toBe('synced')
  })

  it('does not let a stale load failure overwrite a newer successful load', async () => {
    const first = createDeferred<{ layout: { mode: 'mixed' } }>()
    const second = createDeferred<{ layout: { mode: 'top' } }>()
    const staleError = new Error('stale load failed')
    const load = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: { load },
    })
    const staleRequest = service.loadRemoteSettings()
    const latestRequest = service.loadRemoteSettings()
    second.resolve({ layout: { mode: 'top' } })
    await latestRequest
    first.reject(staleError)
    await expect(staleRequest).rejects.toBe(staleError)
    expect(service.settings.value.layout.mode).toBe('top')
    expect(service.lastError.value).toBeNull()
    expect(service.syncStatus.value).toBe('synced')
  })

  it('does not let an older load success clear a newer save error', async () => {
    const load = createDeferred<{ theme: { mode: 'dark' } }>()
    const saveError = new Error('newer save failed')
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: {
        load: () => load.promise,
        save: vi.fn().mockRejectedValue(saveError),
      },
    })
    const loading = service.loadRemoteSettings()
    service.updateSettings({ layout: { mode: 'top' } })
    await expect(service.syncSettings()).rejects.toBe(saveError)
    load.resolve({ theme: { mode: 'dark' } })
    await loading
    expect(service.settings.value.theme.mode).toBe('dark')
    expect(service.lastError.value).toBe(saveError)
    expect(service.syncStatus.value).toBe('error')
  })

  it('does not let an older save success clear a newer load error', async () => {
    const save = createDeferred<void>()
    const loadError = new Error('newer load failed')
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: {
        load: vi.fn().mockRejectedValue(loadError),
        save: () => save.promise,
      },
    })
    service.updateSettings({ layout: { mode: 'top' } })
    const syncing = service.syncSettings()
    await expect(service.loadRemoteSettings()).rejects.toBe(loadError)
    save.resolve()
    await syncing
    expect(service.lastError.value).toBe(loadError)
    expect(service.syncStatus.value).toBe('error')
  })

  it('does not let an older save failure overwrite a newer load success', async () => {
    const save = createDeferred<void>()
    const saveError = new Error('older save failed')
    const onSyncError = vi.fn()
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: {
        load: vi.fn().mockResolvedValue({ theme: { mode: 'dark' } }),
        save: () => save.promise,
      },
      onSyncError,
    })
    service.updateSettings({ layout: { mode: 'top' } })
    const syncing = service.syncSettings()
    await service.loadRemoteSettings()
    save.reject(saveError)
    await expect(syncing).rejects.toBe(saveError)
    expect(service.settings.value.theme.mode).toBe('dark')
    expect(service.lastError.value).toBeNull()
    expect(service.syncStatus.value).toBe('synced')
    expect(onSyncError).not.toHaveBeenCalled()
  })

  it('does not let an older save failure overwrite a newer load failure', async () => {
    const save = createDeferred<void>()
    const saveError = new Error('older save failed')
    const loadError = new Error('newer load failed')
    const onSyncError = vi.fn()
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: {
        load: vi.fn().mockRejectedValue(loadError),
        save: () => save.promise,
      },
      onSyncError,
    })
    service.updateSettings({ layout: { mode: 'top' } })
    const syncing = service.syncSettings()
    await expect(service.loadRemoteSettings()).rejects.toBe(loadError)
    save.reject(saveError)
    await expect(syncing).rejects.toBe(saveError)
    expect(service.lastError.value).toBe(loadError)
    expect(service.syncStatus.value).toBe('error')
    expect(onSyncError).toHaveBeenCalledTimes(1)
    expect(onSyncError).toHaveBeenCalledWith({
      operation: 'load',
      error: loadError,
      settings: service.settings.value,
    })
  })

})
