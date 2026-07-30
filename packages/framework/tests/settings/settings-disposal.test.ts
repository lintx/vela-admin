import { afterEach, describe, expect, it, vi } from 'vitest'

import { createSettingsService, mergeAdminConfig } from '../../src/index'
import { createDeferred, createMemoryStorage } from './settings-test-utils'

afterEach(() => {
  vi.useRealTimers()
})

describe('createSettingsService retry and disposal', () => {
  it('retries after an in-flight save fails when retrySync was already requested', async () => {
    const first = createDeferred<void>()
    const saveError = new Error('first save failed')
    const save = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(undefined)
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: { save },
    })
    service.updateSettings({ layout: { mode: 'top' } })
    const syncing = service.syncSettings()
    const retrying = service.retrySync()
    first.reject(saveError)
    await expect(syncing).rejects.toBe(saveError)
    await expect(retrying).resolves.toMatchObject({ layout: { mode: 'top' } })
    expect(save).toHaveBeenCalledTimes(2)
    expect(service.syncStatus.value).toBe('synced')
  })

  it('dispose clears timers and flushes the latest pending revision', async () => {
    vi.useFakeTimers()
    const save = vi.fn().mockResolvedValue(undefined)
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: { save },
    })
    service.updateSettings({ layout: { mode: 'mixed' } })
    const disposed = await service.dispose()
    expect(disposed.layout.mode).toBe('mixed')
    expect(save).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('dispose waits for an in-flight save and flushes a newer revision', async () => {
    vi.useFakeTimers()
    const first = createDeferred<void>()
    const save = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(undefined)
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: { save },
      syncDebounce: 0,
    })
    service.updateSettings({ layout: { mode: 'top' } })
    void service.syncSettings()
    service.updateSettings({ layout: { mode: 'mixed' } })
    const disposing = service.dispose()
    first.resolve()
    const disposed = await disposing
    expect(disposed.layout.mode).toBe('mixed')
    expect(save).toHaveBeenCalledTimes(2)
    expect(save.mock.calls[1]?.[0].layout.mode).toBe('mixed')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('shares one latest flush across concurrent dispose calls after an older save fails', async () => {
    const first = createDeferred<void>()
    const firstError = new Error('older save failed')
    const onSyncError = vi.fn()
    const save = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(undefined)
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: { save },
      onSyncError,
    })
    service.updateSettings({ layout: { mode: 'top' } })
    const syncing = service.syncSettings()
    service.updateSettings({ layout: { mode: 'mixed' } })
    const retrying = service.retrySync()
    const disposal1 = service.dispose()
    const disposal2 = service.dispose()
    first.reject(firstError)
    await expect(syncing).rejects.toBe(firstError)
    const [, disposed1, disposed2] = await Promise.all([retrying, disposal1, disposal2])
    expect(disposed1).toMatchObject({ layout: { mode: 'mixed' } })
    expect(disposed2).toBe(disposed1)
    await expect(service.dispose()).resolves.toBe(disposed1)
    expect(save).toHaveBeenCalledTimes(2)
    expect(save.mock.calls[1]?.[0].layout.mode).toBe('mixed')
    expect(service.syncStatus.value).toBe('synced')
    expect(service.lastError.value).toBeNull()
    expect(onSyncError).toHaveBeenCalledWith({
      operation: 'save',
      error: firstError,
      settings: save.mock.calls[0]?.[0],
    })
  })

  it('settles retry and dispose from the newer save after the original save fails', async () => {
    const first = createDeferred<void>()
    const second = createDeferred<void>()
    const firstError = new Error('older save failed')
    let service!: ReturnType<typeof createSettingsService>
    let disposing!: ReturnType<typeof service.dispose>
    let saveAttempt = 0
    const save = vi.fn(() => {
      saveAttempt += 1
      if (saveAttempt === 1) {
        return first.promise
      }

      disposing = service.dispose()
      return second.promise
    })
    service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: { save },
    })
    service.updateSettings({ layout: { mode: 'top' } })
    const syncing = service.syncSettings()
    service.updateSettings({ layout: { mode: 'mixed' } })
    const retrying = service.retrySync()

    first.reject(firstError)
    await expect(syncing).rejects.toBe(firstError)
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(2))
    let disposeSettled = false
    void disposing.then(
      () => { disposeSettled = true },
      () => { disposeSettled = true },
    )
    await Promise.resolve()
    expect(disposeSettled).toBe(false)
    second.resolve()

    await expect(retrying).resolves.toMatchObject({ layout: { mode: 'mixed' } })
    await expect(disposing).resolves.toMatchObject({ layout: { mode: 'mixed' } })
    expect(save).toHaveBeenCalledTimes(2)
    expect(save.mock.calls[1]?.[0].layout.mode).toBe('mixed')
  })

  it('rejects retry and dispose with the newer save error after the original save fails', async () => {
    const first = createDeferred<void>()
    const second = createDeferred<void>()
    const firstError = new Error('older save failed')
    const latestError = new Error('latest save failed')
    let service!: ReturnType<typeof createSettingsService>
    let disposing!: ReturnType<typeof service.dispose>
    let saveAttempt = 0
    const save = vi.fn(() => {
      saveAttempt += 1
      if (saveAttempt === 1) {
        return first.promise
      }

      disposing = service.dispose()
      return second.promise
    })
    service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: { save },
    })
    service.updateSettings({ layout: { mode: 'top' } })
    const syncing = service.syncSettings()
    service.updateSettings({ layout: { mode: 'mixed' } })
    const retrying = service.retrySync()

    first.reject(firstError)
    await expect(syncing).rejects.toBe(firstError)
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(2))
    second.reject(latestError)

    await expect(retrying).rejects.toBe(latestError)
    await expect(disposing).rejects.toBe(latestError)
    expect(save).toHaveBeenCalledTimes(2)
    expect(save.mock.calls[1]?.[0].layout.mode).toBe('mixed')
  })

  it('dispose rejects the latest save failure without retrying it indefinitely', async () => {
    const first = createDeferred<void>()
    const firstError = new Error('older save failed')
    const latestError = new Error('latest save failed')
    const onSyncError = vi.fn()
    const save = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockRejectedValueOnce(latestError)
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: { save },
      onSyncError,
    })
    service.updateSettings({ layout: { mode: 'top' } })
    const syncing = service.syncSettings()
    service.updateSettings({ layout: { mode: 'mixed' } })
    const retrying = service.retrySync()
    const disposing = service.dispose()
    first.reject(firstError)
    await expect(syncing).rejects.toBe(firstError)
    await expect(retrying).rejects.toBe(latestError)
    await expect(disposing).rejects.toBe(latestError)
    expect(save).toHaveBeenCalledTimes(2)
    expect(save.mock.calls[1]?.[0].layout.mode).toBe('mixed')
    expect(service.syncStatus.value).toBe('error')
    expect(service.lastError.value).toBe(latestError)
    expect(onSyncError).toHaveBeenLastCalledWith({
      operation: 'save',
      error: latestError,
      settings: save.mock.calls[1]?.[0],
    })
  })

  it('dispose reports a pending save failure and still clears the timer', async () => {
    vi.useFakeTimers()
    const saveError = new Error('dispose save failed')
    const service = createSettingsService({
      config: mergeAdminConfig(),
      storage: createMemoryStorage(),
      sync: { save: vi.fn().mockRejectedValue(saveError) },
    })
    service.updateSettings({ layout: { mode: 'top' } })
    await expect(service.dispose()).rejects.toBe(saveError)
    expect(service.syncStatus.value).toBe('error')
    expect(service.lastError.value).toBe(saveError)
    expect(vi.getTimerCount()).toBe(0)
  })
})
