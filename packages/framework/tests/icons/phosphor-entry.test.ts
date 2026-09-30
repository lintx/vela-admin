import { describe, expect, it } from 'vitest'

import {
  phosphorOnlyAdminIconConfig,
  resolvePhosphorIcon,
} from '../../src/icons/phosphor-index'

/**
 * phosphor-only 入口不能静态引用 tabler 注册表，否则业务项目即使只用
 * Phosphor 也会把整个 Tabler 图标集打入生产包。
 *
 * 通过断言「模块图不含 tabler」与「解析结果始终落在 phosphor 库」
 * 双重保证这一隔离不被后续改动破坏。
 */
describe('phosphor-only icon entry', () => {
  it('keeps the fallback chain inside the phosphor library', () => {
    expect(phosphorOnlyAdminIconConfig.defaultLibrary).toBe('phosphor')
    expect(phosphorOnlyAdminIconConfig.fallbackLibrary).toBe('phosphor')
  })

  it('resolves semantic icons without touching the tabler registry', () => {
    expect(resolvePhosphorIcon('dashboard')).toMatchObject({
      library: 'phosphor',
      name: 'chart-pie-slice',
      componentName: 'PhChartPieSlice',
      fallback: false,
    })

    expect(resolvePhosphorIcon('menu')).toMatchObject({
      library: 'phosphor',
      name: 'text-indent',
      componentName: 'PhTextIndent',
    })
  })

  it('falls back to the phosphor question icon for unknown names', () => {
    expect(resolvePhosphorIcon('missing-icon')).toMatchObject({
      library: 'phosphor',
      name: 'question',
      componentName: 'PhQuestion',
      fallback: true,
    })
  })

  it('resolves raw phosphor names that are not semantic entries', () => {
    expect(resolvePhosphorIcon('users')).toMatchObject({
      library: 'phosphor',
      name: 'users',
      componentName: 'PhUsers',
      fallback: false,
    })
  })
})
