import type { AdminConfig, AdminConfigInput } from '../app/define-admin-config'
import { readonly, ref, shallowReadonly, shallowRef, type Ref } from 'vue'
import { createSettingsSaveCoordinator } from './settings-save-coordinator'
import {
  cloneAdminConfig,
  loadSettings,
  mergeSettings,
  normalizeSyncDebounce,
} from './settings-service-utils'
import type {
  SettingsSyncAdapter,
  SettingsSyncErrorContext,
  SettingsSyncStatus,
} from './settings-sync-types'

const DISPOSED_ERROR_MESSAGE = 'Settings service has been disposed'

export interface CreateSettingsServiceOptions {
  config: AdminConfig
  storage?: Storage
  sync?: SettingsSyncAdapter
  syncDebounce?: number
  onSyncError?: (context: SettingsSyncErrorContext) => void
}

export interface SettingsService {
  readonly settings: Readonly<Ref<AdminConfig>>
  readonly syncStatus: Readonly<Ref<SettingsSyncStatus>>
  readonly lastError: Readonly<Ref<unknown | null>>
  getSettings(): AdminConfig
  updateSettings(settings: AdminConfigInput): AdminConfig
  resetSettings(): AdminConfig
  loadRemoteSettings(): Promise<AdminConfig>
  syncSettings(): Promise<AdminConfig>
  retrySync(): Promise<AdminConfig>
  dispose(): Promise<AdminConfig>
}

export function createSettingsService(options: CreateSettingsServiceOptions): SettingsService {
  const {
    config,
    storage = globalThis.localStorage,
    sync,
    onSyncError,
  } = options
  const settingsState = shallowRef(loadSettings(config, storage))
  const syncStatusState = ref<SettingsSyncStatus>('idle')
  const lastErrorState = shallowRef<unknown | null>(null)
  let activeLoadCount = 0
  let latestLoadGeneration = 0
  let operationGeneration = 0
  let lastSettledGeneration = 0
  let disposalPromise: Promise<AdminConfig> | undefined
  let currentFullRevision = 0
  let disposed = false

  function notifySyncError(context: SettingsSyncErrorContext) {
    try {
      onSyncError?.(context)
    } catch {
      // 错误回调属于观察入口，不应覆盖原始同步异常。
    }
  }

  function assertActive() {
    if (disposed) {
      throw new Error(DISPOSED_ERROR_MESSAGE)
    }
  }

  function recordSyncError(error: unknown, generation: number): boolean {
    if (generation < lastSettledGeneration) {
      return false
    }

    lastSettledGeneration = generation
    lastErrorState.value = error
    return true
  }

  function clearSyncError(generation: number) {
    if (generation < lastSettledGeneration) {
      return
    }

    lastSettledGeneration = generation
    lastErrorState.value = null
  }

  function updateSyncStatus() {
    if (activeLoadCount > 0 || saveCoordinator.isSaving) {
      syncStatusState.value = 'syncing'
      return
    }

    if (saveCoordinator.isScheduled || saveCoordinator.hasPending) {
      syncStatusState.value = 'scheduled'
      return
    }

    if (lastErrorState.value !== null) {
      syncStatusState.value = 'error'
      return
    }

    syncStatusState.value = sync?.save || sync?.load ? 'synced' : 'idle'
  }

  const saveCoordinator = createSettingsSaveCoordinator({
    save: sync?.save,
    debounce: normalizeSyncDebounce(options.syncDebounce),
    getSettings: () => settingsState.value,
    onSaveStart: () => ++operationGeneration,
    onSaveSuccess(generation) {
      clearSyncError(generation)
    },
    onSaveError(error, settings, generation) {
      if (recordSyncError(error, generation)) {
        notifySyncError({ operation: 'save', error, settings: cloneAdminConfig(settings) })
      }
    },
    onStateChange: updateSyncStatus,
  })

  function commit(nextSettings: AdminConfig, scheduleSave: boolean): AdminConfig {
    settingsState.value = nextSettings
    currentFullRevision = saveCoordinator.captureCurrent(nextSettings)

    if (nextSettings.settings.persist) {
      storage?.setItem(nextSettings.settings.storageKey, JSON.stringify(nextSettings))
    }

    if (scheduleSave) {
      saveCoordinator.markAutoDirty(nextSettings, currentFullRevision)
    }

    return nextSettings
  }

  return {
    settings: shallowReadonly(settingsState),
    syncStatus: readonly(syncStatusState),
    lastError: readonly(lastErrorState),
    getSettings() {
      return settingsState.value
    },
    updateSettings(partialSettings) {
      assertActive()
      return commit(mergeSettings(settingsState.value, partialSettings), true)
    },
    resetSettings() {
      assertActive()
      return commit(config, true)
    },
    async loadRemoteSettings() {
      assertActive()
      if (!sync?.load) {
        return settingsState.value
      }

      const generation = ++latestLoadGeneration
      const currentOperationGeneration = ++operationGeneration
      activeLoadCount += 1
      updateSyncStatus()
      try {
        const remoteSettings = await sync.load()
        if (disposed || generation !== latestLoadGeneration) {
          return settingsState.value
        }

        clearSyncError(currentOperationGeneration)
        // 远端 load 只更新展示状态，不会进入本地保存队列。
        return remoteSettings
          ? commit(cloneAdminConfig(mergeSettings(settingsState.value, remoteSettings)), false)
          : settingsState.value
      } catch (error) {
        if (!disposed && generation === latestLoadGeneration) {
          if (recordSyncError(error, currentOperationGeneration)) {
            notifySyncError({
              operation: 'load',
              error,
              settings: cloneAdminConfig(settingsState.value),
            })
          }
        }
        throw error
      } finally {
        if (!disposed) {
          activeLoadCount -= 1
          updateSyncStatus()
        }
      }
    },
    syncSettings() {
      try {
        assertActive()
      } catch (error) {
        return Promise.reject(error)
      }

      return saveCoordinator.sync(cloneAdminConfig(settingsState.value), currentFullRevision)
    },
    retrySync() {
      try {
        assertActive()
      } catch (error) {
        return Promise.reject(error)
      }

      return saveCoordinator.retry(cloneAdminConfig(settingsState.value), currentFullRevision)
    },
    dispose() {
      if (disposalPromise) {
        return disposalPromise
      }

      disposed = true
      latestLoadGeneration += 1
      activeLoadCount = 0
      disposalPromise = saveCoordinator.dispose().then(
        (settings) => {
          updateSyncStatus()
          if (!sync?.save) {
            syncStatusState.value = 'idle'
          }
          return settings
        },
        (error) => {
          updateSyncStatus()
          throw error
        },
      )
      updateSyncStatus()
      return disposalPromise
    },
  }
}
