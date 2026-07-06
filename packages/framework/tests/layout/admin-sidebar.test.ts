import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import { AdminCollapsedSubMenu, AdminHeader, AdminSidebar } from '../../src/index'
import type { AdminMenuItem } from '../../src/index'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('AdminSidebar', () => {
  it('renders expanded multi-level menus and active state', () => {
    const wrapper = mount(AdminSidebar, {
      props: {
        menus: menus(),
        activePaths: ['/demo', '/demo/level1', '/demo/level1/level2', '/demo/level1/level2/level3', '/demo/level1/level2/level3/leaf'],
        currentPath: '/demo/level1/level2/level3/leaf',
      },
      global: {
        stubs: sidebarStubs(),
      },
    })

    const treeMenu = wrapper.find('[data-testid="admin-sidebar-tree-menu"]')

    expect(treeMenu.exists()).toBe(true)
    expect(treeMenu.attributes('data-active')).toBe('/demo/level1/level2/level3/leaf')
    expect(treeMenu.attributes('data-expanded-values')).toBe('/demo|/demo/level1|/demo/level1/level2|/demo/level1/level2/level3')
    expect(wrapper.findAll('.var-tree-menu__item')).toHaveLength(5)
    expect(wrapper.find('[data-path="/demo"]').attributes('data-navigable')).toBe('false')
    expect(wrapper.find('[data-path="/demo/level1/level2/level3/leaf"]').attributes('data-navigable')).toBe('true')
    expect(wrapper.find('.var-tree-menu--item-active').text()).toContain('四级页面')
  })

  it('uses font-relative visual start offsets for tree menu items', () => {
    const wrapper = mount(AdminSidebar, {
      props: {
        menus: [
          {
            path: '/demo',
            title: '多级示例',
            icon: 'format-list-bulleted',
            order: 10,
            navigable: false,
            children: [
              {
                path: '/demo/text-child',
                title: '无图标子菜单',
                order: 10,
                navigable: true,
                children: [],
              },
              {
                path: '/demo/icon-child',
                title: '有图标子菜单',
                icon: 'shield-outline',
                order: 20,
                navigable: true,
                children: [],
              },
            ],
          },
        ],
      },
      global: {
        stubs: sidebarStubs(),
      },
    })

    const treeMenu = wrapper.find('[data-testid="admin-sidebar-tree-menu"]')
    const textChild = wrapper.find('[data-path="/demo/text-child"]')
    const iconChild = wrapper.find('[data-path="/demo/icon-child"]')

    expect(treeMenu.attributes('data-indent')).toBe('var(--va-admin-sidebar-tree-menu-item-indent)')
    expect(textChild.attributes('data-content-offset')).toBe('var(--va-admin-sidebar-tree-menu-icon-text-offset)')
    expect(iconChild.attributes('data-content-offset')).toBe('var(--va-admin-sidebar-tree-menu-icon-text-offset)')
  })

  it('renders collapsed width, larger top-level icon and submenu flyout', async () => {
    const wrapper = mount(AdminSidebar, {
      props: {
        menus: menus(),
        activePaths: ['/demo'],
        currentPath: '/demo',
        collapsed: true,
      },
      global: {
        stubs: sidebarStubs(),
      },
    })

    expect(wrapper.classes()).toContain('va-admin-sidebar--collapsed')
    expect(wrapper.attributes('style')).toContain('--va-admin-sidebar-current-width: 56px')
    expect(wrapper.find('.va-admin-sidebar__brand').text()).toBe('V')
    expect(wrapper.find('.va-admin-sidebar-item__icon').attributes('style')).toContain('--va-admin-sidebar-current-icon-size: 26px')

    await wrapper.find('.va-admin-sidebar-item').trigger('mouseenter')

    expect(wrapper.find('.va-admin-collapsed-sub-menu').exists()).toBe(true)
    expect(wrapper.find('.va-admin-collapsed-sub-menu').text()).toContain('一级目录')
  })

  it('uses a centered circular fallback marker for collapsed text-only menu items', () => {
    const itemStyle = readFileSync(
      resolve(__dirname, '../../src/layout/components/AdminSidebarItem.vue'),
      'utf8',
    )
    const dotStyle = itemStyle
      .match(/\.va-admin-sidebar-item__dot\s*\{(?<body>[\s\S]*?)\n\}/)
      ?.groups
      ?.body ?? ''

    expect(dotStyle).toContain('width: 9px;')
    expect(dotStyle).toContain('height: 9px;')
    expect(dotStyle).toContain('border-radius: 50%;')
    expect(dotStyle).not.toContain('margin-left')
  })

  it('positions the collapsed submenu from the hovered menu item', async () => {
    const wrapper = mount(AdminSidebar, {
      attachTo: document.body,
      props: {
        menus: menus(),
        activePaths: ['/demo'],
        currentPath: '/demo',
        collapsed: true,
      },
      global: {
        stubs: sidebarStubs(),
      },
    })

    const sidebar = wrapper.find('.va-admin-sidebar').element as HTMLElement
    const trigger = wrapper.find('.va-admin-sidebar-item').element as HTMLElement

    sidebar.getBoundingClientRect = () => ({
      top: 20,
      left: 0,
      right: 56,
      bottom: 700,
      width: 56,
      height: 680,
      x: 0,
      y: 20,
      toJSON: () => {},
    })
    trigger.getBoundingClientRect = () => ({
      top: 160,
      left: 0,
      right: 56,
      bottom: 204,
      width: 56,
      height: 44,
      x: 0,
      y: 160,
      toJSON: () => {},
    })

    await wrapper.find('.va-admin-sidebar-item').trigger('mouseenter')

    expect(wrapper.find('.va-admin-collapsed-sub-menu').attributes('style')).toEqual(expect.stringContaining(
      '--va-admin-collapsed-sub-menu-top: 132px',
    ))
  })

  it('uses separate expanded and collapsed brand slots', () => {
    const wrapper = mount(AdminSidebar, {
      props: {
        menus: menus(),
        collapsed: true,
      },
      slots: {
        brand: '<span class="test-expanded-brand"><img alt="Vela Admin" />Vela Admin</span>',
        brandCollapsed: '<img class="test-collapsed-logo" alt="Vela Admin" />',
      },
      global: {
        stubs: sidebarStubs(),
      },
    })

    expect(wrapper.find('.test-collapsed-logo').exists()).toBe(true)
    expect(wrapper.find('.test-expanded-brand').exists()).toBe(false)
  })

  it('centers the sidebar brand in both expanded and collapsed states', () => {
    const sidebarStyle = readFileSync(
      resolve(__dirname, '../../src/layout/components/AdminSidebar.vue'),
      'utf8',
    )
    const expandedBrandStyle = sidebarStyle
      .match(/\.va-admin-sidebar__brand\s*\{(?<body>[\s\S]*?)\n\}/)
      ?.groups
      ?.body ?? ''
    const collapsedBrandStyle = sidebarStyle
      .match(/\.va-admin-sidebar--collapsed\s+\.va-admin-sidebar__brand\s*\{(?<body>[\s\S]*?)\n\}/)
      ?.groups
      ?.body ?? ''

    expect(expandedBrandStyle).toContain('justify-content: center;')
    expect(collapsedBrandStyle).toContain('justify-content: center;')
    expect(collapsedBrandStyle).toContain('padding: 0;')
  })

  it('keeps the collapsed submenu open when pointer returns to the trigger item', async () => {
    const wrapper = mount(AdminSidebar, {
      attachTo: document.body,
      props: {
        menus: menus(),
        activePaths: ['/demo'],
        currentPath: '/demo',
        collapsed: true,
      },
      global: {
        stubs: sidebarStubs(),
      },
    })

    const trigger = wrapper.find('.va-admin-sidebar-item')
    await trigger.trigger('mouseenter')

    const submenu = wrapper.find('.va-admin-collapsed-sub-menu')
    expect(submenu.exists()).toBe(true)

    await submenu.trigger('mouseleave', { relatedTarget: trigger.element })

    expect(wrapper.find('.va-admin-collapsed-sub-menu').exists()).toBe(true)
  })

  it('closes the collapsed submenu when pointer leaves the trigger item to blank area', async () => {
    const wrapper = mount(AdminSidebar, {
      attachTo: document.body,
      props: {
        menus: menus(),
        activePaths: ['/demo'],
        currentPath: '/demo',
        collapsed: true,
      },
      global: {
        stubs: sidebarStubs(),
      },
    })

    const trigger = wrapper.find('.va-admin-sidebar-item')
    await trigger.trigger('mouseenter')
    expect(wrapper.find('.va-admin-collapsed-sub-menu').exists()).toBe(true)

    await trigger.trigger('mouseleave', { relatedTarget: document.body })

    expect(wrapper.find('.va-admin-collapsed-sub-menu').exists()).toBe(false)
  })

  it('overlaps the collapsed submenu hit area with the sidebar border without changing the visual gap', () => {
    const submenuStyle = readFileSync(
      resolve(__dirname, '../../src/layout/components/AdminCollapsedSubMenu.vue'),
      'utf8',
    )

    expect(submenuStyle).toContain('left: calc(var(--va-admin-sidebar-current-width) - 1px);')
    expect(submenuStyle).toContain('padding: 8px 0 0 9px;')
  })

  it('keeps sidebar scrolling inside the menu area', () => {
    const sidebarStyle = readFileSync(
      resolve(__dirname, '../../src/layout/components/AdminSidebar.vue'),
      'utf8',
    )
    const sidebarRootStyle = sidebarStyle
      .match(/\.va-admin-sidebar\s*\{(?<body>[\s\S]*?)\n\}/)
      ?.groups
      ?.body ?? ''
    const menuStyle = sidebarStyle
      .match(/\.va-admin-sidebar__menu\s*\{(?<body>[\s\S]*?)\n\}/)
      ?.groups
      ?.body ?? ''

    expect(sidebarRootStyle).toContain('height: 100dvh;')
    expect(sidebarRootStyle).not.toContain('overflow:')
    expect(menuStyle).toContain('overflow-y: auto;')
  })

  it('keeps long collapsed submenus scrollable within the remaining viewport', () => {
    const submenuStyle = readFileSync(
      resolve(__dirname, '../../src/layout/components/AdminCollapsedSubMenu.vue'),
      'utf8',
    )
    const floatingMenuStyle = readFileSync(
      resolve(__dirname, '../../src/layout/components/AdminFloatingMenu.vue'),
      'utf8',
    )

    expect(submenuStyle).toContain('--va-admin-floating-menu-max-height: max(')
    expect(submenuStyle).toContain('100dvh - var(--va-admin-collapsed-sub-menu-top)')
    expect(submenuStyle).toContain('overflow: visible;')
    expect(floatingMenuStyle).toContain('max-height: var(--va-admin-floating-menu-max-height, inherit);')
    expect(floatingMenuStyle).toContain('overflow-y: auto;')
  })
})

describe('AdminHeader', () => {
  it('releases pointer focus after toggling the sidebar', async () => {
    const wrapper = mount(AdminHeader, {
      attachTo: document.body,
      props: {
        appName: 'Vela Admin',
      },
      global: {
        stubs: {
          VaIcon: true,
          VarButton: {
            template: '<button type="button"><slot /></button>',
          },
        },
      },
    })

    const button = wrapper.find('[data-testid="admin-sidebar-toggle"]')
    ;(button.element as HTMLButtonElement).focus()

    expect(document.activeElement).toBe(button.element)

    button.element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => window.setTimeout(resolve))

    expect(document.activeElement).not.toBe(button.element)
  })

  it('keeps keyboard focus after toggling the sidebar from keyboard activation', async () => {
    const wrapper = mount(AdminHeader, {
      attachTo: document.body,
      props: {
        appName: 'Vela Admin',
      },
      global: {
        stubs: {
          VaIcon: true,
          VarButton: {
            template: '<button type="button"><slot /></button>',
          },
        },
      },
    })

    const button = wrapper.find('[data-testid="admin-sidebar-toggle"]')
    ;(button.element as HTMLButtonElement).focus()

    button.element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }))
    await wrapper.vm.$nextTick()

    expect(document.activeElement).toBe(button.element)
  })

  it('suppresses the header toggle focus overlay while preserving native focus behavior', () => {
    const headerStyle = readFileSync(
      resolve(__dirname, '../../src/layout/components/AdminHeader.vue'),
      'utf8',
    )

    expect(headerStyle).toContain('.va-admin-header__menu-button :deep(.var-hover-overlay--focusing)')
    expect(headerStyle).toContain('opacity: 0;')
  })

  it('uses a larger icon for icon-only header actions', () => {
    const wrapper = mount(AdminHeader, {
      props: {
        appName: 'Vela Admin',
        mobile: true,
      },
      global: {
        stubs: {
          VaIcon: {
            props: ['name', 'size'],
            template: '<span class="va-icon" :data-admin-icon="name" :data-admin-icon-size="size" />',
          },
          VarButton: {
            template: '<button type="button"><slot /></button>',
          },
        },
      },
    })

    expect(wrapper.find('[data-testid="admin-sidebar-toggle"] .va-icon').attributes('data-admin-icon-size')).toBe('22')
    expect(wrapper.find('[data-testid="admin-header-more-button"] .va-icon').attributes('data-admin-icon-size')).toBe('22')
  })

  it('renders mobile header tools as text actions and keeps the search trigger expanded', async () => {
    const wrapper = mount(AdminHeader, {
      attachTo: document.body,
      props: {
        appName: 'Vela Admin',
        mobile: true,
      },
      slots: {
        tools: `
          <div class="test-tools">
            <button class="va-admin-menu-search__button" data-testid="admin-menu-search-button">
              <span class="va-icon" data-admin-icon="search"></span>
              <span class="va-admin-menu-search__button-text">搜索</span>
              <kbd class="va-admin-menu-search__shortcut">Ctrl K</kbd>
            </button>
            <button data-testid="admin-settings-button">
              <span class="va-icon" data-admin-icon="settings"></span>
              <span>个性设置</span>
            </button>
          </div>
        `,
      },
      global: {
        stubs: {
          VaIcon: {
            props: ['name', 'size'],
            template: '<span class="va-icon" :data-admin-icon="name" :data-admin-icon-size="size" />',
          },
          VarButton: {
            template: '<button type="button"><slot /></button>',
          },
        },
      },
    })

    await wrapper.find('[data-testid="admin-header-more-button"]').trigger('click')

    expect(wrapper.find('[data-testid="admin-header-mobile-menu"]').text()).toContain('搜索')
    expect(wrapper.find('[data-testid="admin-header-mobile-menu"]').text()).toContain('Ctrl K')
    expect(wrapper.find('[data-testid="admin-header-mobile-menu"]').text()).toContain('个性设置')
  })
})

function menus(): AdminMenuItem[] {
  return [
    {
      path: '/demo',
      title: '多级示例',
      icon: 'format-list-bulleted',
      order: 10,
      navigable: false,
      children: [
        {
          path: '/demo/level1',
          title: '一级目录',
          order: 10,
          navigable: false,
          children: [
            {
              path: '/demo/level1/level2',
              title: '二级目录',
              order: 10,
              navigable: false,
              children: [
                {
                  path: '/demo/level1/level2/level3',
                  title: '三级目录',
                  order: 10,
                  navigable: false,
                  children: [
                    {
                      path: '/demo/level1/level2/level3/leaf',
                      title: '四级页面',
                      order: 10,
                      navigable: true,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ]
}

function sidebarStubs() {
  return {
    RouterLink: RouterLinkStub,
    VaIcon: true,
    'var-tree-menu': {
      props: ['active', 'options', 'expandedValues', 'indent'],
      emits: ['update:active', 'update:expandedValues', 'change'],
      methods: {
        flattenOptions(options: AdminMenuItem[]): AdminMenuItem[] {
          return options.flatMap((option) => [option, ...this.flattenOptions(option.children)])
        },
        getLabelStyle(option: AdminMenuItem & { label?: () => { props?: { style?: Record<string, string> } } }) {
          const style = option.label?.().props?.style

          return style?.paddingLeft ?? style?.marginLeft ?? ''
        },
        getIconStyle(option: AdminMenuItem & { icon?: () => { props?: { style?: Record<string, string> } } }) {
          return option.icon?.().props?.style?.marginLeft ?? ''
        },
        getContentOffset(option: AdminMenuItem & { render?: (payload: { node: { props?: { style?: Record<string, string> } } }) => { props?: { style?: Record<string, string> } } }) {
          return option.render?.({ node: {} })?.props?.style?.['--va-admin-sidebar-tree-menu-content-offset'] ?? ''
        },
      },
      template: `
        <div
          class="var-tree-menu"
          data-testid="admin-sidebar-tree-menu"
          :data-active="active"
          :data-expanded-values="expandedValues.join('|')"
          :data-indent="indent"
        >
          <button
            v-for="option in flattenOptions(options)"
            :key="option.path"
            type="button"
            class="var-tree-menu__item"
            :class="{ 'var-tree-menu--item-active': active === option.path }"
            :data-path="option.path"
            :data-navigable="option.navigable ? 'true' : 'false'"
            :data-label-style="getLabelStyle(option)"
            :data-icon-style="getIconStyle(option)"
            :data-content-offset="getContentOffset(option)"
            @click="$emit('change', option.path, option)"
          >
            {{ option.title }}
          </button>
        </div>
      `,
    },
  }
}
