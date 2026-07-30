import type {
  AdminResolvedThemeMode,
  AdminThemeColor,
  AdminThemeMode,
} from '../app/define-admin-config'
import type { AdminThemeBase } from './create-theme'
import type { AdminThemeTransitionWindow } from './theme-transition'

const PRESET_THEME_COLORS = new Set([
  '#6750A4',
  '#2563EB',
  '#0F766E',
  '#7C3AED',
  '#EA580C',
  '#DC2626',
])

export interface AdminThemeColorInput {
  color: string
  label?: string
  removable?: boolean
}

export function resolveAdminThemeMode(
  mode: AdminThemeMode,
  windowRef: Pick<AdminThemeTransitionWindow, 'matchMedia'>,
): AdminResolvedThemeMode {
  if (mode !== 'system') {
    return mode
  }

  return windowRef.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveAdminThemeBase(base: AdminThemeBase, mode: AdminResolvedThemeMode): AdminThemeBase {
  const family = base.startsWith('md2') ? 'md2' : 'md3'
  return `${family}${mode === 'dark' ? 'Dark' : 'Light'}` as AdminThemeBase
}

export function normalizeAdminThemeColors(
  colors: AdminThemeColorInput[],
  currentSourceColor: string,
): AdminThemeColor[] {
  const customColorMap = new Map<string, AdminThemeColor>()

  for (const item of colors) {
    if (!item?.color || PRESET_THEME_COLORS.has(item.color)) {
      continue
    }

    customColorMap.set(item.color, {
      color: item.color,
      label: item.label || `自定义 ${item.color}`,
      removable: item.removable !== false,
    })
  }

  if (currentSourceColor && !PRESET_THEME_COLORS.has(currentSourceColor) && !customColorMap.has(currentSourceColor)) {
    customColorMap.set(currentSourceColor, {
      color: currentSourceColor,
      label: `自定义 ${currentSourceColor}`,
      removable: true,
    })
  }

  return Array.from(customColorMap.values())
}
