import type { AdminThemeBase, ResolvedAdminTheme } from './create-theme'
import { createAdminTheme, createAdminThemeCssText } from './create-theme'
import type { AdminResolvedThemeMode } from '../app/define-admin-config'
import { generateMaterialAdminThemes } from './material-theme-generator'

export interface ThemeImageLike {
  type?: string
}

export interface ThemeImageDataLike {
  data: ArrayLike<number>
}

export interface ThemeGeneratorExportInput {
  sourceColor: string
  themeBase: AdminThemeBase
  themeMode: AdminResolvedThemeMode
  theme: ResolvedAdminTheme
}

export interface SourceColorAdminThemeInput {
  sourceColor: string
  themeBase: AdminThemeBase
  themeMode: AdminResolvedThemeMode
}

export interface ThemeGeneratorExportResult {
  cssText: string
  jsonText: string
}

interface ColorBucket {
  weight: number
  red: number
  green: number
  blue: number
}

export function validateThemeImageFile(file?: ThemeImageLike): string | null {
  if (!file) {
    return '请选择图片文件'
  }

  if (!file.type?.startsWith('image/')) {
    return '只支持图片文件'
  }

  return null
}

export function extractDominantColorFromImageData(imageData: ThemeImageDataLike): string {
  const buckets = new Map<string, ColorBucket>()
  const { data } = imageData

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] ?? 255

    if (alpha < 16) {
      continue
    }

    const red = data[index] ?? 0
    const green = data[index + 1] ?? 0
    const blue = data[index + 2] ?? 0
    const key = `${red >> 4}:${green >> 4}:${blue >> 4}`
    const weight = alpha / 255
    const bucket = buckets.get(key) ?? { weight: 0, red: 0, green: 0, blue: 0 }

    bucket.weight += weight
    bucket.red += red * weight
    bucket.green += green * weight
    bucket.blue += blue * weight
    buckets.set(key, bucket)
  }

  const dominant = Array.from(buckets.values()).sort((left, right) => right.weight - left.weight)[0]

  if (!dominant) {
    return '#6750A4'
  }

  return rgbToHex(
    Math.round(dominant.red / dominant.weight),
    Math.round(dominant.green / dominant.weight),
    Math.round(dominant.blue / dominant.weight),
  )
}

export function createThemeGeneratorExport(input: ThemeGeneratorExportInput): ThemeGeneratorExportResult {
  return {
    cssText: createAdminThemeCssText(input.theme),
    jsonText: JSON.stringify({
      sourceColor: input.sourceColor,
      themeBase: input.themeBase,
      themeMode: input.themeMode,
      cssVariables: input.theme.cssVariables,
      adminTokens: input.theme.adminTokens,
    }, null, 2),
  }
}

export function createSourceColorAdminTheme(input: SourceColorAdminThemeInput): ResolvedAdminTheme {
  const family = input.themeBase.startsWith('md2') ? 'md2' : 'md3'
  const resolvedBase = `${family}${input.themeMode === 'dark' ? 'Dark' : 'Light'}` as AdminThemeBase
  const generatedThemes = generateMaterialAdminThemes(input.sourceColor)
  const generatedTheme = input.themeMode === 'dark' ? generatedThemes.dark : generatedThemes.light

  return createAdminTheme({
    base: resolvedBase,
    varletTheme: pickThemeColorVariables(generatedTheme.varletTheme),
  })
}

function pickThemeColorVariables(theme: Record<string, string>): Record<string, string> {
  const colorVariableNames = new Set([
    '--color-primary',
    '--color-on-primary',
    '--color-primary-container',
    '--color-on-primary-container',
    '--color-info',
    '--color-on-info',
    '--color-info-container',
    '--color-on-info-container',
    '--color-success',
    '--color-on-success',
    '--color-success-container',
    '--color-on-success-container',
    '--color-danger',
    '--color-on-danger',
    '--color-danger-container',
    '--color-on-danger-container',
  ])

  return Object.fromEntries(
    Object.entries(theme).filter(([name]) => colorVariableNames.has(name)),
  )
}

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue].map((value) => clampColor(value).toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

function clampColor(value: number): number {
  return Math.max(0, Math.min(255, value))
}
