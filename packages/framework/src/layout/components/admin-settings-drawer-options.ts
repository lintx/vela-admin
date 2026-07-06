import type { AdminLayoutMode, AdminScrollbarMode, AdminThemeBase, AdminThemeMode } from '../../index'

export const layoutModes: Array<{ value: AdminLayoutMode, label: string }> = [
  { value: 'side', label: '侧栏' },
  { value: 'top', label: '顶栏' },
  { value: 'mixed', label: '混合' },
]

export const scrollbarModes: Array<{ value: AdminScrollbarMode, label: string }> = [
  { value: 'thin', label: '始终显示' },
  { value: 'hover', label: '悬停显示' },
  { value: 'native', label: '系统默认' },
]

export const themeBases: Array<{ value: AdminThemeBase, label: string }> = [
  { value: 'md3Light', label: 'MD3' },
  { value: 'md2Light', label: 'MD2' },
]

export const themeModes: Array<{ value: AdminThemeMode, label: string }> = [
  { value: 'system', label: '系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
]

export const presetThemeColors = [
  { color: '#6750A4', label: 'MD3 紫' },
  { color: '#2563EB', label: 'MD2 蓝' },
  { color: '#0F766E', label: '青绿' },
  { color: '#7C3AED', label: '靛紫' },
  { color: '#EA580C', label: '橙色' },
  { color: '#DC2626', label: '红色' },
]
