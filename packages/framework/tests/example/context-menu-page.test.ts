import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import contextMenuMeta from '../../../../examples/admin/src/pages/context-menu.meta.js'

describe('example context menu page', () => {
  it('defines a top-level menu entry for context menu usage', () => {
    expect(contextMenuMeta).toMatchObject({
      title: '上下文菜单',
      icon: 'menu-2',
      order: 36,
    })
  })

  it('covers data, template, trigger, icon and custom item examples', () => {
    const source = readFileSync(
      resolve(__dirname, '../../../../examples/admin/src/pages/context-menu.vue'),
      'utf8',
    )

    expect(source).toContain(':groups="dataGroups"')
    expect(source).toContain('<VaContextMenuGroup>')
    expect(source).toContain('trigger="both"')
    expect(source).toContain('定位配置')
    expect(source).toContain('placementValue')
    expect(source).toContain(':placement="placementValue"')
    expect(source).toContain("value: 'target-center'")
    expect(source).toContain("value: 'target-bottom'")
    expect(source).toContain("value: 'cursor'")
    expect(source).toContain(':show-icon="false"')
    expect(source).toContain('<template #item="{ item }">')
    expect(source).toContain('children:')
    expect(source).toContain('disabled: true')
    expect(source).toContain('danger: true')
    expect(source).toContain('shortcut:')
    expect(source).toContain('<details class="admin-context-menu__source">')
    expect(source).toContain('{{ dataCode }}')
    expect(source).toContain('.admin-context-menu__source pre')
    expect(source).toContain('max-width: 100%')
    expect(source).toContain('min-width: max-content')
    expect(source).not.toContain('最近操作')
  })
})
