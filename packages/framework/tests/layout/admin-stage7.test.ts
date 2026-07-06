import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { AdminLayout } from '../../src/index'
import { globalStubs, layoutProps, mockViewport, resetLayoutTestDom } from './admin-layout-test-utils'

afterEach(resetLayoutTestDom)

describe('AdminLayout stage 7 navigation controls', () => {
  it.each(['side', 'top', 'mixed'] as const)('renders tags view in %s mode when enabled', (mode) => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({ mode }),
      global: globalStubs(),
    })

    expect(wrapper.find('.va-admin-tags-view').text()).toContain('控制台')
  })

  it('hides tags view when disabled by layout features', () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        layoutFeatures: {
          tagsView: false,
          menuSearch: true,
          settings: true,
        },
      }),
      global: globalStubs(),
    })

    expect(wrapper.find('.va-admin-tags-view').exists()).toBe(false)
  })

  it('renders menu search and settings entry when enabled', () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })

    expect(wrapper.find('[data-testid="admin-menu-search-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-menu-search-button"]').attributes('data-round')).toBe('false')
    expect(wrapper.find('[data-testid="admin-menu-search-button"]').attributes('data-text')).toBe('true')
    expect(wrapper.find('[data-testid="admin-menu-search-button"]').classes()).toContain('va-admin-menu-search__button')
    expect(wrapper.find('[data-testid="admin-settings-button"]').exists()).toBe(true)
  })

  it('moves mobile header tools into a top-right more menu with centered brand', async () => {
    mockViewport(true)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
      slots: {
        logoCollapsed: '<img class="test-mobile-logo" alt="Vela Admin" />',
      },
    })

    expect(wrapper.find('[data-testid="admin-sidebar-toggle"]').exists()).toBe(true)
    expect(wrapper.find('.va-admin-header__mobile-tools').exists()).toBe(false)
    expect(wrapper.find('.va-admin-header__mobile-brand .test-mobile-logo').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-header-more-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-menu-search-button"]').exists()).toBe(false)

    await wrapper.find('[data-testid="admin-header-more-button"]').trigger('click')

    expect(wrapper.find('.va-admin-header__mobile-menu [data-testid="admin-menu-search-button"]').exists()).toBe(true)
    expect(wrapper.find('.va-admin-header__mobile-menu [data-testid="admin-settings-button"]').exists()).toBe(true)
  })

  it('enables Varlet ripple on custom navigation and tag controls', () => {
    const sidebarItem = readFileSync(
      resolve(__dirname, '../../src/layout/components/AdminSidebarItem.vue'),
      'utf8',
    )
    const tagsView = readFileSync(
      resolve(__dirname, '../../src/layout/components/AdminTagsView.vue'),
      'utf8',
    )

    expect(sidebarItem).toContain('const vRipple = Ripple')
    expect(sidebarItem).toContain('v-ripple')
    expect(tagsView).toContain('const vRipple = Ripple')
    expect(tagsView.match(/v-ripple/g)).toHaveLength(5)
  })
})
