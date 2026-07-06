import { mount, RouterLinkStub } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AdminLayout } from '../../src/index'
import AdminTopMenu from '../../src/layout/components/AdminTopMenu.vue'
import type { AdminMenuItem } from '../../src/index'

const originalMatchMedia = window.matchMedia

afterEach(() => {
  window.matchMedia = originalMatchMedia
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('AdminLayout', () => {
  it('emits closeHeaderTools when the mobile header tools menu closes', () => {
    const adminHeaderSource = readFileSync(resolve(__dirname, '../../src/layout/components/AdminHeader.vue'), 'utf8')
    const adminLayoutSource = readFileSync(resolve(__dirname, '../../src/layout/AdminLayout.vue'), 'utf8')
    const sideLayoutSource = readFileSync(resolve(__dirname, '../../src/layout/SideLayout.vue'), 'utf8')
    const topLayoutSource = readFileSync(resolve(__dirname, '../../src/layout/TopLayout.vue'), 'utf8')
    const mixedLayoutSource = readFileSync(resolve(__dirname, '../../src/layout/MixedLayout.vue'), 'utf8')

    expect(adminHeaderSource).toContain('closeMobileTools: []')
    expect(adminHeaderSource).toContain('@click="closeMobileTools"')
    expect(adminLayoutSource).toContain('closeHeaderTools: []')
    expect(adminLayoutSource).toContain('@close-mobile-tools="emit(\'closeHeaderTools\')"')
    expect(sideLayoutSource).toContain('@close-mobile-tools="emit(\'closeMobileTools\')"')
    expect(topLayoutSource).toContain('@close-mobile-tools="emit(\'closeMobileTools\')"')
    expect(mixedLayoutSource).toContain('@close-mobile-tools="emit(\'closeMobileTools\')"')
  })

  it('toggles the desktop sidebar collapsed state', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })

    expect(wrapper.find('.va-admin-sidebar').attributes('style')).toContain('--va-admin-sidebar-current-width: 272px')

    await wrapper.find('[data-testid="admin-sidebar-toggle"]').trigger('click')

    expect(wrapper.find('.va-admin-sidebar').classes()).toContain('va-admin-sidebar--collapsed')
    expect(wrapper.find('.va-admin-sidebar').attributes('style')).toContain('--va-admin-sidebar-current-width: 56px')
  })

  it('renders the expanded desktop sidebar with Varlet tree menu and keeps parent groups non-navigable', () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        currentPath: '/system/user',
        activePaths: ['/system', '/system/user'],
      }),
      global: globalStubs(),
    })

    expect(wrapper.find('[data-testid="admin-sidebar-tree-menu"]').exists()).toBe(true)
    expect(wrapper.find('.va-admin-sidebar-item').exists()).toBe(false)
    expect(wrapper.find('[data-path="/system"]').attributes('data-navigable')).toBe('false')
  })

  it('renders collapsed desktop sidebar children in cascading floating panels', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        currentPath: '/demo/level1/level2/level3/leaf',
        activePaths: ['/demo', '/demo/level1', '/demo/level1/level2', '/demo/level1/level2/level3', '/demo/level1/level2/level3/leaf'],
      }),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-sidebar-toggle"]').trigger('click')

    expect(wrapper.find('[data-testid="admin-sidebar-tree-menu"]').exists()).toBe(false)
    expect(wrapper.find('.va-admin-sidebar-item').exists()).toBe(true)

    await wrapper.findAll('.va-admin-sidebar-item')[2].trigger('mouseenter')

    expect(wrapper.find('.va-admin-collapsed-sub-menu').exists()).toBe(true)
    expect(wrapper.findAll('.va-admin-floating-menu__panel')).toHaveLength(1)
    expect(wrapper.find('.va-admin-floating-menu__panel').text()).toContain('一级目录')
    expect(wrapper.find('.va-admin-floating-menu__panel').text()).not.toContain('二级目录')

    await findFloatingMenuItemByText(wrapper, '一级目录')?.trigger('mouseenter')

    expect(wrapper.findAll('.va-admin-floating-menu__panel')).toHaveLength(2)
    expect(wrapper.findAll('.va-admin-floating-menu__panel')[1].text()).toContain('二级目录')
    expectFloatingPanelPosition(wrapper, 1, 'calc(1 * (100% - 1px))', 'calc(0 * var(--va-admin-sidebar-menu-item-height))')
    await findFloatingMenuItemByText(wrapper, '二级目录')?.trigger('mouseenter')

    expect(wrapper.findAll('.va-admin-floating-menu__panel')).toHaveLength(3)
    expect(wrapper.findAll('.va-admin-floating-menu__panel')[2].text()).toContain('三级目录')
    expectFloatingPanelPosition(wrapper, 2, 'calc(2 * (100% - 1px))', 'calc(0 * var(--va-admin-sidebar-menu-item-height))')
    await findFloatingMenuItemByText(wrapper, '三级目录')?.trigger('mouseenter')

    expect(wrapper.findAll('.va-admin-floating-menu__panel')).toHaveLength(4)
    expect(wrapper.findAll('.va-admin-floating-menu__panel')[3].text()).toContain('四级页面')
    expectFloatingPanelPosition(wrapper, 3, 'calc(3 * (100% - 1px))', 'calc(1 * var(--va-admin-sidebar-menu-item-height))')
  })

  it('opens a drawer sidebar on mobile instead of rendering the desktop sidebar first', async () => {
    mockViewport(true)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })

    expect(wrapper.find('.va-admin-layout__desktop-sidebar').exists()).toBe(false)
    expect(wrapper.find('.va-admin-drawer-sidebar--open').exists()).toBe(false)

    await wrapper.find('[data-testid="admin-sidebar-toggle"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(document.body.querySelector('.va-admin-drawer-sidebar--open')).toBeTruthy()
    expect(document.body.querySelector('.va-admin-drawer-sidebar')?.textContent).toContain('用户管理')
  })

  it('closes the mobile drawer after route changes', async () => {
    mockViewport(true)
    const router = createMemoryRouter()
    await router.push('/system/user')

    const wrapper = mount(AdminLayout, {
      props: layoutProps({ currentPath: '/system/user', activePaths: ['/system', '/system/user'] }),
      global: {
        ...globalStubs(),
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.find('[data-testid="admin-sidebar-toggle"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('.va-admin-drawer-sidebar--open')).toBeTruthy()

    await router.push('/demo')
    await wrapper.vm.$nextTick()

    expect(document.body.querySelector('.va-admin-drawer-sidebar--open')).toBeNull()
  })

  it('shows text labels for header tools inside the mobile overflow menu', async () => {
    mockViewport(true)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      slots: {
        headerTools: `
          <button class="admin-preview__tool-button">
            <span class="va-icon" data-admin-icon="moon"></span>
            <span class="admin-preview__tool-label--adaptive">深色</span>
          </button>
        `,
      },
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-header-more-button"]').trigger('click')

    const mobileMenu = wrapper.find('[data-testid="admin-header-mobile-menu"]')
    expect(mobileMenu.text()).toContain('搜索')
    expect(mobileMenu.text()).toContain('Ctrl K')
    expect(mobileMenu.text()).toContain('深色')
    expect(mobileMenu.text()).toContain('个性设置')
    expect(wrapper.find('[data-testid="admin-settings-button"]').attributes('data-round')).not.toBe('true')
    expect(wrapper.find('[data-testid="admin-settings-button"]').classes()).toContain('va-admin-layout__tool-button')
    expect(wrapper.find('[data-testid="admin-settings-button"] .va-admin-layout__tool-label--adaptive').exists()).toBe(true)
  })

  it('closes the mobile header tools menu when clicking its transparent scrim', async () => {
    mockViewport(true)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })

    await wrapper.find('[data-testid="admin-header-more-button"]').trigger('click')

    expect(wrapper.find('[data-testid="admin-header-mobile-menu"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-header-mobile-scrim"]').exists()).toBe(true)

    await wrapper.find('[data-testid="admin-header-mobile-scrim"]').trigger('click')

    expect(wrapper.find('[data-testid="admin-header-mobile-menu"]').exists()).toBe(false)
  })

  it('defines sidebar and drawer transitions while preserving sidebar button icon semantics', () => {
    const sidebarSource = readFileSync(resolve(__dirname, '../../src/layout/components/AdminSidebar.vue'), 'utf8')
    const drawerSource = readFileSync(resolve(__dirname, '../../src/layout/components/AdminDrawerSidebar.vue'), 'utf8')
    const headerSource = readFileSync(resolve(__dirname, '../../src/layout/components/AdminHeader.vue'), 'utf8')

    expect(sidebarSource).toContain('transition: width 180ms')
    expect(drawerSource).toContain('<Transition name="va-admin-drawer-sidebar">')
    expect(drawerSource).toContain('.va-admin-drawer-sidebar-enter-active')
    expect(headerSource).toContain("mobile || sidebarCollapsed ? 'menu' : 'menu-open'")
    expect(headerSource).not.toContain('va-admin-header__menu-button-icon--collapsed')
    expect(headerSource).not.toContain('rotate(180deg)')
  })

  it('does not force direct mobile overflow buttons to stack their inner content', () => {
    const source = readFileSync(
      resolve(__dirname, '../../src/layout/components/AdminHeader.vue'),
      'utf8',
    )

    expect(source).not.toContain('.va-admin-header__mobile-menu :deep(> *)')
    expect(source).toContain('.va-admin-header__mobile-menu :deep(.var-space)')
    expect(source).toContain('.va-admin-header__mobile-menu :deep(.var-button__content)')
  })

  it('keeps settings text hidden on desktop header tools', () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps(),
      global: globalStubs(),
    })

    expect(wrapper.find('[data-testid="admin-settings-button"]').text()).toContain('个性设置')
    expect(wrapper.find('[data-testid="admin-settings-button"]').classes()).toContain('va-admin-layout__tool-button')
    expect(wrapper.find('[data-testid="admin-settings-button"] .va-admin-layout__tool-label--adaptive').exists()).toBe(true)
  })

  it('applies configured sidebar width and scrollbar mode to the layout root', () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        sidebarWidth: 300,
        scrollbar: 'hover',
      }),
      global: globalStubs(),
    })

    expect(wrapper.find('.va-admin-sidebar').attributes('style')).toContain('--va-admin-sidebar-current-width: 300px')
    expect(wrapper.find('.va-admin-layout').classes()).toContain('va-admin-layout--scrollbar-hover')
  })

  it('renders top mode with horizontal menu and no desktop sidebar', () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({ mode: 'top' }),
      global: {
        ...globalStubs({ stubRouterLink: false }),
        plugins: [createMemoryRouter()],
      },
    })

    expect(wrapper.find('.va-admin-layout--top').exists()).toBe(true)
    expect(wrapper.find('.va-admin-layout__desktop-sidebar').exists()).toBe(false)
    expect(wrapper.find('[data-testid="admin-sidebar-toggle"]').exists()).toBe(false)
    expect(wrapper.find('.va-admin-header .va-admin-top-menu').text()).toContain('系统管理')
  })

  it('uses the logo slot instead of app name or page title in top mode header', () => {
    mockViewport(false)

    const topWrapper = mount(AdminLayout, {
      props: layoutProps({ mode: 'top', pageTitle: '权限按钮' }),
      slots: {
        logo: '<img class="test-top-logo" alt="Vela Admin" />',
      },
      global: globalStubs(),
    })

    expect(topWrapper.find('.va-admin-header .test-top-logo').exists()).toBe(true)
    expect(topWrapper.find('.va-admin-header__app').exists()).toBe(false)
    expect(topWrapper.find('.va-admin-header__page').exists()).toBe(false)
  })

  it('renders side mode page location as a Varlet breadcrumb without navigating non-link parents', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        menus: menusWithRolePage(),
        mode: 'side',
        currentPath: '/system/role',
        activePaths: ['/system', '/system/role'],
        pageTitle: '角色管理',
      }),
      global: globalStubs(),
    })

    const breadcrumb = wrapper.find('[data-testid="admin-header-breadcrumb"]')

    expect(breadcrumb.exists()).toBe(true)
    expect(breadcrumb.text()).toContain('系统管理')
    expect(breadcrumb.text()).toContain('角色管理')
    expect(wrapper.find('.va-admin-header__page').exists()).toBe(false)

    await wrapper.findAll('.var-breadcrumb-item')[0].trigger('click')

    expect(wrapper.emitted('navigate')).toBeUndefined()

    const sideLayoutSource = readFileSync(resolve(__dirname, '../../src/layout/SideLayout.vue'), 'utf8')

    expect(sideLayoutSource).toContain('import AdminFloatingMenu')
    expect(sideLayoutSource).toContain('<var-menu')
    expect(sideLayoutSource).toContain('v-model:show="breadcrumbMenuOpenState[item.path]"')
    expect(sideLayoutSource).toContain(":key=\"`${item.path}-${breadcrumbMenuOpenState[item.path] ? 'open' : 'closed'}`\"")
    expect(sideLayoutSource).toContain('@open="openBreadcrumbMenu(item)"')
    expect(sideLayoutSource).toContain('@click.stop="toggleBreadcrumbMenu(item)"')
    expect(sideLayoutSource).toContain('v-if="breadcrumbMenuOpenState[item.path]"')
    expect(sideLayoutSource).toContain('<AdminFloatingMenu')
    expect(sideLayoutSource).toContain('document.addEventListener(\'pointerdown\', handleBreadcrumbPointerDown, true)')
    expect(sideLayoutSource).toContain('document.addEventListener(\'click\', handleBreadcrumbClick, true)')
    expect(sideLayoutSource).toContain('suppressNextBreadcrumbClick')
    expect(sideLayoutSource).toContain('event.stopPropagation()')
    expect(sideLayoutSource).not.toContain('item.firstNavigableChildPath')
    expect(sideLayoutSource).not.toContain('va-admin-layout__breadcrumb-menu-panel')
  })

  it('renders top menu children in a flyout', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({ mode: 'top' }),
      global: {
        ...globalStubs({ stubRouterLink: false }),
        plugins: [createMemoryRouter()],
      },
    })

    await wrapper.findAll('.va-admin-top-menu__item')[1].trigger('mouseenter')

    expect(wrapper.find('.va-admin-top-menu__flyout').text()).toContain('用户管理')
  })

  it('renders nested top menu children in cascading flyout panels', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({ mode: 'top' }),
      global: globalStubs(),
    })

    await wrapper.findAll('.va-admin-top-menu__item')[2].trigger('mouseenter')

    expect(wrapper.findAll('.va-admin-floating-menu__panel')).toHaveLength(1)
    expect(wrapper.find('.va-admin-floating-menu__panel').text()).toContain('一级目录')
    expect(wrapper.find('.va-admin-floating-menu__panel').text()).not.toContain('二级目录')
    expect(findFloatingMenuItemByText(wrapper, '一级目录')?.find('.va-admin-floating-menu__icon-placeholder').exists()).toBe(true)

    await findFloatingMenuItemByText(wrapper, '一级目录')?.trigger('mouseenter')

    expect(wrapper.findAll('.va-admin-floating-menu__panel')).toHaveLength(2)
    expect(wrapper.findAll('.va-admin-floating-menu__panel')[1].text()).toContain('二级目录')
    expectFloatingPanelPosition(wrapper, 1, 'calc(1 * (100% - 1px))', 'calc(0 * var(--va-admin-sidebar-menu-item-height))')
    await findFloatingMenuItemByText(wrapper, '二级目录')?.trigger('mouseenter')

    expect(wrapper.findAll('.va-admin-floating-menu__panel')).toHaveLength(3)
    expect(wrapper.findAll('.va-admin-floating-menu__panel')[2].text()).toContain('三级目录')
    expectFloatingPanelPosition(wrapper, 2, 'calc(2 * (100% - 1px))', 'calc(0 * var(--va-admin-sidebar-menu-item-height))')
    await findFloatingMenuItemByText(wrapper, '三级目录')?.trigger('mouseenter')

    expect(wrapper.findAll('.va-admin-floating-menu__panel')).toHaveLength(4)
    expect(wrapper.findAll('.va-admin-floating-menu__panel')[3].text()).toContain('四级页面')
    expectFloatingPanelPosition(wrapper, 3, 'calc(3 * (100% - 1px))', 'calc(1 * var(--va-admin-sidebar-menu-item-height))')
  })

  it('does not navigate when clicking a top menu parent group', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({ mode: 'top' }),
      global: globalStubs(),
    })

    await wrapper.findAll('.va-admin-top-menu__item')[1].trigger('click')

    expect(wrapper.emitted('navigate')).toBeUndefined()
    expect(wrapper.find('.va-admin-top-menu__link[href="/system"]').exists()).toBe(false)
  })

  it('renders parent groups inside a top menu flyout without links', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({ mode: 'top' }),
      global: globalStubs(),
    })

    await wrapper.findAll('.va-admin-top-menu__item')[2].trigger('mouseenter')
    const level1 = findSidebarItemByText(wrapper, '一级目录')

    expect(level1?.attributes('href')).toBeUndefined()
  })

  it('switches between top flyouts without closing the next one', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({ mode: 'top' }),
      global: globalStubs(),
    })

    await wrapper.findAll('.va-admin-top-menu__item')[1].trigger('mouseenter')
    expect(wrapper.find('.va-admin-top-menu__flyout').text()).toContain('用户管理')

    await wrapper.findAll('.va-admin-top-menu__item')[2].trigger('mouseenter')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.va-admin-top-menu__flyout').text()).toContain('一级目录')
  })

  it('closes the top flyout when pointer leaves the trigger item to blank area', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({ mode: 'top' }),
      global: globalStubs(),
    })

    const trigger = wrapper.findAll('.va-admin-top-menu__item')[2]
    await trigger.trigger('mouseenter')
    expect(wrapper.find('.va-admin-top-menu__flyout').text()).toContain('一级目录')

    await trigger.trigger('mouseleave', { relatedTarget: document.body })

    expect(wrapper.find('.va-admin-top-menu__flyout').exists()).toBe(false)
  })

  it('keeps the top flyout open when pointer moves from the active trigger item to the tabs indicator area', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        mode: 'top',
        currentPath: '/system/user',
        activePaths: ['/system', '/system/user'],
      }),
      global: globalStubs(),
    })

    const trigger = wrapper.findAll('.va-admin-top-menu__item')[1]
    const indicator = wrapper.find('.var-tabs__indicator-inner')
    await trigger.trigger('mouseenter')
    expect(wrapper.find('.va-admin-top-menu__flyout').text()).toContain('用户管理')

    await trigger.trigger('mouseleave', { relatedTarget: indicator.element })

    expect(wrapper.find('.va-admin-top-menu__flyout').exists()).toBe(true)

    await trigger.trigger('mouseleave', { relatedTarget: wrapper.find('.var-tabs').element })

    expect(wrapper.find('.va-admin-top-menu__flyout').exists()).toBe(false)
  })

  it('keeps the top flyout open when pointer returns from the flyout to the active tabs indicator area', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        mode: 'top',
        currentPath: '/system/user',
        activePaths: ['/system', '/system/user'],
      }),
      global: globalStubs(),
    })

    const trigger = wrapper.findAll('.va-admin-top-menu__item')[1]
    const indicator = wrapper.find('.var-tabs__indicator-inner')
    await trigger.trigger('mouseenter')
    expect(wrapper.find('.va-admin-top-menu__flyout').text()).toContain('用户管理')

    await wrapper.find('.va-admin-top-menu__flyout').trigger('mouseleave', { relatedTarget: indicator.element })

    expect(wrapper.find('.va-admin-top-menu__flyout').exists()).toBe(true)
  })

  it('renders overflowing top menus under a more entry', async () => {
    mockTopMenuWidths({
      container: 320,
      overflow: 72,
      items: {
        '/': 72,
        '/system': 96,
        '/demo': 96,
        '/permission': 96,
        '/exception': 88,
        '/overflow': 96,
      },
    })

    const wrapper = mount(AdminTopMenu, {
      props: {
        menus: overflowMenus(),
        currentPath: '/exception',
        activePaths: ['/exception'],
      },
      global: globalStubs(),
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="admin-top-menu-more"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-top-menu-more"]').classes()).not.toContain('va-admin-top-menu__more--active')
    expect(wrapper.findAll('.va-admin-top-menu__item').map((item) => item.attributes('data-menu-path'))).toEqual([
      '/',
      '/exception',
    ])
    expect(wrapper.find('.va-admin-top-menu__item--active').attributes('data-menu-path')).toBe('/exception')
    await wrapper.find('[data-testid="admin-top-menu-more"]').trigger('mouseenter')

    expect(wrapper.find('[data-testid="admin-top-menu-overflow"]').text()).toContain('系统管理')
    expect(wrapper.find('[data-testid="admin-top-menu-overflow"]').text()).toContain('多级示例')
    expect(wrapper.find('[data-testid="admin-top-menu-overflow"]').text()).toContain('权限按钮')
    expect(wrapper.find('[data-testid="admin-top-menu-overflow"]').text()).not.toContain('用户管理')
    expect(wrapper.find('[data-testid="admin-top-menu-overflow"]').text()).not.toContain('一级目录')
    expect(wrapper.find('[data-testid="admin-top-menu-overflow"]').text()).not.toContain('异常页')
  })

  it('uses the same top offset for regular and overflow top flyouts', async () => {
    mockTopMenuWidths({
      container: 240,
      overflow: 72,
      moreLeft: 260,
      items: {
        '/': 72,
        '/system': 96,
        '/demo': 96,
        '/permission': 96,
        '/exception': 88,
        '/overflow': 96,
      },
    })

    const wrapper = mount(AdminTopMenu, {
      props: {
        menus: overflowMenus(),
        currentPath: '/',
        activePaths: ['/'],
      },
      global: globalStubs(),
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    await wrapper.findAll('.va-admin-top-menu__item')[1].trigger('mouseenter')

    const regularStyle = wrapper.find('.va-admin-top-menu__flyout').attributes('style')

    await wrapper.find('[data-testid="admin-top-menu-more"]').trigger('mouseenter')

    expect(wrapper.find('.va-admin-top-menu__flyout').attributes('style')).toContain(regularStyle.match(/--va-admin-top-menu-flyout-top: [^;]+;/)?.[0] ?? '')
  })

  it('keeps the overflow flyout open when moving from more trigger into the flyout', async () => {
    mockTopMenuWidths({
      container: 240,
      overflow: 72,
      items: {
        '/': 72,
        '/system': 96,
        '/demo': 96,
        '/permission': 96,
        '/exception': 88,
        '/overflow': 96,
      },
    })

    const wrapper = mount(AdminTopMenu, {
      props: {
        menus: overflowMenus(),
        currentPath: '/permission',
        activePaths: ['/permission'],
      },
      global: globalStubs(),
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid="admin-top-menu-more"]').trigger('mouseenter')

    const flyout = wrapper.find('.va-admin-top-menu__flyout')
    expect(flyout.exists()).toBe(true)
    expect(flyout.text()).toContain('系统管理')

    await wrapper.find('[data-testid="admin-top-menu-more"]').trigger('mouseleave', {
      relatedTarget: flyout.element,
    })

    expect(wrapper.find('.va-admin-top-menu__flyout').exists()).toBe(true)

    await wrapper.find('[data-testid="admin-top-menu-more"]').trigger('mouseleave', {
      relatedTarget: document.body,
    })

    expect(wrapper.find('.va-admin-top-menu__flyout').exists()).toBe(false)
  })

  it('keeps the overflow flyout open when clicking the already-open more trigger', async () => {
    mockTopMenuWidths({
      container: 240,
      overflow: 72,
      items: {
        '/': 72,
        '/system': 96,
        '/demo': 96,
        '/permission': 96,
        '/exception': 88,
        '/overflow': 96,
      },
    })

    const wrapper = mount(AdminTopMenu, {
      props: {
        menus: overflowMenus(),
        currentPath: '/permission',
        activePaths: ['/permission'],
      },
      global: globalStubs(),
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const moreTrigger = wrapper.find('[data-testid="admin-top-menu-more"]')
    await moreTrigger.trigger('mouseenter')
    expect(wrapper.find('[data-testid="admin-top-menu-overflow"]').exists()).toBe(true)

    await moreTrigger.trigger('click')

    expect(wrapper.find('[data-testid="admin-top-menu-overflow"]').exists()).toBe(true)
  })

  it('renders top-level parent groups inside the overflow flyout without nested children', async () => {
    mockTopMenuWidths({
      container: 160,
      overflow: 72,
      items: {
        '/': 72,
        '/system': 96,
        '/demo': 96,
        '/permission': 96,
        '/exception': 88,
        '/overflow': 96,
      },
    })

    const wrapper = mount(AdminTopMenu, {
      props: {
        menus: overflowMenus(),
        currentPath: '/',
        activePaths: ['/'],
      },
      global: {
        ...globalStubs({ stubRouterLink: false }),
        plugins: [createMemoryRouter()],
      },
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid="admin-top-menu-more"]').trigger('mouseenter')
    const system = findSidebarItemByText(wrapper, '系统管理')

    expect(system?.attributes('href')).toBeUndefined()
    expect(wrapper.find('[data-testid="admin-top-menu-overflow"]').text()).not.toContain('用户管理')
  })

  it('closes the overflow flyout when moving from more trigger to a visible top menu', async () => {
    mockTopMenuWidths({
      container: 360,
      overflow: 72,
      items: {
        '/': 72,
        '/system': 96,
        '/demo': 96,
        '/permission': 96,
        '/exception': 88,
        '/overflow': 96,
      },
    })

    const wrapper = mount(AdminTopMenu, {
      props: {
        menus: overflowMenus(),
        currentPath: '/demo',
        activePaths: ['/demo'],
      },
      global: globalStubs(),
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const moreTrigger = wrapper.find('[data-testid="admin-top-menu-more"]')
    const demoTrigger = wrapper
      .findAll('.va-admin-top-menu__item')
      .find((item) => item.text().includes('多级示例'))

    expect(demoTrigger).toBeDefined()

    await moreTrigger.trigger('mouseenter')
    expect(wrapper.find('[data-testid="admin-top-menu-overflow"]').exists()).toBe(true)

    await moreTrigger.trigger('mouseleave', { relatedTarget: demoTrigger!.element })
    await demoTrigger!.trigger('mouseenter')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="admin-top-menu-overflow"]').exists()).toBe(false)
    expect(wrapper.find('.va-admin-top-menu__flyout').text()).toContain('一级目录')
  })

  it('realigns the overflow flyout after the top menu resizes while open', async () => {
    const widths = {
      container: 240,
      overflow: 72,
      moreLeft: 360,
      items: {
        '/': 72,
        '/system': 96,
        '/demo': 96,
        '/permission': 96,
        '/exception': 88,
        '/overflow': 96,
      },
    }
    mockTopMenuWidths(widths)

    const wrapper = mount(AdminTopMenu, {
      props: {
        menus: overflowMenus(),
        currentPath: '/permission',
        activePaths: ['/permission'],
      },
      global: globalStubs(),
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid="admin-top-menu-more"]').trigger('mouseenter')

    expect(wrapper.find('.va-admin-top-menu__flyout').attributes('style')).toContain('--va-admin-top-menu-flyout-left: 360px')

    widths.moreLeft = 280
    window.dispatchEvent(new Event('resize'))
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.va-admin-top-menu__flyout').attributes('style')).toContain('--va-admin-top-menu-flyout-left: 280px')
  })

  it('renders mixed mode with child sidebar and top-level header menu', () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        mode: 'mixed',
        currentPath: '/system/user',
        activePaths: ['/system', '/system/user'],
      }),
      global: globalStubs(),
    })

    expect(wrapper.find('.va-admin-layout--mixed').exists()).toBe(true)
    expect(wrapper.find('.va-admin-layout__desktop-sidebar').exists()).toBe(true)
    expect(wrapper.find('[data-testid="admin-sidebar-toggle"]').exists()).toBe(true)
    expect(wrapper.find('.va-admin-header .va-admin-top-menu').text()).toContain('系统管理')
    expect(wrapper.find('.va-admin-layout__desktop-sidebar').text()).not.toContain('控制台')
    expect(wrapper.find('.va-admin-layout__desktop-sidebar').text()).not.toContain('多级示例')
    expect(wrapper.find('.va-admin-layout__desktop-sidebar').text()).toContain('用户管理')
  })

  it('does not show top flyouts in mixed mode', async () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({ mode: 'mixed' }),
      global: globalStubs(),
    })

    await wrapper.findAll('.va-admin-top-menu__item')[1].trigger('mouseenter')

    expect(wrapper.find('.va-admin-top-menu__flyout').exists()).toBe(false)
  })

  it('navigates top menu parent groups in mixed mode to the first navigable child', async () => {
    const wrapper = mount(AdminTopMenu, {
      props: {
        menus: menus(),
        currentPath: '/',
        activePaths: ['/'],
        flyout: false,
      },
      global: globalStubs(),
    })

    await wrapper.findAll('.va-admin-top-menu__item')[1].trigger('click')

    expect(wrapper.emitted('navigate')).toEqual([['/system/user']])
  })

  it('renders only top-level overflow entries in mixed mode more menu', async () => {
    mockTopMenuWidths({
      container: 160,
      overflow: 72,
      items: {
        '/': 72,
        '/system': 96,
        '/demo': 96,
        '/permission': 96,
        '/exception': 88,
        '/overflow': 96,
      },
    })

    const wrapper = mount(AdminTopMenu, {
      props: {
        menus: overflowMenus(),
        currentPath: '/',
        activePaths: ['/'],
        flyout: false,
      },
      global: globalStubs(),
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid="admin-top-menu-more"]').trigger('mouseenter')

    expect(wrapper.find('[data-testid="admin-top-menu-overflow"]').text()).toContain('系统管理')
    expect(wrapper.find('[data-testid="admin-top-menu-overflow"]').text()).not.toContain('用户管理')
    expect(wrapper.find('[data-testid="admin-top-menu-overflow"]').text()).not.toContain('一级目录')
  })

  it('navigates overflow parent groups in mixed mode to the first navigable child', async () => {
    mockTopMenuWidths({
      container: 160,
      overflow: 72,
      items: {
        '/': 72,
        '/system': 96,
        '/demo': 96,
        '/permission': 96,
        '/exception': 88,
        '/overflow': 96,
      },
    })

    const wrapper = mount(AdminTopMenu, {
      props: {
        menus: overflowMenus(),
        currentPath: '/',
        activePaths: ['/'],
        flyout: false,
      },
      global: globalStubs(),
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid="admin-top-menu-more"]').trigger('mouseenter')
    await findFloatingMenuItemByText(wrapper, '超长菜单')?.trigger('click')

    expect(wrapper.emitted('navigate')).toEqual([['/overflow/item-1']])
  })

  it('falls back to the active root in mixed sidebar when it has no children', () => {
    mockViewport(false)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({
        mode: 'mixed',
        currentPath: '/',
        activePaths: ['/'],
      }),
      global: globalStubs(),
    })

    expect(wrapper.find('.va-admin-layout__desktop-sidebar').text()).toContain('控制台')
    expect(wrapper.find('.va-admin-layout__desktop-sidebar').text()).not.toContain('系统管理')
  })

  it('uses the mobile drawer layout regardless of top or mixed mode', async () => {
    mockViewport(true)

    const wrapper = mount(AdminLayout, {
      props: layoutProps({ mode: 'top' }),
      global: globalStubs(),
    })

    expect(wrapper.find('.va-admin-top-menu').exists()).toBe(false)
    expect(wrapper.find('[data-testid="admin-sidebar-toggle"]').exists()).toBe(true)

    await wrapper.find('[data-testid="admin-sidebar-toggle"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(document.body.querySelector('.va-admin-drawer-sidebar--open')).toBeTruthy()
  })
})

function mockViewport(mobile: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: mobile && query.includes('max-width'),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

function layoutProps(overrides: Record<string, unknown> = {}) {
  return {
    appName: 'Vela Admin',
    menus: menus(),
    activePaths: [],
    currentPath: '/',
    pageTitle: '控制台',
    ...overrides,
  }
}

function menus(): AdminMenuItem[] {
  return [
    {
      path: '/',
      title: '控制台',
      icon: 'view-dashboard-outline',
      order: 10,
      navigable: true,
      children: [],
    },
    {
      path: '/system',
      title: '系统管理',
      icon: 'cog-outline',
      order: 20,
      navigable: false,
      firstNavigableChildPath: '/system/user',
      children: [
        {
          path: '/system/user',
          title: '用户管理',
          order: 10,
          navigable: true,
          children: [],
        },
      ],
    },
    {
      path: '/demo',
      title: '多级示例',
      icon: 'format-list-bulleted',
      order: 30,
      navigable: false,
      children: [
        {
          path: '/demo/level1',
          title: '一级目录',
          order: 10,
          navigable: false,
          firstNavigableChildPath: '/demo/level1/level2/level3/leaf',
          children: [
            {
              path: '/demo/level1/level2',
              title: '二级目录',
              order: 10,
              navigable: false,
              firstNavigableChildPath: '/demo/level1/level2/level3/leaf',
              children: [
                {
                  path: '/demo/level1/level2/sibling',
                  title: '二级页面',
                  order: 10,
                  navigable: true,
                  children: [],
                },
                {
                  path: '/demo/level1/level2/level3',
                  title: '三级目录',
                  order: 20,
                  navigable: false,
                  firstNavigableChildPath: '/demo/level1/level2/level3/leaf',
                  children: [
                    {
                      path: '/demo/level1/level2/level3/sibling',
                      title: '三级页面',
                      order: 10,
                      navigable: true,
                      children: [],
                    },
                    {
                      path: '/demo/level1/level2/level3/leaf',
                      title: '四级页面',
                      order: 20,
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

function menusWithRolePage(): AdminMenuItem[] {
  const nextMenus = menus()

  nextMenus[1].children.push({
    path: '/system/role',
    title: '角色管理',
    order: 20,
    navigable: true,
    children: [],
  })

  return nextMenus
}

function overflowMenus(): AdminMenuItem[] {
  return [
    ...menus(),
    {
      path: '/permission',
      title: '权限按钮',
      icon: 'shield-account-outline',
      order: 40,
      navigable: true,
      children: [],
    },
    {
      path: '/exception',
      title: '异常页',
      icon: 'alert-circle-outline',
      order: 50,
      navigable: true,
      children: [],
    },
    {
      path: '/overflow',
      title: '超长菜单',
      icon: 'format-list-bulleted',
      order: 60,
      navigable: false,
      children: [
        {
          path: '/overflow/item-1',
          title: '超长菜单项 01',
          order: 10,
          navigable: true,
          children: [],
        },
      ],
    },
  ]
}

function mockTopMenuWidths(widths: {
  container: number
  overflow: number
  moreLeft?: number
  items: Record<string, number>
}) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function getBoundingClientRectMock() {
    const element = this as HTMLElement
    const path = element.dataset.menuPath

    if (element.classList.contains('va-admin-top-menu')) {
      return rectWithWidth(widths.container)
    }

    if (element.classList.contains('va-admin-top-menu__more')) {
      return {
        ...rectWithWidth(widths.overflow),
        x: widths.moreLeft ?? 0,
        left: widths.moreLeft ?? 0,
        right: (widths.moreLeft ?? 0) + widths.overflow,
        bottom: 56,
      }
    }

    if (element.classList.contains('va-admin-top-menu__item')) {
      return {
        ...rectWithWidth(path ? widths.items[path] ?? 0 : 0),
        bottom: 56,
      }
    }

    return rectWithWidth(0)
  })
}

function findSidebarItemByText(wrapper: ReturnType<typeof mount>, text: string) {
  return wrapper
    .findAll('.va-admin-sidebar-item')
    .find((item) => item.text().includes(text))
}

function findFloatingMenuItemByText(wrapper: ReturnType<typeof mount>, text: string) {
  return wrapper
    .findAll('.va-admin-floating-menu__item')
    .find((item) => item.text().includes(text))
}

function expectFloatingPanelPosition(wrapper: ReturnType<typeof mount>, level: number, left: string, top: string) {
  const style = wrapper.findAll('.va-admin-floating-menu__panel')[level].attributes('style')

  expect(style).toContain(`--va-admin-floating-menu-panel-left: ${left}`)
  expect(style).toContain(`--va-admin-floating-menu-panel-top: ${top}`)
}

function rectWithWidth(width: number): DOMRect {
  return {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: 0,
    width,
    height: 0,
    toJSON: () => ({}),
  }
}

function globalStubs(options: { stubRouterLink?: boolean } = {}) {
  const stubs: Record<string, unknown> = {
    RouterView: { template: '<main data-testid="router-view" />' },
    VaIcon: true,
    VarButton: {
      template: '<button type="button"><slot /></button>',
    },
    VarSpace: {
      template: '<div><slot /></div>',
    },
    VarSwitch: {
      props: ['modelValue'],
      emits: ['update:modelValue'],
      template: '<button v-bind="$attrs" type="button" @click="$emit(\'update:modelValue\', !modelValue)"><slot /></button>',
    },
    VarSlider: {
      props: ['modelValue'],
      emits: ['update:modelValue'],
      template: '<input v-bind="$attrs" type="range" :value="modelValue" @input="$emit(\'update:modelValue\', Number($event.target.value))" />',
    },
    VarPopup: {
      props: ['show'],
      emits: ['update:show'],
      template: '<div v-if="show" v-bind="$attrs"><slot /></div>',
    },
    VarSegmentedButtons: {
      props: ['modelValue', 'options'],
      emits: ['update:modelValue'],
      template: '<button v-bind="$attrs" type="button" @click="$emit(\'update:modelValue\', options?.[1]?.value ?? modelValue)"><slot />{{ options?.map((option) => option.label).join(\'\') }}</button>',
    },
    VarMenuSelect: {
      props: ['show', 'options'],
      emits: ['select', 'update:show'],
      template: '<div v-if="show" class="var-menu-select"><button v-for="option in options" :key="option.value" type="button" :disabled="option.disabled" @click="$emit(\'select\', option.value)">{{ option.label }}</button></div>',
    },
    VarBreadcrumbs: {
      template: '<nav data-testid="admin-header-breadcrumb"><slot /></nav>',
    },
    VarBreadcrumb: {
      template: '<span class="var-breadcrumb-item" @click="$emit(\'click\')"><slot /></span>',
    },
    VarMenu: {
      template: '<span class="var-menu"><slot /></span>',
    },
    VarTabs: {
      props: ['active'],
      emits: ['click'],
      template: '<div class="var-tabs" @click="$emit(\'click\', $event.target.closest(\'.va-admin-top-menu__item\')?.dataset?.menuPath)"><slot /><div class="var-tabs__indicator"><div class="var-tabs__indicator-inner" /></div></div>',
    },
    VarTab: {
      props: ['name'],
      template: '<div v-bind="$attrs" class="var-tab va-admin-top-menu__item" @mouseenter="$emit(\'mouseenter\', $event)" @mouseleave="$emit(\'mouseleave\', $event)" @focusin="$emit(\'focusin\', $event)" @click="$emit(\'click\', name)"><slot /></div>',
    },
    'var-tree-menu': {
      props: ['active', 'options', 'expandedValues'],
      emits: ['update:active', 'update:expandedValues', 'change'],
      template: `
          <div class="var-tree-menu" data-testid="admin-sidebar-tree-menu">
            <template v-for="option in options" :key="option.path">
              <button
                type="button"
                class="var-tree-menu__item"
                :data-path="option.path"
                :data-navigable="option.navigable ? 'true' : 'false'"
                @click="$emit('change', option.path, option)"
              >
                {{ option.title }}
              </button>
              <button
                v-for="child in option.children"
                :key="child.path"
                type="button"
                class="var-tree-menu__item"
                :data-path="child.path"
                :data-navigable="child.navigable ? 'true' : 'false'"
                @click="$emit('change', child.path, child)"
              >
                {{ child.title }}
              </button>
            </template>
          </div>
        `,
    },
  }

  if (options.stubRouterLink !== false) {
    stubs.RouterLink = RouterLinkStub
  }

  return {
    stubs,
  }
}

function createMemoryRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<main />' } },
      { path: '/system', component: { template: '<main />' } },
      { path: '/system/user', component: { template: '<main />' } },
      { path: '/demo', component: { template: '<main />' } },
      { path: '/demo/level1', component: { template: '<main />' } },
      { path: '/demo/level1/level2', component: { template: '<main />' } },
      { path: '/demo/level1/level2/level3', component: { template: '<main />' } },
      { path: '/demo/level1/level2/sibling', component: { template: '<main />' } },
      { path: '/demo/level1/level2/level3/sibling', component: { template: '<main />' } },
      { path: '/demo/level1/level2/level3/leaf', component: { template: '<main />' } },
      { path: '/permission', component: { template: '<main />' } },
      { path: '/exception', component: { template: '<main />' } },
      { path: '/overflow/item-1', component: { template: '<main />' } },
    ],
  })
}
