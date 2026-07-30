import type { AdminConfig, AdminConfigInput } from '../app/define-admin-config'

export type SettingsSyncStatus = 'idle' | 'scheduled' | 'syncing' | 'synced' | 'error'

export interface SettingsSyncAdapter {
  load?: () => Promise<AdminConfigInput | null | undefined>
  save?: (settings: AdminConfig) => Promise<void>
}

export interface SettingsSyncErrorContext {
  operation: 'load' | 'save'
  error: unknown
  settings: AdminConfig
}
