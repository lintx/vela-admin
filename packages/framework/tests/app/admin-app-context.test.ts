import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, onBeforeUnmount } from 'vue'

import {
  createAdminApp,
  mergeAdminConfig,
  useAdminApp,
  useAdminSettings,
} from '../../src/index'
import { createMemoryStorage } from '../settings/settings-test-utils'

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

function createHost(): HTMLDivElement {
  const host = document.createElement('div')
  document.body.append(host)
  return host
}

describe('admin app context', () => {
  it('provides one context to composables and global properties', () => {
    let injectedContext!: ReturnType<typeof useAdminApp>
    let injectedSettings!: ReturnType<typeof useAdminSettings>
    const root = defineComponent({
      setup() {
        injectedContext = useAdminApp()
        injectedSettings = useAdminSettings()
        return () => h('main')
      },
    })
    const app = createAdminApp({
      root,
      config: { appName: 'Context Admin' },
      settings: { storage: createMemoryStorage() },
    })

    app.mount(createHost())

    expect(injectedContext.config.appName).toBe('Context Admin')
    expect(injectedSettings).toBe(injectedContext.settings)
    expect(app.config.globalProperties.$admin).toBe(injectedContext)
    app.unmount()
  })

  it('passes storage, sync adapter, and debounce options to the settings service', async () => {
    vi.useFakeTimers()
    const storage = createMemoryStorage()
    const storedSettings = mergeAdminConfig({ appName: 'Stored Admin' })
    storage.setItem(storedSettings.settings.storageKey, JSON.stringify(storedSettings))
    const save = vi.fn().mockResolvedValue(undefined)
    const app = createAdminApp({
      root: defineComponent(() => () => h('main')),
      config: { appName: 'Configured Admin' },
      settings: {
        storage,
        sync: { save },
        syncDebounce: 25,
      },
    })
    const service = app.config.globalProperties.$admin.settings

    expect(service.getSettings().appName).toBe('Stored Admin')
    service.updateSettings({ layout: { mode: 'top' } })
    expect(save).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(25)

    expect(save).toHaveBeenCalledTimes(1)
    expect(save.mock.calls[0]?.[0].layout.mode).toBe('top')
    await service.dispose()
  })

  it('throws clear errors when composables are used without an admin app provider', () => {
    const app = createApp(defineComponent(() => () => h('main')))

    expect(() => app.runWithContext(() => useAdminApp())).toThrow(
      'useAdminApp() must be called inside an app created by createAdminApp()',
    )
    expect(() => app.runWithContext(() => useAdminSettings())).toThrow(
      'useAdminApp() must be called inside an app created by createAdminApp()',
    )
  })

  it('flushes the latest scheduled settings once when the app unmounts', async () => {
    vi.useFakeTimers()
    const save = vi.fn().mockResolvedValue(undefined)
    const app = createAdminApp({
      root: defineComponent(() => () => h('main')),
      settings: {
        storage: createMemoryStorage(),
        sync: { save },
        syncDebounce: 1_000,
      },
    })
    const service = app.config.globalProperties.$admin.settings
    app.mount(createHost())
    service.updateSettings({ layout: { mode: 'top' } })
    service.updateSettings({ layout: { mode: 'mixed' } })

    app.unmount()
    await Promise.resolve()
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1))

    expect(save.mock.calls[0]?.[0].layout.mode).toBe('mixed')
    expect(vi.getTimerCount()).toBe(0)
    await vi.runAllTimersAsync()
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('allows component teardown to update the latest settings before disposal', async () => {
    vi.useFakeTimers()
    const save = vi.fn().mockResolvedValue(undefined)
    const root = defineComponent({
      setup() {
        const settings = useAdminSettings()
        onBeforeUnmount(() => {
          settings.updateSettings({ layout: { mode: 'mixed' } })
        })
        return () => h('main')
      },
    })
    const app = createAdminApp({
      root,
      settings: {
        storage: createMemoryStorage(),
        sync: { save },
        syncDebounce: 1_000,
      },
    })
    app.mount(createHost())

    expect(() => app.unmount()).not.toThrow()
    await Promise.resolve()
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1))

    expect(save.mock.calls[0]?.[0].layout.mode).toBe('mixed')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('allows later plugin teardown to update settings before disposal', async () => {
    vi.useFakeTimers()
    const save = vi.fn().mockResolvedValue(undefined)
    const app = createAdminApp({
      root: defineComponent(() => () => h('main')),
      plugins: [{
        install(installedApp) {
          installedApp.onUnmount(() => {
            installedApp.config.globalProperties.$admin.settings.updateSettings({
              layout: { mode: 'top' },
            })
          })
        },
      }],
      settings: {
        storage: createMemoryStorage(),
        sync: { save },
        syncDebounce: 1_000,
      },
    })
    app.mount(createHost())

    expect(() => app.unmount()).not.toThrow()
    await Promise.resolve()
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1))

    expect(save.mock.calls[0]?.[0].layout.mode).toBe('top')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('consumes an unmount save rejection while preserving observable sync errors', async () => {
    vi.useFakeTimers()
    const saveError = new Error('unmount save failed')
    const onSyncError = vi.fn()
    const unhandledRejection = vi.fn()
    window.addEventListener('unhandledrejection', unhandledRejection)
    try {
      const app = createAdminApp({
        root: defineComponent(() => () => h('main')),
        settings: {
          storage: createMemoryStorage(),
          sync: { save: vi.fn().mockRejectedValue(saveError) },
          syncDebounce: 1_000,
          onSyncError,
        },
      })
      const service = app.config.globalProperties.$admin.settings
      app.mount(createHost())
      service.updateSettings({ layout: { mode: 'top' } })

      app.unmount()
      await Promise.resolve()
      await vi.waitFor(() => expect(onSyncError).toHaveBeenCalledTimes(1))
      await Promise.resolve()

      expect(service.syncStatus.value).toBe('error')
      expect(service.lastError.value).toBe(saveError)
      expect(onSyncError).toHaveBeenCalledWith({
        operation: 'save',
        error: saveError,
        settings: expect.objectContaining({ layout: expect.objectContaining({ mode: 'top' }) }),
      })
      expect(unhandledRejection).not.toHaveBeenCalled()
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      window.removeEventListener('unhandledrejection', unhandledRejection)
    }
  })
})
