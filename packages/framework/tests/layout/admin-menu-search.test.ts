import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import { AdminLayout } from '../../src/index'
import { globalStubs, layoutProps, mockViewport, resetLayoutTestDom } from './admin-layout-test-utils'

afterEach(resetLayoutTestDom)

describe('AdminLayout menu search', () => {
  it('opens menu search and lists matching visible menus', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-menu-search-button"]').trigger('click')
    await wrapper.find('[data-testid="admin-menu-search-input"]').setValue('用户')

    expect(wrapper.find('.va-admin-menu-search__results').text()).toContain('用户管理')
    expect(wrapper.find('.va-admin-menu-search__overlay').exists()).toBe(true)
    expect(wrapper.find('.va-admin-menu-search__result-path').exists()).toBe(false)
    expect(wrapper.find('.va-admin-menu-search__result-trail').exists()).toBe(true)
    expect(wrapper.find('.va-admin-menu-search__result .va-admin-menu-search__enter').exists()).toBe(false)
    expect(wrapper.find('[data-testid="admin-menu-search-footer"]').text()).toContain('确认')
    expect(wrapper.find('[data-testid="admin-menu-search-footer"]').text()).toContain('切换')
    expect(wrapper.find('[data-testid="admin-menu-search-footer"]').text()).toContain('关闭')
    expect(wrapper.find('.va-admin-menu-search__results').text()).not.toContain('角色管理')
    expect(wrapper.find('[data-testid="admin-menu-search-shortcut"]').text()).toMatch(/Ctrl|⌘/)
  })

  it('keeps the desktop search trigger on one line before mobile layout takes over', () => {
    const source = readFileSync(resolve(__dirname, '../../src/layout/components/AdminMenuSearch.vue'), 'utf8')
    const contentStyle = source
      .match(/\.va-admin-menu-search__button\s+:deep\(\.var-button__content\)\s*\{(?<body>[\s\S]*?)\n\}/)
      ?.groups
      ?.body ?? ''

    expect(contentStyle).toContain('flex-wrap: nowrap;')
    expect(contentStyle).toContain('white-space: nowrap;')
    expect(source).toContain('@media (max-width: 960px)')
  })
})
