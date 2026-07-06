import {
  argbFromHex,
  hexFromArgb,
  themeFromSourceColor,
  type Scheme,
} from '@material/material-color-utilities'

import { createAdminTheme, type ResolvedAdminTheme } from './create-theme'

export interface GeneratedMaterialAdminThemes {
  sourceColor: string
  light: ResolvedAdminTheme
  dark: ResolvedAdminTheme
}

export function generateMaterialAdminThemes(sourceColor: string): GeneratedMaterialAdminThemes {
  const normalizedSourceColor = normalizeHexColor(sourceColor)
  const materialTheme = themeFromSourceColor(argbFromHex(normalizedSourceColor))

  return {
    sourceColor: normalizedSourceColor,
    light: createAdminTheme({
      base: 'md3Light',
      varletTheme: materialSchemeToVarletTheme(materialTheme.schemes.light, false),
    }),
    dark: createAdminTheme({
      base: 'md3Dark',
      varletTheme: materialSchemeToVarletTheme(materialTheme.schemes.dark, true),
    }),
  }
}

function normalizeHexColor(color: string): string {
  const trimmedColor = color.trim()

  if (/^#[0-9a-fA-F]{6}$/.test(trimmedColor)) {
    return trimmedColor.toUpperCase()
  }

  if (/^[0-9a-fA-F]{6}$/.test(trimmedColor)) {
    return `#${trimmedColor.toUpperCase()}`
  }

  throw new Error(`Invalid source color: ${color}`)
}

function materialSchemeToVarletTheme(scheme: Scheme, dark: boolean): Record<string, string> {
  const values = scheme.toJSON()

  return {
    '--color-scheme': dark ? 'dark' : 'light',
    '--color-primary': hexFromArgb(values.primary),
    '--color-on-primary': hexFromArgb(values.onPrimary),
    '--color-primary-container': hexFromArgb(values.primaryContainer),
    '--color-on-primary-container': hexFromArgb(values.onPrimaryContainer),
    '--color-info': hexFromArgb(values.secondary),
    '--color-on-info': hexFromArgb(values.onSecondary),
    '--color-info-container': hexFromArgb(values.secondaryContainer),
    '--color-on-info-container': hexFromArgb(values.onSecondaryContainer),
    '--color-success': hexFromArgb(values.tertiary),
    '--color-on-success': hexFromArgb(values.onTertiary),
    '--color-success-container': hexFromArgb(values.tertiaryContainer),
    '--color-on-success-container': hexFromArgb(values.onTertiaryContainer),
    '--color-danger': hexFromArgb(values.error),
    '--color-on-danger': hexFromArgb(values.onError),
    '--color-danger-container': hexFromArgb(values.errorContainer),
    '--color-on-danger-container': hexFromArgb(values.onErrorContainer),
    '--color-body': hexFromArgb(values.background),
    '--color-text': hexFromArgb(values.onBackground),
    '--color-surface-container': hexFromArgb(values.surface),
    '--color-surface-container-low': hexFromArgb(values.surface),
    '--color-surface-container-high': hexFromArgb(values.surfaceVariant),
    '--color-surface-container-highest': hexFromArgb(values.surfaceVariant),
    '--color-on-surface-variant': hexFromArgb(values.onSurfaceVariant),
    '--color-outline': hexFromArgb(values.outline),
    '--color-outline-variant': hexFromArgb(values.outlineVariant),
    '--color-inverse-surface': hexFromArgb(values.inverseSurface),
  }
}
