import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AdminLayout } from '../../src/index'
import { globalStubs, layoutProps, mockViewport, resetLayoutTestDom } from './admin-layout-test-utils'

afterEach(resetLayoutTestDom)
afterEach(() => {
  vi.useRealTimers()
})

describe('AdminLayout settings drawer', () => {
  it('opens settings drawer and emits setting changes', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')
    expect(wrapper.find('.va-admin-settings-drawer--open').text()).toContain('布局模式')
    expect(wrapper.find('.va-admin-settings-drawer--open').text()).toContain('个性设置')

    await wrapper.find('[data-testid="admin-layout-mode-segments"]').trigger('click')
    expect(wrapper.emitted('update:mode')?.at(-1)).toEqual(['top'])
  })

  it('keeps the settings drawer visible behind the theme generator', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')
    expect(wrapper.find('.va-admin-settings-drawer--open').exists()).toBe(true)

    await wrapper.find('[data-testid="admin-open-theme-generator"]').trigger('click')

    expect(wrapper.emitted('openThemeGenerator')).toHaveLength(1)
    expect(wrapper.find('.va-admin-settings-drawer--open').exists()).toBe(true)
  })

  it('builds settings drawer controls with Varlet primitives', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')

    expect(wrapper.find('[data-testid="admin-settings-popup"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-settings-popup"]').attributes('data-default-style')).toBe('false')
    expect(wrapper.find('[data-testid="admin-layout-mode-segments"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-scrollbar-segments"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-theme-base-segments"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-theme-mode-segments"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-layout-mode-segments"]').attributes('aria-label')).toBe('布局模式')
    expect(wrapper.find('[data-testid="admin-scrollbar-segments"]').attributes('aria-label')).toBe('滚动条模式')
    expect(wrapper.find('[data-testid="admin-theme-base-segments"]').attributes('aria-label')).toBe('主题风格')
    expect(wrapper.find('[data-testid="admin-theme-mode-segments"]').attributes('aria-label')).toBe('主题模式')
    expect(wrapper.find('.va-admin-settings-drawer--open').text()).toContain('显示')
    expect(wrapper.find('.va-admin-settings-drawer--open').text()).toContain('滚动条显示')
    expect(wrapper.find('.va-admin-settings-drawer--open').text()).toContain('展开宽度')
    expect(wrapper.find('.va-admin-settings-drawer--open').text()).not.toContain('导航')
    expect(wrapper.findAll('.va-admin-settings-drawer__section h3').map(item => item.text())).toEqual([
      '布局模式',
      '显示',
      '主题',
    ])
    expect(wrapper.find('[data-testid="admin-layout-mode-segments"]').attributes('data-checkmark')).toBe('false')
    expect(wrapper.find('[data-testid="admin-scrollbar-segments"]').attributes('data-checkmark')).toBe('false')
    expect(wrapper.find('[data-testid="admin-theme-base-segments"]').attributes('data-checkmark')).toBe('false')
    expect(wrapper.find('[data-testid="admin-theme-mode-segments"]').attributes('data-checkmark')).toBe('false')
    expect(wrapper.find('[data-testid="admin-settings-theme-colors"]').text()).toContain('MD3 紫')
    expect(wrapper.find('[data-testid="admin-settings-theme-colors"]').text()).toContain('#10B981')
    expect(wrapper.find('[data-testid="admin-open-theme-generator"]').attributes('data-text')).toBe('true')
    expect(wrapper.find('[data-testid="admin-open-theme-generator"]').attributes('data-outline')).toBe('true')
    expect(wrapper.find('[data-testid="admin-open-theme-generator"]').attributes('data-button-type')).toBe('primary')
    expect(wrapper.find('[data-testid="admin-scrollbar-segments"]').text()).toContain('始终显示')
    expect(wrapper.find('[data-testid="admin-scrollbar-segments"]').text()).toContain('悬停显示')
    expect(wrapper.find('[data-testid="admin-scrollbar-segments"]').text()).toContain('系统默认')
    expect(wrapper.findAll('[data-testid="admin-settings-slider"]')).toHaveLength(1)
    expect(wrapper.findAll('[data-testid="admin-settings-switch"]')).toHaveLength(1)
    expect(wrapper.findAll('[data-testid="admin-settings-slider"]').map(slider => slider.attributes('aria-label'))).toEqual([
      '展开宽度',
    ])
    expect(wrapper.find('[data-testid="admin-settings-slider"]').classes()).toContain('va-admin-settings-drawer__slider')
    expect(wrapper.find('[data-testid="admin-settings-slider"]').attributes('data-step')).toBe('5')
    expect(wrapper.find('.va-admin-settings-drawer__slider-thumb').text()).toBe('272')
    expect(wrapper.find('[data-testid="admin-sidebar-width-field"]').element.tagName).not.toBe('LABEL')
    expect(wrapper.find('[data-testid="admin-sidebar-width-field"]').text()).not.toContain('272px')
    expect(wrapper.findAll('[data-testid="admin-settings-switch"]').map(item => item.attributes('aria-label'))).toEqual([
      '标签栏',
    ])
    expect(wrapper.find('.va-admin-settings-drawer--open').text()).not.toContain('收缩宽度')
    expect(wrapper.find('.va-admin-settings-drawer--open').text()).not.toContain('收缩图标')
    expect(wrapper.find('.va-admin-settings-drawer--open').text()).not.toContain('父级背景')
    expect(wrapper.find('.va-admin-settings-drawer--open').text()).not.toContain('菜单搜索')

    await wrapper.find('[data-testid="admin-layout-mode-segments"]').trigger('click')
    expect(wrapper.emitted('update:mode')?.at(-1)).toEqual(['top'])

    await wrapper.find('[aria-label="选择自定义青绿"]').trigger('click')
    expect(wrapper.emitted('update:sourceColor')?.at(-1)).toEqual(['#10B981'])
  })

  it('keeps settings drawer as a square native drawer surface', () => {
    const source = readFileSync(
      resolve(__dirname, '../../src/layout/components/AdminSettingsDrawer.vue'),
      'utf8',
    )

    expect(source).toContain(':default-style="false"')
    expect(source).not.toContain('border-radius: var(--card-border-radius) 0 0 var(--card-border-radius)')
    expect(source).not.toContain('border-radius: var(--card-border-radius) 0 0 0')
  })

  it('centers the custom sidebar width slider thumb on the Varlet slider position', () => {
    const source = readFileSync(
      resolve(__dirname, '../../src/layout/components/AdminSettingsDrawerContent.vue'),
      'utf8',
    )

    expect(source).toContain('width: 32px;')
    expect(source).toContain('margin: 0 -16px;')
    expect(source).not.toContain('min-width: 32px;')
  })

  it('keeps theme color chips dense while centering swatches and showing custom hex labels', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        customColors: [
          { color: '#B141C8', label: '自定义 #B141C8', removable: true },
        ],
      }),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')

    expect(wrapper.find('[data-testid="admin-settings-theme-colors"]').text()).toContain('#B141C8')
    expect(wrapper.find('.va-admin-settings-drawer__theme-color-label--custom').exists()).toBe(true)
    expect(wrapper.find('.va-admin-settings-drawer__theme-color-label--custom').text()).toBe('#B141C8')

    const source = readFileSync(
      resolve(__dirname, '../../src/layout/components/AdminSettingsDrawerContent.vue'),
      'utf8',
    )

    expect(source).toContain('grid-template-columns: repeat(6, minmax(0, 1fr));')
    expect(source).toContain('justify-items: center;')
    expect(source).toContain('min-height: 48px;')
    expect(source).toContain('grid-template-rows: 20px minmax(14px, auto);')
    expect(source).toContain('font-size: 9px;')
    expect(source).toContain('letter-spacing: 0;')
    expect(source).toContain('class="va-admin-settings-drawer__section va-admin-settings-drawer__section--theme"')
    expect(source).toContain('.va-admin-settings-drawer__section.va-admin-settings-drawer__section--theme {')
    expect(source).toContain('border-bottom: 0;')
    expect(source).toContain('data-testid="admin-open-theme-generator"')
    expect(source).toContain('outline')
    expect(source).toContain('type="primary"')
  })

  it('uses larger icons for icon-only settings actions', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })

    expect(wrapper.find('[data-testid="admin-settings-button"] .va-icon').attributes('data-admin-icon-size')).toBe('22')

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')

    expect(wrapper.find('[aria-label="关闭设置"] .va-icon').attributes('data-admin-icon-size')).toBe('22')
  })

  it('requests layout recalculation after opening so the sidebar width slider can measure itself', async () => {
    vi.useFakeTimers()
    mockViewport(false)
    const dispatchEvent = vi.spyOn(window, 'dispatchEvent')

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')
    await wrapper.vm.$nextTick()
    vi.advanceTimersByTime(250)

    expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'resize' }))
  })

  it('updates the sidebar width slider thumb while dragging', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-settings-button"]').trigger('click')
    await wrapper.find('[data-testid="admin-settings-slider"] input').setValue(300)

    expect(wrapper.find('.va-admin-settings-drawer__slider-thumb').text()).toBe('300')
    expect(wrapper.emitted('update:sidebarWidth')?.at(-1)).toEqual([300])
  })
})

