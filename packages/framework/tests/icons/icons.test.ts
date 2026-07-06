import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import {
  VaIcon,
  defaultAdminConfig,
  getAdminSemanticIconEntries,
  resolveAdminIcon,
} from '../../src/index'

describe('admin icons', () => {
  it('uses Phosphor regular icons by default and Tabler as fallback', () => {
    expect(defaultAdminConfig.icons).toEqual({
      defaultLibrary: 'phosphor',
      fallbackLibrary: 'tabler',
      phosphor: {
        weight: 'regular',
      },
    })
  })

  it('resolves semantic icons to the default Phosphor library', () => {
    expect(resolveAdminIcon('dashboard')).toMatchObject({
      library: 'phosphor',
      name: 'chart-pie-slice',
      componentName: 'PhChartPieSlice',
    })
  })

  it('resolves explicit Tabler icon references', () => {
    expect(resolveAdminIcon('tabler:database')).toMatchObject({
      library: 'tabler',
      name: 'database',
      componentName: 'IconDatabase',
    })
  })

  it('uses text indent icons for sidebar toggle actions', () => {
    expect(resolveAdminIcon('menu')).toMatchObject({
      library: 'phosphor',
      name: 'text-indent',
      componentName: 'PhTextIndent',
    })
    expect(resolveAdminIcon('menu-open')).toMatchObject({
      library: 'phosphor',
      name: 'text-outdent',
      componentName: 'PhTextOutdent',
    })
  })

  it('falls back to question icon and warns for unknown icon in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(resolveAdminIcon('missing-icon')).toMatchObject({
      library: 'phosphor',
      name: 'question',
      componentName: 'PhQuestion',
    })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Unknown admin icon "missing-icon"'))

    warn.mockRestore()
  })

  it('renders a semantic icon through VaIcon', () => {
    const wrapper = mount(VaIcon, {
      props: {
        name: 'dashboard',
      },
    })

    expect(wrapper.find('[data-admin-icon="dashboard"]').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'PhChartPieSlice' }).exists()).toBe(true)
  })

  it('uses the requested size as the rendered svg box size', () => {
    const wrapper = mount(VaIcon, {
      props: {
        name: 'menu',
        size: 22,
      },
    })

    const style = wrapper.find('[data-admin-icon="menu"]').attributes('style')

    expect(style).toContain('--va-icon-size: 22px')
    expect(style).toContain('width: 22px')
    expect(style).toContain('height: 22px')
  })

  it('exports semantic icon entries for the icon usage page', () => {
    expect(getAdminSemanticIconEntries()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'dashboard',
          label: '控制台',
          usage: expect.stringContaining('菜单'),
        }),
        expect.objectContaining({
          name: 'icons',
          label: '图标',
          usage: expect.stringContaining('图标'),
        }),
      ]),
    )
  })
})
