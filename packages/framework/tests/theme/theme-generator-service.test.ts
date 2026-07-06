import { describe, expect, it } from 'vitest'

import {
  createAdminTheme,
  createSourceColorAdminTheme,
  createThemeGeneratorExport,
  extractDominantColorFromImageData,
  validateThemeImageFile,
} from '../../src/index'

describe('theme generator service', () => {
  it('extracts a dominant hex color from image data', () => {
    const imageData = {
      data: new Uint8ClampedArray([
        103, 80, 164, 255,
        103, 80, 164, 255,
        255, 255, 255, 0,
        20, 18, 24, 255,
      ]),
    }

    expect(extractDominantColorFromImageData(imageData)).toBe('#6750A4')
  })

  it('reports unsupported image files before reading', () => {
    expect(validateThemeImageFile()).toBe('请选择图片文件')
    expect(validateThemeImageFile({ type: 'text/plain' })).toBe('只支持图片文件')
    expect(validateThemeImageFile({ type: 'image/png' })).toBeNull()
  })

  it('serializes generated themes for developer export', () => {
    const theme = createAdminTheme({ base: 'md3Light' })
    const result = createThemeGeneratorExport({
      sourceColor: '#6750A4',
      themeBase: 'md3Light',
      themeMode: 'light',
      theme,
    })

    expect(result.cssText).toContain('--color-primary:')
    expect(result.jsonText).toContain('"sourceColor": "#6750A4"')
    expect(result.jsonText).toContain('"cssVariables"')
  })

  it('creates MD2 themes from the selected source color', () => {
    const theme = createSourceColorAdminTheme({
      sourceColor: '#10B981',
      themeBase: 'md2Light',
      themeMode: 'light',
    })

    expect(theme.base).toBe('md2Light')
    expect(theme.cssVariables['--color-primary']).toBeTypeOf('string')
    expect(theme.cssVariables['--button-border-radius']).toBe('4px')
    expect(theme.cssVariables['--button-primary-color']).toBe('var(--color-primary)')
    expect(theme.cssVariables['--button-primary-text-color']).toBe('var(--color-on-primary)')
    expect(theme.cssVariables['--color-primary']).not.toBe(createAdminTheme({ base: 'md2Light' }).cssVariables['--color-primary'])
    expect(theme.cssVariables['--color-body']).toBe('hsla(var(--hsl-body), 1)')
    expect(theme.cssVariables['--color-surface-container']).toBe('hsla(var(--hsl-surface-container), 1)')
    expect(theme.cssVariables['--card-background']).toBe('var(--color-surface-container-highest)')
  })

  it('keeps generated MD3 source colors from tinting app surfaces', () => {
    const theme = createSourceColorAdminTheme({
      sourceColor: '#DC2626',
      themeBase: 'md3Light',
      themeMode: 'light',
    })

    expect(theme.base).toBe('md3Light')
    expect(theme.cssVariables['--color-primary']).toBeTypeOf('string')
    expect(theme.cssVariables['--color-body']).toBe(createAdminTheme({ base: 'md3Light' }).cssVariables['--color-body'])
    expect(theme.cssVariables['--color-surface-container']).toBe(createAdminTheme({ base: 'md3Light' }).cssVariables['--color-surface-container'])
    expect(theme.cssVariables['--card-background']).toBe(createAdminTheme({ base: 'md3Light' }).cssVariables['--card-background'])
  })
})
