import type { AdminResolvedThemeMode } from '../../app/define-admin-config'
import type {
  AdminThemeBase,
  ResolvedAdminTheme,
} from '../../theme/create-theme'

export interface AdminThemeGeneratorPayload {
  sourceColor: string
  themeBase: AdminThemeBase
  themeMode: AdminResolvedThemeMode
  theme: ResolvedAdminTheme
}

export interface ThemeGeneratorFile {
  file?: File
  url?: string
  cover?: string
  name?: string
}

export interface ThemeColorChip {
  color: string
  label: string
  removable?: boolean
}

export interface ThemeGeneratorOption<T extends string> {
  value: T
  label: string
}

export interface ThemeGeneratorSwatch {
  label: string
  value: string
}
