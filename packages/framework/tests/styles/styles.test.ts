import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('framework styles', () => {
  it('exports admin layout tokens as CSS variables', () => {
    const css = readFileSync(resolve(__dirname, '../../styles/tokens.css'), 'utf8')

    expect(css).toContain('--va-admin-sidebar-width: 272px;')
    expect(css).toContain('--va-admin-sidebar-collapsed-width: 56px;')
    expect(css).toContain('--va-admin-menu-active-bg')
    expect(css).toContain('--va-admin-scrollbar-width: 8px;')
  })

  it('provides a single style entry that imports tokens and base layout rules', () => {
    const css = readFileSync(resolve(__dirname, '../../styles/index.css'), 'utf8')

    expect(css).toContain("@import './tokens.css';")
    expect(css).toContain('.va-admin-scrollbar')
    expect(css).toContain('scrollbar-width: thin;')
    expect(css).toContain('.va-admin-layout--scrollbar-hover .va-admin-scrollbar')
    expect(css).toContain('.va-admin-layout--scrollbar-native .va-admin-scrollbar')
  })
})
