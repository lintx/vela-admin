import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { resolveTopMenuOverflow } from '../../src/layout/components/top-menu-overflow'

describe('resolveTopMenuOverflow', () => {
  const menuWidths = [
    { path: '/', width: 72 },
    { path: '/system', width: 96 },
    { path: '/demo', width: 96 },
    { path: '/permission', width: 96 },
    { path: '/exception', width: 88 },
  ]

  it('keeps every top menu visible when the container has enough width', () => {
    const result = resolveTopMenuOverflow({
      menuWidths,
      availableWidth: 520,
      overflowWidth: 72,
      activePath: '/exception',
    })

    expect(result.visiblePaths).toEqual(['/', '/system', '/demo', '/permission', '/exception'])
    expect(result.overflowPaths).toEqual([])
    expect(result.overflowActive).toBe(false)
  })

  it('moves trailing top menus into overflow when width is constrained', () => {
    const result = resolveTopMenuOverflow({
      menuWidths,
      availableWidth: 360,
      overflowWidth: 72,
      activePath: '/system',
    })

    expect(result.visiblePaths).toEqual(['/', '/system', '/demo'])
    expect(result.overflowPaths).toEqual(['/permission', '/exception'])
    expect(result.overflowActive).toBe(false)
  })

  it('keeps the active top menu visible when it can fit in the constrained width', () => {
    const result = resolveTopMenuOverflow({
      menuWidths,
      availableWidth: 360,
      overflowWidth: 72,
      activePath: '/exception',
    })

    expect(result.visiblePaths).toEqual(['/', '/system', '/exception'])
    expect(result.overflowPaths).toEqual(['/demo', '/permission'])
    expect(result.overflowActive).toBe(false)
  })

  it('marks overflow active when the active top menu cannot fit in the constrained width', () => {
    const result = resolveTopMenuOverflow({
      menuWidths,
      availableWidth: 140,
      overflowWidth: 72,
      activePath: '/exception',
    })

    expect(result.visiblePaths).toEqual([])
    expect(result.overflowPaths).toEqual(['/', '/system', '/demo', '/permission', '/exception'])
    expect(result.overflowActive).toBe(true)
  })
})

describe('top menu overflow layout styles', () => {
  const source = readFileSync(resolve(__dirname, '../../src/layout/components/AdminTopMenu.vue'), 'utf8')
  const headerSource = readFileSync(resolve(__dirname, '../../src/layout/components/AdminHeader.vue'), 'utf8')

  it('lets the header main area shrink before navigation content overflows', () => {
    const headerStyle = headerSource.match(/\.va-admin-header\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? ''
    const mainStyle = headerSource.match(/\.va-admin-header__main\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? ''

    expect(headerStyle).toContain('width: 100%;')
    expect(headerStyle).toContain('min-width: 0;')
    expect(mainStyle).toContain('flex: 1 1 0;')
  })

  it('lets the top menu root shrink inside the header before content overflows', () => {
    const rootStyle = source.match(/\.va-admin-top-menu\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? ''

    expect(rootStyle).toContain('flex: 1 1 0;')
  })

  it('keeps tabs shrink-wrapped so the more entry follows visible top menus', () => {
    const tabsStyle = source.match(/\.va-admin-top-menu__tabs\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? ''

    expect(tabsStyle).toContain('flex: 0 1 auto;')
    expect(tabsStyle).toContain('width: auto;')
    expect(tabsStyle).toContain('padding-right: 0;')
    expect(tabsStyle).not.toMatch(/(^|\n)\s*width:\s*100%;/)
  })

  it('aligns the more trigger with regular top menu tabs', () => {
    const moreStyle = source.match(/\.va-admin-top-menu__more\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? ''
    const moreActiveStyle = source.match(/\.va-admin-top-menu__more--active\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? ''
    const moreActiveIndicatorStyle = source.match(/\.va-admin-top-menu__more--active::after\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? ''

    expect(moreStyle).toContain('box-sizing: border-box;')
    expect(moreStyle).toContain('font-family: inherit;')
    expect(moreStyle).toContain('font-size: 14px;')
    expect(moreStyle).not.toContain('font: inherit;')
    expect(moreStyle).not.toContain('line-height: 1;')
    expect(moreActiveStyle).not.toContain('border-bottom-color: var(--va-admin-menu-indicator);')
    expect(moreActiveIndicatorStyle).toContain('background: var(--va-admin-menu-indicator);')
  })

  it('draws top menu indicators on active items instead of the Varlet tabs indicator', () => {
    const tabsIndicatorStyle = source.match(/\.va-admin-top-menu__tabs\s+:deep\(\.var-tabs__indicator\)\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? ''
    const itemStyle = source.match(/\.va-admin-top-menu__item\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? ''
    const activeItemIndicatorStyle = source.match(/\.va-admin-top-menu__item--active::after\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? ''

    expect(tabsIndicatorStyle).toContain('display: none;')
    expect(itemStyle).toContain('position: relative;')
    expect(activeItemIndicatorStyle).toContain('position: absolute;')
    expect(activeItemIndicatorStyle).toContain('background: var(--va-admin-menu-indicator);')
    expect(source).not.toContain("va-admin-top-menu__tabs--more-active")
  })
})
