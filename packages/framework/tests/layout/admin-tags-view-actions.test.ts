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

afterEach(() => {
  window.PointerEvent = originalPointerEvent
  resetLayoutTestDom()
})

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

  it('shows unpin affordance for user pinned tabs', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        currentPath: '/system/user',
        tags: [
          { path: '/', title: '控制台', fixed: true, closable: false },
          { path: '/system/user', title: '用户管理', fixed: true, closable: true },
        ],
      }),
      global: globalStubs(),
    })

    expect(wrapper.find('[data-testid="admin-tag-/system/user"] .va-admin-tags-view__pin').exists()).toBe(true)

    await wrapper.find('[data-testid="admin-tag-/system/user"]').trigger('contextmenu', { clientX: 420, clientY: 72 })

    const pin = wrapper.find('[data-testid="admin-tag-menu-pin"]')
    expect(pin.exists()).toBe(true)
    expect(pin.text()).toContain('取消固定')
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

  it('emits a tab reorder request after pointer dragging to another tab', async () => {
    mockViewport(false)
    installPointerEvent()

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        currentPath: '/system/user',
        tags: [
          { path: '/', title: '控制台', fixed: true },
          { path: '/system/user', title: '用户管理' },
          { path: '/system/role', title: '角色管理' },
        ],
      }),
      global: globalStubs(),
    })
    const sourceItem = wrapper
      .findAll('.va-admin-tags-view__item')
      .find(item => item.text().includes('用户管理'))
    const targetItem = wrapper
      .findAll('.va-admin-tags-view__item')
      .find(item => item.text().includes('角色管理'))
    const handle = sourceItem?.find('[data-testid="admin-tag-drag-/system/user"]')
    mockTagRects(wrapper, {
      '控制台': rect(0, 0),
      '用户管理': rect(100, 0),
      '角色管理': rect(200, 0),
    })

    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn().mockReturnValue(targetItem?.element ?? null),
    })

    handle?.element.dispatchEvent(pointerEvent('pointerdown', 110, 12))
    await wrapper.vm.$nextTick()
    window.dispatchEvent(pointerEvent('pointermove', 250, 12))
    await wrapper.vm.$nextTick()

    expect(sourceItem?.classes()).toContain('va-sortable__item--dragging')
    expect(sourceItem?.find('[data-testid="admin-tag-drag-/system/user"]').exists()).toBe(true)
    expect(sourceItem?.find('[aria-label="关闭用户管理"]').exists()).toBe(true)
    expect(wrapper.find('.va-sortable__placeholder').classes()).toContain('va-admin-tags-view__item')
    expect(wrapper.find('.va-sortable__placeholder').attributes('style')).not.toContain('outline')
    expect(wrapper.find('.va-sortable__placeholder').attributes('style')).not.toContain('background')
    expect(document.body.querySelector('.va-sortable__mirror')).toBeNull()

    window.dispatchEvent(pointerEvent('pointerup', 250, 12))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('reorderTab')?.at(-1)).toEqual(['/system/user', '/system/role'])

    delete (document as Document & { elementFromPoint?: Document['elementFromPoint'] }).elementFromPoint
  })

  it('does not preview a user pinned tab before force fixed tabs', async () => {
    mockViewport(false)
    installPointerEvent()

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        currentPath: '/system/user',
        tags: [
          { path: '/', title: '控制台', fixed: true, closable: false },
          { path: '/system/user', title: '用户管理', fixed: true, closable: true },
          { path: '/system/role', title: '角色管理' },
        ],
      }),
      global: globalStubs(),
    })
    const sourceItem = wrapper
      .findAll('.va-admin-tags-view__item')
      .find(item => item.text().includes('用户管理'))
    const targetItem = wrapper
      .findAll('.va-admin-tags-view__item')
      .find(item => item.text().includes('控制台'))
    const handle = sourceItem?.find('[data-testid="admin-tag-drag-/system/user"]')
    mockTagRects(wrapper, {
      '控制台': rect(0, 0),
      '用户管理': rect(100, 0),
      '角色管理': rect(200, 0),
    })

    let previewKeys: Array<string | undefined> = []
    try {
      Object.defineProperty(document, 'elementFromPoint', {
        configurable: true,
        value: vi.fn().mockReturnValue(targetItem?.element ?? null),
      })

      handle?.element.dispatchEvent(pointerEvent('pointerdown', 110, 12))
      await wrapper.vm.$nextTick()
      window.dispatchEvent(pointerEvent('pointermove', 10, 12))
      await wrapper.vm.$nextTick()

      previewKeys = wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-va-sortable-key'))

      window.dispatchEvent(pointerEvent('pointerup', 10, 12))
      await wrapper.vm.$nextTick()
    } finally {
      delete (document as Document & { elementFromPoint?: Document['elementFromPoint'] }).elementFromPoint
    }

    expect(previewKeys).toEqual([
      '/',
      '/system/user',
      '/system/role',
    ])
    expect(wrapper.emitted('reorderTab')).toBeUndefined()
  })

  it('does not preview a normal tab before user pinned tabs', async () => {
    mockViewport(false)
    installPointerEvent()

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        currentPath: '/system/role',
        tags: [
          { path: '/', title: '控制台', fixed: true, closable: false },
          { path: '/system/user', title: '用户管理', fixed: true, closable: true },
          { path: '/system/role', title: '角色管理' },
        ],
      }),
      global: globalStubs(),
    })
    const sourceItem = wrapper
      .findAll('.va-admin-tags-view__item')
      .find(item => item.text().includes('角色管理'))
    const targetItem = wrapper
      .findAll('.va-admin-tags-view__item')
      .find(item => item.text().includes('用户管理'))
    const handle = sourceItem?.find('[data-testid="admin-tag-drag-/system/role"]')
    mockTagRects(wrapper, {
      '控制台': rect(0, 0),
      '用户管理': rect(100, 0),
      '角色管理': rect(200, 0),
    })

    let previewKeys: Array<string | undefined> = []
    try {
      Object.defineProperty(document, 'elementFromPoint', {
        configurable: true,
        value: vi.fn().mockReturnValue(targetItem?.element ?? null),
      })

      handle?.element.dispatchEvent(pointerEvent('pointerdown', 210, 12))
      await wrapper.vm.$nextTick()
      window.dispatchEvent(pointerEvent('pointermove', 110, 12))
      await wrapper.vm.$nextTick()

      previewKeys = wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-va-sortable-key'))

      window.dispatchEvent(pointerEvent('pointerup', 110, 12))
      await wrapper.vm.$nextTick()
    } finally {
      delete (document as Document & { elementFromPoint?: Document['elementFromPoint'] }).elementFromPoint
    }

    expect(previewKeys).toEqual([
      '/',
      '/system/user',
      '/system/role',
    ])
    expect(wrapper.emitted('reorderTab')).toBeUndefined()
  })

  it('does not preview a user pinned tab after normal tabs', async () => {
    mockViewport(false)
    installPointerEvent()

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        currentPath: '/system/user',
        tags: [
          { path: '/', title: '控制台', fixed: true, closable: false },
          { path: '/system/user', title: '用户管理', fixed: true, closable: true },
          { path: '/system/role', title: '角色管理' },
        ],
      }),
      global: globalStubs(),
    })
    const sourceItem = wrapper
      .findAll('.va-admin-tags-view__item')
      .find(item => item.text().includes('用户管理'))
    const targetItem = wrapper
      .findAll('.va-admin-tags-view__item')
      .find(item => item.text().includes('角色管理'))
    const handle = sourceItem?.find('[data-testid="admin-tag-drag-/system/user"]')
    mockTagRects(wrapper, {
      '控制台': rect(0, 0),
      '用户管理': rect(100, 0),
      '角色管理': rect(200, 0),
    })

    let previewKeys: Array<string | undefined> = []
    try {
      Object.defineProperty(document, 'elementFromPoint', {
        configurable: true,
        value: vi.fn().mockReturnValue(targetItem?.element ?? null),
      })

      handle?.element.dispatchEvent(pointerEvent('pointerdown', 110, 12))
      await wrapper.vm.$nextTick()
      window.dispatchEvent(pointerEvent('pointermove', 250, 12))
      await wrapper.vm.$nextTick()

      previewKeys = wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-va-sortable-key'))

      window.dispatchEvent(pointerEvent('pointerup', 250, 12))
      await wrapper.vm.$nextTick()
    } finally {
      delete (document as Document & { elementFromPoint?: Document['elementFromPoint'] }).elementFromPoint
    }

    expect(previewKeys).toEqual([
      '/',
      '/system/user',
      '/system/role',
    ])
    expect(wrapper.emitted('reorderTab')).toBeUndefined()
  })

  it('keeps tab drag previews inside the user pinned and normal groups', async () => {
    mockViewport(false)
    installPointerEvent()

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        currentPath: '/demo/level1',
        tags: [
          { path: '/', title: '控制台', fixed: true, closable: false },
          { path: '/system/user', title: '用户管理', fixed: true, closable: true },
          { path: '/system/role', title: '角色管理', fixed: true, closable: true },
          { path: '/demo/level1', title: '一级目录' },
          { path: '/demo/level2', title: '二级目录' },
        ],
      }),
      global: globalStubs(),
    })
    mockTagRects(wrapper, {
      '控制台': rect(0, 0),
      '用户管理': rect(100, 0),
      '角色管理': rect(200, 0),
      '一级目录': rect(300, 0),
      '二级目录': rect(400, 0),
    })

    const dragNormalItem = wrapper
      .findAll('.va-admin-tags-view__item')
      .find(item => item.text().includes('二级目录'))
    const userPinnedTarget = wrapper
      .findAll('.va-admin-tags-view__item')
      .find(item => item.text().includes('角色管理'))
    try {
      Object.defineProperty(document, 'elementFromPoint', {
        configurable: true,
        value: vi.fn().mockReturnValue(userPinnedTarget?.element ?? null),
      })

      dragNormalItem?.find('[data-testid="admin-tag-drag-/demo/level2"]').element.dispatchEvent(pointerEvent('pointerdown', 410, 12))
      await wrapper.vm.$nextTick()
      window.dispatchEvent(pointerEvent('pointermove', 210, 12))
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-va-sortable-key'))).toEqual([
        '/',
        '/system/user',
        '/system/role',
        '/demo/level2',
        '/demo/level1',
      ])

      window.dispatchEvent(pointerEvent('pointercancel', 210, 12))
      await wrapper.vm.$nextTick()

      const dragPinnedItem = wrapper
        .findAll('.va-admin-tags-view__item')
        .find(item => item.text().includes('用户管理'))
      const normalTarget = wrapper
        .findAll('.va-admin-tags-view__item')
        .find(item => item.text().includes('一级目录'))
      Object.defineProperty(document, 'elementFromPoint', {
        configurable: true,
        value: vi.fn().mockReturnValue(normalTarget?.element ?? null),
      })

      dragPinnedItem?.find('[data-testid="admin-tag-drag-/system/user"]').element.dispatchEvent(pointerEvent('pointerdown', 110, 12))
      await wrapper.vm.$nextTick()
      window.dispatchEvent(pointerEvent('pointermove', 350, 12))
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-sortable-item]').map(item => item.attributes('data-va-sortable-key'))).toEqual([
        '/',
        '/system/role',
        '/system/user',
        '/demo/level1',
        '/demo/level2',
      ])
      expect(wrapper.emitted('reorderTab')).toBeUndefined()
    } finally {
      window.dispatchEvent(pointerEvent('pointercancel', 350, 12))
      await wrapper.vm.$nextTick()
      delete (document as Document & { elementFromPoint?: Document['elementFromPoint'] }).elementFromPoint
    }
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
    const tabSurface = wrapper
      .findAll('.va-admin-tags-view__item')
      .find(item => item.text().includes('用户管理'))
      ?.find('.va-admin-tags-view__surface')

    await tabSurface?.trigger('click')

    expect(wrapper.emitted('navigate')?.at(-1)).toEqual(['/system/user'])
  })

  it('renders a desktop drag handle without replacing the tab navigation surface', () => {
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
    const tabSurface = tabItem?.find('.va-admin-tags-view__surface')

    expect(tabSurface?.attributes('role')).toBe('link')
    expect(tabItem?.find('[data-testid="admin-tag-drag-/system/user"]').exists()).toBe(true)
    expect(tabItem?.find('[data-testid="admin-tag-drag-/system/user"]').attributes('data-va-sortable-handle')).toBe('')
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

    expect(source).toContain('function handleTabPointerUp')
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

  it('keeps the active tag indicator inside the tab border box', () => {
    const source = readFileSync(resolve(__dirname, '../../src/layout/components/AdminTagsView.vue'), 'utf8')
    const indicatorStyle = source.match(/\.va-admin-tags-view__item--active::after\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? ''

    expect(indicatorStyle).toContain('z-index: 2;')
    expect(indicatorStyle).toContain('right: -1px;')
    expect(indicatorStyle).toContain('left: -1px;')
    expect(indicatorStyle).toContain('pointer-events: none;')
  })
})

const originalPointerEvent = window.PointerEvent

function installPointerEvent() {
  class TestPointerEvent extends MouseEvent {
    pointerId: number
    pointerType: string

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init)
      this.pointerId = init.pointerId ?? 1
      this.pointerType = init.pointerType ?? 'mouse'
    }
  }

  window.PointerEvent = TestPointerEvent as typeof PointerEvent
}

function pointerEvent(type: string, clientX: number, clientY: number) {
  return new PointerEvent(type, {
    bubbles: true,
    button: type === 'pointermove' ? -1 : 0,
    buttons: type === 'pointerup' ? 0 : 1,
    clientX,
    clientY,
    pointerId: 1,
    pointerType: 'mouse',
  })
}

function rect(left: number, top: number) {
  return {
    left,
    top,
    right: left + 80,
    bottom: top + 40,
    width: 80,
    height: 40,
    x: left,
    y: top,
    toJSON: () => undefined,
  } as DOMRect
}

function mockTagRects(wrapper: ReturnType<typeof mount>, rects: Record<string, DOMRect>) {
  for (const item of wrapper.findAll('.va-admin-tags-view__item')) {
    const title = item.find('.va-admin-tags-view__title').text()
    if (rects[title]) {
      item.element.getBoundingClientRect = vi.fn(() => rects[title])
    }
  }
}
