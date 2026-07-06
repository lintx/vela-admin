import type { AdminConfig, AdminConfigInput } from '../app/define-admin-config'
import { mergeAdminConfig } from '../app/define-admin-config'

export interface CreateSettingsServiceOptions {
  config: AdminConfig
  storage?: Storage
  sync?: SettingsSyncAdapter
}

export interface SettingsService {
  getSettings(): AdminConfig
  updateSettings(settings: AdminConfigInput): AdminConfig
  resetSettings(): AdminConfig
  loadRemoteSettings(): Promise<AdminConfig>
  syncSettings(): Promise<AdminConfig>
}

export interface SettingsSyncAdapter {
  load?: () => Promise<AdminConfigInput | null | undefined>
  save?: (settings: AdminConfig) => Promise<void>
}

export function createSettingsService(options: CreateSettingsServiceOptions): SettingsService {
  const { config, storage = globalThis.localStorage, sync } = options
  let settings = loadSettings(config, storage)

  function commit(nextSettings: AdminConfig): AdminConfig {
    settings = nextSettings

    if (settings.settings.persist) {
      storage?.setItem(settings.settings.storageKey, JSON.stringify(settings))
    }

    return settings
  }

  return {
    getSettings() {
      return settings
    },
    updateSettings(partialSettings) {
      return commit(mergeSettings(settings, partialSettings))
    },
    resetSettings() {
      return commit(config)
    },
    async loadRemoteSettings() {
      const remoteSettings = await sync?.load?.()
      if (!remoteSettings) {
        return settings
      }

      return commit(mergeSettings(settings, remoteSettings))
    },
    async syncSettings() {
      await sync?.save?.(settings)
      return settings
    },
  }
}

function mergeSettings(settings: AdminConfig, partialSettings: AdminConfigInput) {
  return mergeAdminConfig({
    ...settings,
    ...partialSettings,
    layout: {
      ...settings.layout,
      ...(partialSettings.layout ?? {}),
    },
    theme: {
      ...settings.theme,
      ...(partialSettings.theme ?? {}),
    },
    settings: {
      ...settings.settings,
      ...(partialSettings.settings ?? {}),
    },
    permission: {
      ...settings.permission,
      ...(partialSettings.permission ?? {}),
    },
  })
}

function loadSettings(config: AdminConfig, storage?: Storage): AdminConfig {
  if (!config.settings.persist || !storage) {
    return config
  }

  const rawSettings = storage.getItem(config.settings.storageKey)

  if (!rawSettings) {
    return config
  }

  try {
    return mergeAdminConfig(JSON.parse(rawSettings))
  } catch {
    return config
  }
}
