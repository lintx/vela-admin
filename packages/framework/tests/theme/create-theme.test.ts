import { describe, expect, it, vi } from 'vitest'

import {
  applyAdminTheme,
  createAdminTheme,
  createAdminThemeCssText,
  defaultAdminTokens,
  generateMaterialAdminThemes,
} from '../../src/index'

describe('createAdminTheme', () => {
  it('uses MD3 light as the default base theme and exposes admin CSS variables', () => {
    const theme = createAdminTheme()

    expect(theme.base).toBe('md3Light')
    expect(theme.varletTheme['--color-primary']).toBeTypeOf('string')
    expect(theme.adminTokens.sidebarWidth).toBe(272)
    expect(theme.cssVariables['--va-admin-sidebar-width']).toBe('272px')
    expect(theme.cssVariables['--va-admin-menu-active-bg']).toContain('11%')
    expect(theme.cssVariables['--va-admin-panel-bg']).toContain('--card-background')
    expect(theme.cssVariables['--va-admin-panel-radius']).toContain('--card-border-radius')
  })

  it('merges admin token overrides without mutating defaults', () => {
    const theme = createAdminTheme({
      base: 'md3Dark',
      adminTokens: {
        sidebarWidth: 300,
        sidebarCollapsedIconSize: 28,
        scrollbar: 'native',
      },
    })

    expect(theme.base).toBe('md3Dark')
    expect(theme.adminTokens.sidebarWidth).toBe(300)
    expect(theme.adminTokens.sidebarCollapsedIconSize).toBe(28)
    expect(theme.adminTokens.scrollbar).toBe('native')
    expect(defaultAdminTokens.sidebarWidth).toBe(272)
  })

  it('serializes theme variables to CSS text', () => {
    const theme = createAdminTheme({ adminTokens: { sidebarWidth: 288 } })
    const cssText = createAdminThemeCssText(theme)

    expect(cssText).toContain(':root')
    expect(cssText).toContain('--va-admin-sidebar-width: 288px;')
    expect(cssText).toContain('--color-primary:')
  })

  it('clears stale Varlet variables when switching back to the MD2 light base', () => {
    document.head.querySelector('#varlet-style-vars')?.remove()
    const variables = new Map<string, string>()
    const target = {
      style: {
        setProperty: vi.fn((name: string, value: string) => variables.set(name, value)),
        removeProperty: vi.fn((name: string) => variables.delete(name)),
      },
    }

    applyAdminTheme(createAdminTheme({ base: 'md3Light' }), target)
    expect(document.head.querySelector('#varlet-style-vars')).toBeTruthy()
    expect(variables.has('--color-primary')).toBe(true)

    applyAdminTheme(createAdminTheme({ base: 'md2Light' }), target)

    expect(document.head.querySelector('#varlet-style-vars')).toBeNull()
    expect(target.style.removeProperty).toHaveBeenCalledWith('--color-primary')
    expect(variables.has('--color-primary')).toBe(false)
    expect(variables.get('--va-admin-sidebar-width')).toBe('272px')
  })

  it('clears stale HSL variables when applying the MD2 light base to an existing document style', () => {
    const target = document.createElement('div')

    target.style.setProperty('--hsl-body', '293, 100%, 98%')
    target.style.setProperty('--hsl-on-surface-variant', '270, 11%, 79%')

    applyAdminTheme(createAdminTheme({ base: 'md2Light' }), target)

    expect(target.style.getPropertyValue('--hsl-body')).toBe('')
    expect(target.style.getPropertyValue('--hsl-on-surface-variant')).toBe('')
  })

  it('marks element targets with the current material design family class', () => {
    const target = document.createElement('div')

    applyAdminTheme(createAdminTheme({ base: 'md3Light' }), target)
    expect(target.classList.contains('varlet-admin-theme-md3')).toBe(true)
    expect(target.classList.contains('varlet-admin-theme-md2')).toBe(false)

    applyAdminTheme(createAdminTheme({ base: 'md2Light' }), target)
    expect(target.classList.contains('varlet-admin-theme-md2')).toBe(true)
    expect(target.classList.contains('varlet-admin-theme-md3')).toBe(false)
  })

  it('exposes MD2 light shape variables for scoped previews', () => {
    const theme = createAdminTheme({ base: 'md2Light' })

    expect(theme.cssVariables['--button-border-radius']).toBe('4px')
    expect(theme.cssVariables['--card-border-radius']).toBe('4px')
  })

  it('exposes MD2 light surface variables for scoped previews', () => {
    const theme = createAdminTheme({ base: 'md2Light' })

    expect(theme.cssVariables['--color-body']).toBeTypeOf('string')
    expect(theme.cssVariables['--color-surface-container']).toBeTypeOf('string')
    expect(theme.cssVariables['--color-surface-container-high']).toBeTypeOf('string')
    expect(theme.cssVariables['--card-background']).toBeTypeOf('string')
    expect(theme.cssVariables['--va-admin-sidebar-bg']).toContain('--color-surface-container-high')
  })
})

describe('generateMaterialAdminThemes', () => {
  it('generates light and dark themes from a source color', () => {
    const result = generateMaterialAdminThemes('#6750A4')

    expect(result.sourceColor).toBe('#6750A4')
    expect(result.light.base).toBe('md3Light')
    expect(result.dark.base).toBe('md3Dark')
    expect(result.light.varletTheme['--color-primary']).toBeTypeOf('string')
    expect(result.dark.varletTheme['--color-primary']).toBeTypeOf('string')
    expect(result.light.cssVariables['--va-admin-menu-indicator']).toBe('var(--color-primary)')
  })
})
