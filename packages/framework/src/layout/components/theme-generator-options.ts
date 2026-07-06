import type { AdminResolvedThemeMode } from '../../app/define-admin-config'
import type { ThemeColorChip, ThemeGeneratorOption } from './theme-generator-types'

export const recommendedColors = [
  { color: '#6750A4', label: 'MD3 紫' },
  { color: '#2563EB', label: 'MD2 蓝' },
  { color: '#0F766E', label: '青绿' },
  { color: '#7C3AED', label: '靛紫' },
  { color: '#EA580C', label: '橙色' },
  { color: '#DC2626', label: '红色' },
] satisfies ThemeColorChip[]

export const themeVersions: Array<ThemeGeneratorOption<'md3' | 'md2'>> = [
  { value: 'md3', label: 'MD3' },
  { value: 'md2', label: 'MD2' },
]

export const themeModes: Array<ThemeGeneratorOption<AdminResolvedThemeMode>> = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
]

export const exportModes: Array<ThemeGeneratorOption<'css' | 'json'>> = [
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
]
