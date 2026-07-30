import type { AdminConfig, AdminConfigInput } from '../app/define-admin-config'
import { mergeAdminConfig } from '../app/define-admin-config'
import { normalizeStoredAdminSettings } from './migrate-admin-settings'

const DEFAULT_SYNC_DEBOUNCE = 500

export function normalizeSyncDebounce(syncDebounce: number | undefined): number {
  return typeof syncDebounce === 'number'
    && Number.isFinite(syncDebounce)
    && syncDebounce >= 0
    ? syncDebounce
    : DEFAULT_SYNC_DEBOUNCE
}

export function cloneAdminConfig(settings: AdminConfig): AdminConfig {
  return JSON.parse(JSON.stringify(settings)) as AdminConfig
}

export function mergeSettings(settings: AdminConfig, partialSettings: AdminConfigInput) {
  return mergeAdminConfig({
    ...settings,
    ...partialSettings,
    layout: {
      ...settings.layout,
      ...(partialSettings.layout ?? {}),
    },
    icons: {
      ...settings.icons,
      ...(partialSettings.icons ?? {}),
      phosphor: {
        ...settings.icons.phosphor,
        ...(partialSettings.icons?.phosphor ?? {}),
      },
    },
    theme: {
      ...settings.theme,
      ...(partialSettings.theme ?? {}),
    },
    tabs: {
      ...settings.tabs,
      ...(partialSettings.tabs ?? {}),
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

export function loadSettings(config: AdminConfig, storage?: Storage): AdminConfig {
  if (!config.settings.persist || !storage) {
    return config
  }

  const rawSettings = storage.getItem(config.settings.storageKey)

  if (!rawSettings) {
    return config
  }

  try {
    return mergeSettings(config, normalizeStoredAdminSettings(JSON.parse(rawSettings), config))
  } catch {
    return config
  }
}
