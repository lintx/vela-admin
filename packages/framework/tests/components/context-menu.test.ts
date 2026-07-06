import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  VaContextMenu,
  VaContextMenuGroup,
  VaContextMenuItem,
} from '../../src/index'

afterEach(() => {
  document.body.innerHTML = ''
})

const globalStubs = {
  stubs: {
    VaIcon: {
      props: ['name', 'library', 'size'],
      template: '<span class="va-icon" :data-admin-icon="name" :data-admin-icon-library="library" :data-admin-icon-size="size" />',
    },
  },
}

describe('VaContextMenu', () => {
  it('renders data groups with dividers and keeps text aligned when an item has no icon', async () => {
    const wrapper = mount(VaContextMenu, {
      props: {
        groups: [
          [
            { value: 'refresh', text: '刷新', icon: 'refresh' },
            { value: 'rename', text: '重命名' },
          ],
          [
            { value: 'delete', text: '删除', icon: 'close', danger: true },
          ],
        ],
      },
      slots: {
        default: '<button data-testid="trigger">打开</button>',
      },
      global: globalStubs,
    })

    await wrapper.find('[data-testid="trigger"]').trigger('contextmenu', { clientX: 120, clientY: 80 })

    expect(wrapper.find('[data-testid="va-context-menu"]').attributes('style')).toContain('left: 120px')
    expect(wrapper.find('[data-testid="va-context-menu"]').attributes('style')).toContain('top: 80px')
    expect(wrapper.findAll('[data-testid="va-context-menu-divider"]')).toHaveLength(1)
    expect(wrapper.find('[data-testid="va-context-menu-item-refresh"] .va-icon').attributes('data-admin-icon')).toBe('refresh')
    expect(wrapper.find('[data-testid="va-context-menu-item-rename"] .va-context-menu__icon-placeholder').exists()).toBe(true)
    expect(wrapper.find('[data-testid="va-context-menu-item-delete"]').classes()).toContain('va-context-menu__item--danger')
  })

  it('hides the icon column for the whole menu when showIcon is false', async () => {
    const wrapper = mount(VaContextMenu, {
      props: {
        showIcon: false,
        groups: [
          [
            { value: 'refresh', text: '刷新', icon: 'refresh' },
            { value: 'rename', text: '重命名' },
          ],
        ],
      },
      slots: {
        default: '<button data-testid="trigger">打开</button>',
      },
      global: globalStubs,
    })

    await wrapper.find('[data-testid="trigger"]').trigger('contextmenu', { clientX: 120, clientY: 80 })

    expect(wrapper.find('[data-testid="va-context-menu"]').classes()).toContain('va-context-menu--without-icons')
    expect(wrapper.find('[data-testid="va-context-menu-item-refresh"] .va-icon').exists()).toBe(false)
    expect(wrapper.find('[data-testid="va-context-menu-item-rename"] .va-context-menu__icon-placeholder').exists()).toBe(false)
  })

  it('supports template menu groups and emits selected item values', async () => {
    const wrapper = mount(VaContextMenu, {
      props: {
        trigger: 'click',
      },
      slots: {
        default: '<button data-testid="trigger">打开</button>',
        menu: `
          <VaContextMenuGroup>
            <VaContextMenuItem value="refresh" icon="refresh">刷新</VaContextMenuItem>
            <VaContextMenuItem value="rename">重命名</VaContextMenuItem>
          </VaContextMenuGroup>
          <VaContextMenuGroup>
            <VaContextMenuItem value="close" icon="close" danger>关闭</VaContextMenuItem>
          </VaContextMenuGroup>
        `,
      },
      global: {
        ...globalStubs,
        components: {
          VaContextMenuGroup,
          VaContextMenuItem,
        },
      },
    })

    await wrapper.find('[data-testid="trigger"]').trigger('click')
    expect(wrapper.findAll('[data-testid="va-context-menu-divider"]')).toHaveLength(1)

    await wrapper.find('[data-testid="va-context-menu-item-rename"]').trigger('click')

    expect(wrapper.emitted('select')?.at(-1)).toEqual(['rename'])
  })

  it('opens cascaded child panels on hover using the floating menu layout', async () => {
    const wrapper = mount(VaContextMenu, {
      props: {
        groups: [
          [
            {
              value: 'move',
              text: '移动到',
              icon: 'tabs',
              children: [
                { value: 'move-dashboard', text: '控制台' },
                { value: 'move-system', text: '系统管理' },
              ],
            },
          ],
        ],
      },
      slots: {
        default: '<button data-testid="trigger">打开</button>',
      },
      global: globalStubs,
    })

    await wrapper.find('[data-testid="trigger"]').trigger('contextmenu', { clientX: 120, clientY: 80 })
    await wrapper.find('[data-testid="va-context-menu-item-move"]').trigger('mouseenter')

    expect(wrapper.findAll('[data-testid="va-context-menu-panel"]')).toHaveLength(2)
    expect(wrapper.find('[data-testid="va-context-menu-item-move-system"]').text()).toContain('系统管理')
    expect(wrapper.find('[data-testid="va-context-menu-item-move"] .va-context-menu__arrow').exists()).toBe(true)
  })

  it('supports both click and contextmenu triggers', async () => {
    const onSelect = vi.fn()
    const wrapper = mount(VaContextMenu, {
      props: {
        trigger: 'both',
        groups: [
          [
            { value: 'refresh', text: '刷新' },
          ],
        ],
        onSelect,
      },
      slots: {
        default: '<button data-testid="trigger">打开</button>',
      },
      global: globalStubs,
    })

    await wrapper.find('[data-testid="trigger"]').trigger('click')
    expect(wrapper.find('[data-testid="va-context-menu"]').exists()).toBe(true)
    await wrapper.find('[data-testid="va-context-menu-item-refresh"]').trigger('click')
    expect(onSelect).toHaveBeenCalledWith('refresh')

    await wrapper.find('[data-testid="trigger"]').trigger('contextmenu', { clientX: 12, clientY: 34 })
    expect(wrapper.find('[data-testid="va-context-menu"]').attributes('style')).toContain('left: 12px')
  })

  it('aligns click menus to the trigger center by default', async () => {
    const offsetHeight = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(60)
    const offsetWidth = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(80)
    const wrapper = mount(VaContextMenu, {
      props: {
        trigger: 'click',
        groups: [
          [
            { value: 'refresh', text: '刷新' },
          ],
        ],
      },
      slots: {
        default: '<button data-testid="trigger">打开</button>',
      },
      attachTo: document.body,
      global: globalStubs,
    })
    const trigger = wrapper.find('[data-testid="trigger"]').element as HTMLElement
    trigger.getBoundingClientRect = vi.fn(() => ({
      left: 100,
      right: 220,
      top: 60,
      bottom: 100,
      width: 120,
      height: 40,
      x: 100,
      y: 60,
      toJSON: () => {},
    }))

    await wrapper.find('[data-testid="trigger"]').trigger('click', { clientX: 180, clientY: 76 })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="va-context-menu"]').attributes('style')).toContain('left: 120px')
    expect(wrapper.find('[data-testid="va-context-menu"]').attributes('style')).toContain('top: 50px')

    offsetHeight.mockRestore()
    offsetWidth.mockRestore()
  })

  it('allows click menus to use target placements', async () => {
    const offsetHeight = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(60)
    const offsetWidth = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(80)
    const wrapper = mount(VaContextMenu, {
      props: {
        trigger: 'click',
        placement: 'target-bottom',
        groups: [
          [
            { value: 'refresh', text: '刷新' },
          ],
        ],
      },
      slots: {
        default: '<button data-testid="trigger">打开</button>',
      },
      attachTo: document.body,
      global: globalStubs,
    })
    const trigger = wrapper.find('[data-testid="trigger"]').element as HTMLElement
    trigger.getBoundingClientRect = vi.fn(() => ({
      left: 100,
      right: 220,
      top: 60,
      bottom: 100,
      width: 120,
      height: 40,
      x: 100,
      y: 60,
      toJSON: () => {},
    }))

    await wrapper.find('[data-testid="trigger"]').trigger('click', { clientX: 180, clientY: 76 })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="va-context-menu"]').attributes('style')).toContain('left: 120px')
    expect(wrapper.find('[data-testid="va-context-menu"]').attributes('style')).toContain('top: 100px')

    offsetHeight.mockRestore()
    offsetWidth.mockRestore()
  })

  it('keeps the menu open after the click that opens it bubbles to document', async () => {
    const wrapper = mount(VaContextMenu, {
      props: {
        trigger: 'click',
        groups: [
          [
            { value: 'refresh', text: '刷新' },
          ],
        ],
      },
      slots: {
        default: '<button data-testid="trigger">打开</button>',
      },
      attachTo: document.body,
      global: globalStubs,
    })

    wrapper.find('[data-testid="trigger"]').element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="va-context-menu"]').exists()).toBe(true)
  })

  it('flips the root menu above the pointer when it would overflow below the viewport', async () => {
    const offsetHeight = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(144)
    const offsetWidth = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(180)
    const wrapper = mount(VaContextMenu, {
      props: {
        groups: [
          [
            { value: 'refresh', text: '刷新' },
            { value: 'rename', text: '重命名' },
            { value: 'copy', text: '复制' },
            { value: 'delete', text: '删除' },
          ],
        ],
      },
      slots: {
        default: '<button data-testid="trigger">打开</button>',
      },
      attachTo: document.body,
      global: globalStubs,
    })

    Object.defineProperty(window, 'innerHeight', { value: 180, configurable: true })
    await wrapper.find('[data-testid="trigger"]').trigger('contextmenu', { clientX: 120, clientY: 170 })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="va-context-menu"]').attributes('style')).toContain('top: 26px')

    offsetHeight.mockRestore()
    offsetWidth.mockRestore()
  })

  it('selects enabled leaf items by shortcut and ignores disabled shortcuts', async () => {
    const onSelect = vi.fn()
    mount(VaContextMenu, {
      props: {
        show: true,
        groups: [
          [
            { value: 'refresh', text: '刷新', shortcut: 'R' },
            { value: 'disabled', text: '禁用', shortcut: 'D', disabled: true },
            { value: 'move', text: '移动到', shortcut: 'M', children: [{ value: 'child', text: '子项' }] },
            { value: 'delete', text: '删除', shortcut: 'Del' },
          ],
        ],
        onSelect,
      },
      slots: {
        default: '<button>打开</button>',
      },
      attachTo: document.body,
      global: globalStubs,
    })

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }))

    expect(onSelect).toHaveBeenCalledTimes(2)
    expect(onSelect).toHaveBeenNthCalledWith(1, 'refresh')
    expect(onSelect).toHaveBeenNthCalledWith(2, 'delete')
  })
})
