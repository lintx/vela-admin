import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AdminLayout } from '../../src/index'
import {
  globalStubs,
  layoutProps,
  mockViewport,
  resetLayoutTestDom,
} from './admin-layout-test-utils'

afterEach(resetLayoutTestDom)

describe('AdminLayout tags view actions', () => {
  it('opens tab context menu and emits tab operations', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({ currentPath: '/system/user' }),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-tag-/system/user"]').trigger('contextmenu', { clientX: 420, clientY: 72 })

    expect(wrapper.find('[data-testid="admin-tag-context-menu"]').attributes('style')).toContain('left: 420px')
    expect(wrapper.find('[data-testid="admin-tag-context-menu"]').attributes('style')).toContain('top: 72px')
    expect(wrapper.find('[data-testid="admin-tag-context-menu"]').text()).toContain('关闭其他')
    expect(wrapper.findAll('[data-testid="admin-tag-menu-divider"]')).toHaveLength(2)
    expect(wrapper.findAll('[data-testid="admin-tag-menu-divider"]').some(item => item.element.tagName === 'BUTTON')).toBe(false)
    expect(wrapper.find('[data-testid="admin-tag-menu-refresh"]').classes()).toContain('va-admin-tags-view__menu-option')

    await wrapper.find('[data-testid="admin-tag-menu-close-others"]').trigger('click')
    expect(wrapper.emitted('closeOtherTabs')?.at(-1)).toEqual(['/system/user'])
  })

  it('uses a custom context menu divider instead of selectable placeholder options', () => {
    const source = readFileSync(resolve(__dirname, '../../src/layout/components/AdminTagsView.vue'), 'utf8')
    const contextMenuSource = readFileSync(resolve(__dirname, '../../src/components/context-menu/VaContextMenu.vue'), 'utf8')

    expect(source).not.toContain('{ divider: true }')
    expect(source).toContain('divider-test-id="admin-tag-menu-divider"')
    expect(source).toContain('<VaContextMenu')
    expect(contextMenuSource).toContain('role="separator"')
  })

  it('renders a visible close control for closable tabs only', () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({ currentPath: '/system/user' }),
      global: globalStubs(),
    })

    expect(wrapper.find('[aria-label="关闭控制台"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="关闭用户管理"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="关闭用户管理"] .va-icon').attributes('data-admin-icon')).toBe('close')
  })

  it('hides pin affordance and direct close action for force non-closable tabs', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        currentPath: '/',
        tags: [
          { path: '/', title: '控制台', fixed: true, closable: false },
          { path: '/system/user', title: '用户管理' },
        ],
      }),
      global: globalStubs(),
    })

    expect(wrapper.find('[data-testid="admin-tag-/"] .va-admin-tags-view__pin').exists()).toBe(false)

    await wrapper.find('[data-testid="admin-tag-/"]').trigger('contextmenu', { clientX: 420, clientY: 72 })

    expect(wrapper.find('[data-testid="admin-tag-context-menu"]').text()).not.toContain('取消固定')
    expect(wrapper.find('[data-testid="admin-tag-context-menu"]').text()).not.toContain('固定')
    expect(wrapper.find('[data-testid="admin-tag-menu-pin"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="admin-tag-menu-close"]').exists()).toBe(false)
    expect(
      wrapper
        .find('[data-testid="admin-tag-context-menu"]')
        .findAll('[data-testid^="admin-tag-menu-"]')
        .map(item => item.attributes('data-testid')),
    ).toEqual([
      'admin-tag-menu-refresh',
      'admin-tag-menu-maximize',
      'admin-tag-menu-divider',
      'admin-tag-menu-close-left',
      'admin-tag-menu-close-right',
      'admin-tag-menu-close-others',
      'admin-tag-menu-divider',
      'admin-tag-menu-close-all',
    ])
  })

  it('closes closable tabs with middle mouse button', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({ currentPath: '/system/user' }),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-tag-/system/user"]').trigger('auxclick', { button: 1 })

    expect(wrapper.emitted('closeTab')?.at(-1)).toEqual(['/system/user'])
  })

  it('uses the whole tab item as the interactive navigation surface', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        currentPath: '/',
        tags: [
          { path: '/', title: '控制台', fixed: true, closable: false },
          { path: '/system/user', title: '用户管理' },
        ],
      }),
      global: globalStubs(),
    })
    const tabItem = wrapper
      .findAll('.va-admin-tags-view__item')
      .find(item => item.text().includes('用户管理'))

    await tabItem?.trigger('click')

    expect(wrapper.emitted('navigate')?.at(-1)).toEqual(['/system/user'])
  })

  it('opens the tab menu from a mobile tap and can switch to the tapped tab', async () => {
    mockViewport(true)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        currentPath: '/',
        tags: [
          { path: '/', title: '控制台', fixed: true, closable: false },
          { path: '/system/user', title: '用户管理' },
        ],
      }),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-tag-/system/user"]').trigger('click')

    const menu = wrapper.find('[data-testid="admin-tag-context-menu"]')
    expect(menu.exists()).toBe(true)
    expect(menu.text()).toContain('切换到此标签')
    expect(wrapper.emitted('navigate')).toBeUndefined()

    await wrapper.find('[data-testid="admin-tag-menu-navigate"]').trigger('click')

    expect(wrapper.emitted('navigate')?.at(-1)).toEqual(['/system/user'])
  })

  it('does not depend on long press for mobile tab menus', () => {
    const source = readFileSync(resolve(__dirname, '../../src/layout/components/AdminTagsView.vue'), 'utf8')

    expect(source).toContain('@pointerup="handleTabPointerUp($event, tab)"')
    expect(source).not.toContain('longpress')
    expect(source).not.toContain('touchstart')
  })

  it('uses arrow buttons for tab scrolling without exposing a scrollbar action strip', () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })

    expect(wrapper.find('[data-testid="admin-tags-scroll-left"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-tags-scroll-right"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-tags-scroll-left"] .va-icon').attributes('data-admin-icon-size')).toBe('22')
    expect(wrapper.find('[data-testid="admin-tags-scroll-right"] .va-icon').attributes('data-admin-icon-size')).toBe('22')
    expect(wrapper.find('.va-admin-tags-view__actions').exists()).toBe(false)
  })

  it('marks the last visible tab edge when scrolled to the end', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })
    const list = wrapper.find('.va-admin-tags-view__list').element as HTMLElement

    Object.defineProperties(list, {
      scrollLeft: { value: 120, configurable: true },
      clientWidth: { value: 200, configurable: true },
      scrollWidth: { value: 320, configurable: true },
    })
    list.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.va-admin-tags-view').classes()).toContain('va-admin-tags-view--scroll-end')
  })

  it('keeps the last tab border when tabs do not overflow', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })
    const list = wrapper.find('.va-admin-tags-view__list').element as HTMLElement

    Object.defineProperties(list, {
      scrollLeft: { value: 0, configurable: true },
      clientWidth: { value: 320, configurable: true },
      scrollWidth: { value: 320, configurable: true },
    })
    list.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.va-admin-tags-view').classes()).not.toContain('va-admin-tags-view--scroll-end')
  })

  it('scrolls the active tab into view after the current path changes', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        currentPath: '/',
        tags: [
          { path: '/', title: '控制台', fixed: true },
          { path: '/one', title: '标签一' },
          { path: '/two', title: '标签二' },
        ],
      }),
      global: globalStubs(),
    })
    const activeElement = wrapper.find('[data-testid="admin-tag-/two"]').element as HTMLElement
    const activeItem = activeElement.closest('.va-admin-tags-view__item') as HTMLElement & {
      scrollIntoView: () => void
    }
    const activeLinkScroll = vi.fn()
    activeElement.scrollIntoView = activeLinkScroll
    activeItem.scrollIntoView = vi.fn()

    await wrapper.setProps({ currentPath: '/two' })
    await wrapper.vm.$nextTick()

    expect(activeItem.scrollIntoView).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth',
    })
    expect(activeLinkScroll).not.toHaveBeenCalled()
  })

  it('keeps mobile tags, scroll controls, and maximize action on one row', () => {
    const source = readFileSync(resolve(__dirname, '../../src/layout/components/AdminTagsView.vue'), 'utf8')

    expect(source).toContain('grid-template-columns: auto minmax(0, 1fr) auto auto;')
    expect(source).not.toContain('grid-template-columns: auto minmax(0, 1fr) auto;')
  })
})
