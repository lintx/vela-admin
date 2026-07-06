import type { AdminThemeBase } from '../theme/create-theme'
import type { AdminIconConfig } from '../icons/icon-types'
import type { AdminScrollbarMode } from '../theme/tokens'
import { defaultAdminConfig } from '../settings/default-settings'

export type AdminLayoutMode = 'side' | 'top' | 'mixed'
export type AdminResolvedThemeMode = 'light' | 'dark'
export type AdminThemeMode = 'system' | AdminResolvedThemeMode

export interface AdminLayoutConfig {
  mode: AdminLayoutMode
  sidebarWidth: number
  sidebarCollapsedWidth: number
  sidebarMenuItemHeight: number
  sidebarIconSize: number
  sidebarCollapsedIconSize: number
  expandedParentBackground: boolean
  expandedParentStateOpacity: number
  activeStateOpacity: number
  hoverStateOpacity: number
  collapsedSubMenuTrigger: 'hover' | 'click'
  scrollbar: AdminScrollbarMode
  scrollbarWidth: number
  scrollbarThumbOpacity: number
  scrollbarThumbHoverOpacity: number
  tagsView: boolean
  menuSearch: boolean
  settings: boolean
}

export interface AdminThemeConfig {
  base: AdminThemeBase
  mode: AdminThemeMode
  persist: boolean
  developerTools: boolean
  sourceColor: string
}

export interface AdminSettingsConfig {
  persist: boolean
  storageKey: string
}

export interface AdminPermissionConfig {
  unauthorizedBehavior: 'remove' | 'disable' | 'hide'
}

export interface AdminConfig {
  appName: string
  homePath: string
  loginPath: string
  icons: AdminIconConfig
  layout: AdminLayoutConfig
  theme: AdminThemeConfig
  settings: AdminSettingsConfig
  permission: AdminPermissionConfig
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

export type AdminConfigInput = DeepPartial<AdminConfig>

export function defineAdminConfig<T extends AdminConfigInput>(config: T): T {
  return config
}

export function mergeAdminConfig(config: AdminConfigInput = {}): AdminConfig {
  return {
    ...defaultAdminConfig,
    ...config,
    layout: {
      ...defaultAdminConfig.layout,
      ...(config.layout ?? {}),
    },
    icons: {
      ...defaultAdminConfig.icons,
      ...(config.icons ?? {}),
      phosphor: {
        ...defaultAdminConfig.icons.phosphor,
        ...(config.icons?.phosphor ?? {}),
      },
    },
    theme: {
      ...defaultAdminConfig.theme,
      ...(config.theme ?? {}),
    },
    settings: {
      ...defaultAdminConfig.settings,
      ...(config.settings ?? {}),
    },
    permission: {
      ...defaultAdminConfig.permission,
      ...(config.permission ?? {}),
    },
  }
}
