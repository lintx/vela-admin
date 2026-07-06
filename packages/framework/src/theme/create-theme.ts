import { Themes } from '@varlet/ui'

import {
  adminTokenToCssVariables,
  defaultAdminTokens,
  type AdminThemeTokens,
} from './tokens'

export type AdminThemeBase = 'md3Light' | 'md3Dark' | 'md2Light' | 'md2Dark'

export interface AdminThemeOptions {
  base?: AdminThemeBase
  varletTheme?: Record<string, string>
  adminTokens?: Partial<AdminThemeTokens>
}

export interface ResolvedAdminTheme {
  base: AdminThemeBase
  varletTheme: Record<string, string>
  adminTokens: AdminThemeTokens
  cssVariables: Record<string, string>
}

// MD2 浅色是 Varlet 默认主题，局部预览不能依赖“清空变量”回退，需显式覆盖会被 MD3 改写的形态变量。
const md2LightScopedVariables: Record<string, string> = {
  '--hsl-body': '0, 0%, 100%',
  '--color-body': 'hsla(var(--hsl-body), 1)',
  '--hsl-text': '0, 0%, 20%',
  '--color-text': 'hsla(var(--hsl-text), 1)',
  '--hsl-surface-container': '0, 0%, 100%',
  '--color-surface-container': 'hsla(var(--hsl-surface-container), 1)',
  '--hsl-surface-container-low': '0, 0%, 100%',
  '--color-surface-container-low': 'hsla(var(--hsl-surface-container-low), 1)',
  '--hsl-surface-container-high': '0, 0%, 100%',
  '--color-surface-container-high': 'hsla(var(--hsl-surface-container-high), 1)',
  '--hsl-surface-container-highest': '0, 0%, 100%',
  '--color-surface-container-highest': 'hsla(var(--hsl-surface-container-highest), 1)',
  '--hsl-outline': '0, 0%, 0%',
  '--color-outline': 'hsla(var(--hsl-outline), 0.12)',
  '--color-outline-variant': 'var(--color-outline)',
  '--hsl-on-surface-variant': '0, 0%, 53%',
  '--color-on-surface-variant': 'hsla(var(--hsl-on-surface-variant), 1)',
  '--button-border-radius': Themes.dark['--button-border-radius'],
  '--button-default-text-color': 'var(--color-primary)',
  '--button-primary-text-color': 'var(--color-on-primary)',
  '--button-danger-text-color': 'var(--color-on-danger)',
  '--button-success-text-color': 'var(--color-on-success)',
  '--button-warning-text-color': 'var(--color-on-warning)',
  '--button-info-text-color': 'var(--color-on-info)',
  '--button-primary-color': 'var(--color-primary)',
  '--button-danger-color': 'var(--color-danger)',
  '--button-success-color': 'var(--color-success)',
  '--button-warning-color': 'var(--color-warning)',
  '--button-info-color': 'var(--color-info)',
  '--button-primary-icon-color': 'var(--color-on-primary-container)',
  '--button-danger-icon-color': 'var(--color-on-danger-container)',
  '--button-success-icon-color': 'var(--color-on-success-container)',
  '--button-warning-icon-color': 'var(--color-on-warning-container)',
  '--button-info-icon-color': 'var(--color-on-info-container)',
  '--button-primary-icon-container-color': 'var(--color-primary-container)',
  '--button-danger-icon-container-color': 'var(--color-danger-container)',
  '--button-success-icon-container-color': 'var(--color-success-container)',
  '--button-warning-icon-container-color': 'var(--color-warning-container)',
  '--button-info-icon-container-color': 'var(--color-info-container)',
  '--card-border-radius': Themes.dark['--card-border-radius'],
  '--card-background': 'var(--color-surface-container-highest)',
  '--dialog-border-radius': Themes.dark['--dialog-border-radius'],
  '--menu-border-radius': Themes.dark['--menu-border-radius'],
  '--snackbar-border-radius': Themes.dark['--snackbar-border-radius'],
  '--chip-border-radius': Themes.dark['--chip-border-radius'],
}

export const md2LightScopedVariableNames = new Set(Object.keys(md2LightScopedVariables))

export function resolveVarletTheme(base: AdminThemeBase): Record<string, string> {
  if (base === 'md3Light') {
    return { ...Themes.md3Light }
  }

  if (base === 'md3Dark') {
    return { ...Themes.md3Dark }
  }

  if (base === 'md2Dark') {
    return { ...Themes.dark }
  }

  // Varlet 的 MD2 浅色是默认主题，StyleProvider(null) 即可恢复。
  return {}
}

export function createAdminTheme(options: AdminThemeOptions = {}): ResolvedAdminTheme {
  const base = options.base ?? 'md3Light'
  const varletTheme = {
    ...resolveVarletTheme(base),
    ...(options.varletTheme ?? {}),
  }
  const scopedVarletFallback = base === 'md2Light' ? md2LightScopedVariables : {}
  const adminTokens = {
    ...defaultAdminTokens,
    ...(options.adminTokens ?? {}),
  }
  const adminCssVariables = adminTokenToCssVariables(adminTokens)

  return {
    base,
    varletTheme,
    adminTokens,
    cssVariables: {
      ...scopedVarletFallback,
      ...varletTheme,
      ...adminCssVariables,
    },
  }
}

export function createAdminThemeCssText(theme: ResolvedAdminTheme, selector = ':root'): string {
  const variables = Object.entries(theme.cssVariables)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')

  return `${selector} {\n${variables}\n}\n`
}
