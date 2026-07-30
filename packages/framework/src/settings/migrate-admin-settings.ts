import type {
  AdminConfig,
  AdminConfigInput,
  AdminLayoutMode,
  AdminThemeColor,
} from '../app/define-admin-config'
import type { AdminIconLibrary, AdminPhosphorWeight } from '../icons/icon-types'
import type { AdminThemeBase } from '../theme/create-theme'
import type { AdminScrollbarMode } from '../theme/tokens'

type UnknownRecord = Record<string, unknown>

const layoutModes: readonly AdminLayoutMode[] = ['side', 'top', 'mixed']
const scrollbarModes: readonly AdminScrollbarMode[] = ['thin', 'hover', 'native']
const themeModes = ['system', 'light', 'dark'] as const
const themeBases: readonly AdminThemeBase[] = ['md3Light', 'md3Dark', 'md2Light', 'md2Dark']
const iconLibraries: readonly AdminIconLibrary[] = ['phosphor', 'tabler']
const phosphorWeights: readonly AdminPhosphorWeight[] = ['thin', 'light', 'regular', 'bold', 'fill', 'duotone']
const unauthorizedBehaviors = ['remove', 'disable', 'hide'] as const

/**
 * 将持久化值规范成受支持的配置输入，并兼容 Demo 早期使用的扁平设置结构。
 * 所有字段都在进入有效配置前完成类型或枚举校验，避免损坏的数据覆盖运行时默认值。
 */
export function normalizeStoredAdminSettings(value: unknown, config: AdminConfig): AdminConfigInput {
  if (!isRecord(value)) {
    return {}
  }

  if (isRecord(value.settings) && value.settings.schemaVersion !== undefined) {
    // 未知或损坏的显式版本不能降级成旧 Demo 格式，否则同名扁平字段可能被误应用。
    return value.settings.schemaVersion === 1 ? normalizeNestedSettings(value) : {}
  }

  if (hasNestedSettings(value)) {
    // SettingsService 升级前已持久化完整 AdminConfig，但尚未写入 schemaVersion。
    return normalizeNestedSettings(value)
  }

  return migrateLegacySettings(value, config)
}

function normalizeNestedSettings(value: UnknownRecord): AdminConfigInput {
  const result: AdminConfigInput = {}

  assignString(result, 'appName', value.appName)
  assignString(result, 'homePath', value.homePath)
  assignString(result, 'loginPath', value.loginPath)

  if (isRecord(value.layout)) {
    result.layout = normalizeLayout(value.layout)
  }
  if (isRecord(value.icons)) {
    result.icons = normalizeIcons(value.icons)
  }
  if (isRecord(value.theme)) {
    result.theme = normalizeTheme(value.theme)
  }
  if (isRecord(value.tabs)) {
    result.tabs = normalizeTabs(value.tabs)
  }
  if (isRecord(value.settings)) {
    const settings: NonNullable<AdminConfigInput['settings']> = { schemaVersion: 1 }
    assignBoolean(settings, 'persist', value.settings.persist)
    assignString(settings, 'storageKey', value.settings.storageKey)
    result.settings = settings
  }
  if (isRecord(value.permission) && includes(unauthorizedBehaviors, value.permission.unauthorizedBehavior)) {
    result.permission = { unauthorizedBehavior: value.permission.unauthorizedBehavior }
  }

  return result
}

function hasNestedSettings(value: UnknownRecord): boolean {
  return isRecord(value.layout)
    || isRecord(value.icons)
    || isRecord(value.theme)
    || isRecord(value.tabs)
    || isRecord(value.permission)
}

function migrateLegacySettings(value: UnknownRecord, config: AdminConfig): AdminConfigInput {
  const layout: NonNullable<AdminConfigInput['layout']> = {}
  const theme: NonNullable<AdminConfigInput['theme']> = {}

  if (includes(layoutModes, value.layoutMode)) layout.mode = value.layoutMode
  assignNumber(layout, 'sidebarWidth', value.sidebarWidth)
  if (includes(scrollbarModes, value.scrollbar)) layout.scrollbar = value.scrollbar

  if (isRecord(value.layoutFeatures)) {
    assignBoolean(layout, 'tagsView', value.layoutFeatures.tagsView)
    assignBoolean(layout, 'menuSearch', value.layoutFeatures.menuSearch)
    assignBoolean(layout, 'settings', value.layoutFeatures.settings)
  }

  if (includes(themeModes, value.themeMode)) theme.mode = value.themeMode
  if (includes(themeBases, value.themeBase)) theme.base = value.themeBase
  assignString(theme, 'sourceColor', value.sourceColor)
  if (Array.isArray(value.customColors)) theme.customColors = normalizeThemeColors(value.customColors)

  return {
    layout,
    theme,
    ...(Array.isArray(value.fixedTabs) ? { tabs: { fixedTabs: normalizeFixedTabs(value.fixedTabs) } } : {}),
    settings: {
      // 迁移完成后固定写入当前版本，同时保留调用方配置的持久化目标。
      persist: config.settings.persist,
      storageKey: config.settings.storageKey,
      schemaVersion: 1,
    },
  }
}

function normalizeLayout(value: UnknownRecord): NonNullable<AdminConfigInput['layout']> {
  const result: NonNullable<AdminConfigInput['layout']> = {}
  if (includes(layoutModes, value.mode)) result.mode = value.mode
  assignNumber(result, 'sidebarWidth', value.sidebarWidth)
  assignNumber(result, 'sidebarCollapsedWidth', value.sidebarCollapsedWidth)
  assignNumber(result, 'sidebarMenuItemHeight', value.sidebarMenuItemHeight)
  assignNumber(result, 'sidebarIconSize', value.sidebarIconSize)
  assignNumber(result, 'sidebarCollapsedIconSize', value.sidebarCollapsedIconSize)
  assignBoolean(result, 'expandedParentBackground', value.expandedParentBackground)
  assignNumber(result, 'expandedParentStateOpacity', value.expandedParentStateOpacity)
  assignNumber(result, 'activeStateOpacity', value.activeStateOpacity)
  assignNumber(result, 'hoverStateOpacity', value.hoverStateOpacity)
  if (value.collapsedSubMenuTrigger === 'hover' || value.collapsedSubMenuTrigger === 'click') {
    result.collapsedSubMenuTrigger = value.collapsedSubMenuTrigger
  }
  if (includes(scrollbarModes, value.scrollbar)) result.scrollbar = value.scrollbar
  assignNumber(result, 'scrollbarWidth', value.scrollbarWidth)
  assignNumber(result, 'scrollbarThumbOpacity', value.scrollbarThumbOpacity)
  assignNumber(result, 'scrollbarThumbHoverOpacity', value.scrollbarThumbHoverOpacity)
  assignBoolean(result, 'tagsView', value.tagsView)
  assignBoolean(result, 'menuSearch', value.menuSearch)
  assignBoolean(result, 'settings', value.settings)
  return result
}

function normalizeTheme(value: UnknownRecord): NonNullable<AdminConfigInput['theme']> {
  const result: NonNullable<AdminConfigInput['theme']> = {}
  if (includes(themeBases, value.base)) result.base = value.base
  if (includes(themeModes, value.mode)) result.mode = value.mode
  assignBoolean(result, 'persist', value.persist)
  assignBoolean(result, 'developerTools', value.developerTools)
  assignString(result, 'sourceColor', value.sourceColor)
  if (Array.isArray(value.customColors)) result.customColors = normalizeThemeColors(value.customColors)
  return result
}

function normalizeIcons(value: UnknownRecord): NonNullable<AdminConfigInput['icons']> {
  const result: NonNullable<AdminConfigInput['icons']> = {}
  if (includes(iconLibraries, value.defaultLibrary)) result.defaultLibrary = value.defaultLibrary
  if (includes(iconLibraries, value.fallbackLibrary)) result.fallbackLibrary = value.fallbackLibrary
  if (isRecord(value.phosphor) && includes(phosphorWeights, value.phosphor.weight)) {
    result.phosphor = { weight: value.phosphor.weight }
  }
  return result
}

function normalizeTabs(value: UnknownRecord): NonNullable<AdminConfigInput['tabs']> {
  return Array.isArray(value.fixedTabs) ? { fixedTabs: normalizeFixedTabs(value.fixedTabs) } : {}
}

function normalizeThemeColors(values: unknown[]): AdminThemeColor[] {
  return values.flatMap((value) => {
    if (!isRecord(value) || typeof value.color !== 'string' || typeof value.label !== 'string') return []
    if (value.removable !== undefined && typeof value.removable !== 'boolean') return []
    return [{
      color: value.color,
      label: value.label,
      ...(typeof value.removable === 'boolean' ? { removable: value.removable } : {}),
    }]
  })
}

function normalizeFixedTabs(values: unknown[]): Array<{ path: string; title: string }> {
  return values.flatMap((value) => (
    isRecord(value) && typeof value.path === 'string' && typeof value.title === 'string'
      ? [{ path: value.path, title: value.title }]
      : []
  ))
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function includes<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (values as readonly string[]).includes(value)
}

function assignString<T extends object, K extends keyof T>(target: T, key: K, value: unknown): void {
  if (typeof value === 'string') target[key] = value as T[K]
}

function assignNumber<T extends object, K extends keyof T>(target: T, key: K, value: unknown): void {
  if (typeof value === 'number' && Number.isFinite(value)) target[key] = value as T[K]
}

function assignBoolean<T extends object, K extends keyof T>(target: T, key: K, value: unknown): void {
  if (typeof value === 'boolean') target[key] = value as T[K]
}
