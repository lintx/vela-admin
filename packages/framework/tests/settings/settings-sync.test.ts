import { afterEach, describe, expect, it, vi } from 'vitest'
import { isReadonly } from 'vue'

import {
  createSettingsService,
  mergeAdminConfig,
  type SettingsSyncErrorContext,
} from '../../src/index'
import { createDeferred, createMemoryStorage } from './settings-test-utils'

describe('createSettingsService remote sync', () => {
  afterEach(() => {
    vi.useRealTimers()
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

  it('immediately updates readonly reactive settings, local storage, and schedules remote save', () => {
    vi.useFakeTimers()
    const storage = createMemoryStorage()
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage,
      sync: { save: vi.fn().mockResolvedValue(undefined) },
    })

    const updated = service.updateSettings({ layout: { mode: 'top' } })

    expect(isReadonly(service.settings)).toBe(true)
    expect(isReadonly(service.syncStatus)).toBe(true)
    expect(isReadonly(service.lastError)).toBe(true)
    expect(service.settings.value).toEqual(updated)
    expect(storage.getItem('varlet-admin:settings')).toContain('"mode":"top"')
    expect(service.syncStatus.value).toBe('scheduled')
  })

  it('debounces remote saves for 500ms and saves only the latest snapshot', async () => {
    vi.useFakeTimers()
    const save = vi.fn().mockResolvedValue(undefined)
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: { save },
    })

    service.updateSettings({ layout: { mode: 'top' } })
    service.updateSettings({ layout: { mode: 'mixed' } })
    await vi.advanceTimersByTimeAsync(499)
    expect(save).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save.mock.calls[0]?.[0].layout.mode).toBe('mixed')
    expect(service.syncStatus.value).toBe('synced')
  })

  it('supports zero debounce and falls back to 500ms for invalid debounce values', async () => {
    vi.useFakeTimers()
    const immediateSave = vi.fn().mockResolvedValue(undefined)
    const immediate = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: { save: immediateSave },
      syncDebounce: 0,
    })

    immediate.updateSettings({ layout: { mode: 'top' } })
    await vi.advanceTimersByTimeAsync(0)
    expect(immediateSave).toHaveBeenCalledTimes(1)

    const fallbackSave = vi.fn().mockResolvedValue(undefined)
    const fallback = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: { save: fallbackSave },
      syncDebounce: Number.NaN,
    })
    fallback.updateSettings({ layout: { mode: 'mixed' } })

    await vi.advanceTimersByTimeAsync(499)
    expect(fallbackSave).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(fallbackSave).toHaveBeenCalledTimes(1)
  })

  it('cancels a scheduled timer when syncSettings flushes the latest snapshot', async () => {
    vi.useFakeTimers()
    const save = vi.fn().mockResolvedValue(undefined)
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: { save },
    })

    service.updateSettings({ layout: { mode: 'mixed' } })
    expect(service.syncStatus.value).toBe('scheduled')
    await service.syncSettings()
    expect(save).toHaveBeenCalledTimes(1)
    expect(save.mock.calls[0]?.[0].layout.mode).toBe('mixed')

    await vi.advanceTimersByTimeAsync(500)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('exposes save failures without rolling back local state or leaking timer rejections', async () => {
    vi.useFakeTimers()
    const saveError = new Error('save failed')
    const onSyncError = vi.fn(() => {
      throw new Error('callback failed')
    })
    const storage = createMemoryStorage()
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage,
      sync: { save: vi.fn().mockRejectedValue(saveError) },
      onSyncError,
    })

    service.updateSettings({ theme: { mode: 'dark' } })
    await expect(service.syncSettings()).rejects.toBe(saveError)
    expect(service.settings.value.theme.mode).toBe('dark')
    expect(storage.getItem('varlet-admin:settings')).toContain('"mode":"dark"')
    expect(service.syncStatus.value).toBe('error')
    expect(service.lastError.value).toBe(saveError)
    expect(onSyncError).toHaveBeenCalledWith({
      operation: 'save',
      error: saveError,
      settings: service.settings.value,
    })

    service.updateSettings({ theme: { mode: 'light' } })
    await vi.advanceTimersByTimeAsync(500)
    expect(service.syncStatus.value).toBe('error')
  })

  it('retrySync always saves the newest local snapshot and clears the previous error', async () => {
    vi.useFakeTimers()
    const saveError = new Error('save failed')
    const save = vi.fn()
      .mockRejectedValueOnce(saveError)
      .mockResolvedValueOnce(undefined)
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: { save },
    })

    service.updateSettings({ layout: { mode: 'top' } })
    await expect(service.syncSettings()).rejects.toBe(saveError)
    service.updateSettings({ layout: { mode: 'mixed' } })

    const retried = await service.retrySync()
    expect(save).toHaveBeenCalledTimes(2)
    expect(save.mock.calls[1]?.[0].layout.mode).toBe('mixed')
    expect(retried.layout.mode).toBe('mixed')
    expect(service.lastError.value).toBeNull()
    expect(service.syncStatus.value).toBe('synced')
  })

  it('merges remote fields into local settings without saving them back', async () => {
    const storage = createMemoryStorage()
    const save = vi.fn().mockResolvedValue(undefined)
    const service = createSettingsService({
      config: mergeAdminConfig({
        layout: { mode: 'side', sidebarWidth: 320 },
        theme: { mode: 'light' },
      }),
      storage,
      sync: {
        load: vi.fn().mockResolvedValue({
          layout: { mode: 'mixed' },
          theme: { mode: 'dark' },
        }),
        save,
      },
    })

    const loaded = await service.loadRemoteSettings()
    expect(loaded.layout).toMatchObject({ mode: 'mixed', sidebarWidth: 320 })
    expect(loaded.theme.mode).toBe('dark')
    expect(service.settings.value).toEqual(loaded)
    expect(storage.getItem('varlet-admin:settings')).toContain('"sidebarWidth":320')
    expect(save).not.toHaveBeenCalled()
    expect(service.lastError.value).toBeNull()
  })

  it('manually syncs the current full settings after a remote load', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const service = createSettingsService({
      config: mergeAdminConfig({ theme: { mode: 'light' } }),
      storage: createMemoryStorage(),
      sync: {
        load: vi.fn().mockResolvedValue({ theme: { mode: 'dark' } }),
        save,
      },
    })

    await service.loadRemoteSettings()
    expect(save).not.toHaveBeenCalled()
    await service.syncSettings()

    expect(save).toHaveBeenCalledTimes(1)
    expect(save.mock.calls[0]?.[0]).toEqual(service.settings.value)
    expect(save.mock.calls[0]?.[0].theme.mode).toBe('dark')
  })

  it('keeps a queued auto snapshot frozen and queues manual sync for the newer full revision', async () => {
    vi.useFakeTimers()
    const first = createDeferred<void>()
    const second = createDeferred<void>()
    const third = createDeferred<void>()
    const save = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
      .mockReturnValueOnce(third.promise)
    const service = createSettingsService({
      config: mergeAdminConfig({ theme: { mode: 'light' } }),
      storage: createMemoryStorage(),
      sync: {
        load: vi.fn().mockResolvedValue({ theme: { mode: 'dark' } }),
        save,
      },
    })

    service.updateSettings({ layout: { mode: 'top' } })
    await vi.advanceTimersByTimeAsync(500)
    service.updateSettings({ layout: { mode: 'mixed' } })
    await service.loadRemoteSettings()
    const syncingCurrent = service.syncSettings()
    expect(save).toHaveBeenCalledTimes(1)

    first.resolve()
    await Promise.resolve()
    expect(save).toHaveBeenCalledTimes(2)
    expect(save.mock.calls[0]?.[0]).toMatchObject({
      layout: { mode: 'top' },
      theme: { mode: 'light' },
    })
    expect(save.mock.calls[1]?.[0]).toMatchObject({
      layout: { mode: 'mixed' },
      theme: { mode: 'light' },
    })

    second.resolve()
    await Promise.resolve()
    expect(save).toHaveBeenCalledTimes(3)
    expect(save.mock.calls[2]?.[0]).toEqual(service.settings.value)
    expect(save.mock.calls[2]?.[0]).toMatchObject({
      layout: { mode: 'mixed' },
      theme: { mode: 'dark' },
    })

    third.resolve()
    await expect(syncingCurrent).resolves.toBe(service.settings.value)
    expect(save).toHaveBeenCalledTimes(3)
  })

  it('isolates loaded settings and storage from later remote payload mutations', async () => {
    const remoteSettings = {
      theme: { customColors: [{ color: '#6750A4', label: '远端颜色' }] },
      tabs: { fixedTabs: [{ path: '/remote', title: '远端标签' }] },
    }
    const storage = createMemoryStorage()
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage,
      sync: { load: vi.fn().mockResolvedValue(remoteSettings) },
    })

    await service.loadRemoteSettings()
    const persisted = storage.getItem('varlet-admin:settings')
    remoteSettings.theme.customColors[0]!.label = '外部修改'
    remoteSettings.theme.customColors.push({ color: '#000000', label: '外部新增' })
    remoteSettings.tabs.fixedTabs[0]!.title = '外部修改'
    remoteSettings.tabs.fixedTabs.push({ path: '/mutated', title: '外部新增' })

    expect(service.settings.value.theme.customColors).toEqual([
      { color: '#6750A4', label: '远端颜色' },
    ])
    expect(service.settings.value.tabs?.fixedTabs).toEqual([
      { path: '/remote', title: '远端标签' },
    ])
    expect(storage.getItem('varlet-admin:settings')).toBe(persisted)
  })

  it('keeps local settings for empty loads and reports load errors without rollback', async () => {
    const loadError = new Error('load failed')
    const onSyncError = vi.fn((context: SettingsSyncErrorContext) => {
      context.settings.layout.mode = 'mixed'
    })
    const load = vi.fn()
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(loadError)
    const service = createSettingsService({
      config: mergeAdminConfig({ layout: { mode: 'top' } }),
      storage: createMemoryStorage(),
      sync: { load },
      onSyncError,
    })
    const local = service.getSettings()

    await expect(service.loadRemoteSettings()).resolves.toBe(local)
    await expect(service.loadRemoteSettings()).rejects.toBe(loadError)
    expect(service.settings.value).toEqual(local)
    expect(service.settings.value.layout.mode).toBe('top')
    expect(service.syncStatus.value).toBe('error')
    expect(service.lastError.value).toBe(loadError)
    expect(onSyncError).toHaveBeenCalledTimes(1)
    expect(onSyncError.mock.calls[0]?.[0]).toMatchObject({ operation: 'load', error: loadError })
  })

  it('resetSettings immediately restores config and schedules a remote save', () => {
    vi.useFakeTimers()
    const storage = createMemoryStorage()
    const service = createSettingsService({
      config: mergeAdminConfig({ layout: { mode: 'side' } }),
      storage,
      sync: { save: vi.fn().mockResolvedValue(undefined) },
    })
    service.updateSettings({ layout: { mode: 'mixed' } })

    const reset = service.resetSettings()

    expect(reset.layout.mode).toBe('side')
    expect(service.settings.value).toEqual(reset)
    expect(storage.getItem('varlet-admin:settings')).toContain('"mode":"side"')
    expect(service.syncStatus.value).toBe('scheduled')
  })

  it('is safe without a save adapter and never schedules synchronization', async () => {
    vi.useFakeTimers()
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: { load: vi.fn().mockResolvedValue(undefined) },
    })

    const updated = service.updateSettings({ layout: { mode: 'top' } })

    expect(service.syncStatus.value).toBe('idle')
    await expect(service.syncSettings()).resolves.toBe(updated)
    await expect(service.retrySync()).resolves.toBe(updated)
    await expect(service.dispose()).resolves.toBe(updated)
    expect(service.syncStatus.value).toBe('idle')
    expect(vi.getTimerCount()).toBe(0)
  })
})
