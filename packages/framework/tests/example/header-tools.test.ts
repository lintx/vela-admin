import { defineComponent, h, ref, type ComponentPublicInstance } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { mockAuthInjectionKey } from '../../../../examples/admin/src/mock-auth'
import AppHeaderTools from '../../../../examples/admin/src/components/AppHeaderTools.vue'

interface AppHeaderToolsExposed {
  closeMenus(): void
}

type AppHeaderToolsWrapper = VueWrapper<ComponentPublicInstance & AppHeaderToolsExposed>

describe('example header tools', () => {
  const mountedWrappers: VueWrapper[] = []

  afterEach(() => {
    mountedWrappers.splice(0).forEach(wrapper => wrapper.unmount())
    vi.restoreAllMocks()
  })

  async function mountHeader(props = {}) {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { render: () => h('main') } },
        { path: '/system/user', component: { render: () => h('main') } },
        { path: '/permission/button', component: { render: () => h('main') } },
        { path: '/login', component: { render: () => h('main') } },
      ],
    })
    await router.push('/')
    await router.isReady()

    const auth = {
      session: ref({ user: { name: '管理员', title: '系统管理员' } }),
      logout: vi.fn(),
    }
    const wrapper = mount(AppHeaderTools, {
      props: {
        layoutMode: 'side',
        themeMode: 'light',
        ...props,
      },
      global: {
        plugins: [router],
        provide: {
          [mockAuthInjectionKey]: auth,
        },
        stubs: {
          VaIcon: defineComponent({
            props: { name: String },
            template: '<span class="va-icon-stub" :data-name="name"><slot /></span>',
          }),
          VarButton: defineComponent({
            inheritAttrs: false,
            emits: ['click'],
            setup(_, { attrs, emit, slots }) {
              return () => h('button', {
                ...attrs,
                type: 'button',
                onClick: (event: Event) => emit('click', event),
              }, slots.default?.())
            },
          }),
          VarMenu: defineComponent({
            props: { show: Boolean },
            emits: ['update:show', 'open'],
            setup(props, { emit, slots }) {
              const open = () => {
                emit('update:show', true)
                emit('open')
              }

              return () => h('div', { class: 'var-menu-stub', onClick: open }, [
                slots.default?.(),
                props.show ? h('div', { class: 'var-menu-stub__content' }, slots.menu?.()) : null,
              ])
            },
          }),
          VarBadge: defineComponent({
            inheritAttrs: false,
            props: { hidden: Boolean, value: [String, Number] },
            setup(props, { attrs, slots }) {
              return () => props.hidden
                ? h('span', slots.default?.())
                : h('span', { ...attrs, 'data-testid': attrs['data-testid'] }, [
                    h('span', { class: 'var-badge-stub__value' }, String(props.value ?? '')),
                    slots.default?.(),
                  ])
            },
          }),
          VarList: defineComponent({ setup(_, { slots }) { return () => h('div', slots.default?.()) } }),
          VarCell: defineComponent({
            inheritAttrs: false,
            props: { title: String, description: String },
            emits: ['click', 'keydown'],
            setup(props, { attrs, emit, slots }) {
              return () => h('button', {
                ...attrs,
                type: 'button',
                onClick: (event: Event) => emit('click', event),
                onKeydown: (event: KeyboardEvent) => emit('keydown', event),
              }, [slots.icon?.(), h('span', props.title), props.description ? h('small', props.description) : null])
            },
          }),
          VarDivider: defineComponent({ template: '<hr />' }),
        },
      },
    })
    const headerWrapper = wrapper as unknown as AppHeaderToolsWrapper
    mountedWrappers.push(headerWrapper)
    return { wrapper: headerWrapper, router, auth }
  }

  it('renders notification and user tools and marks notifications read through menu slots', async () => {
    const { wrapper } = await mountHeader()

    expect(wrapper.text()).toContain('通知')
    expect(wrapper.text()).toContain('GitHub')
    expect(wrapper.text()).toContain('管理员')

    await wrapper.find('[aria-label="打开通知"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="mark-all-notifications-read"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="unread-notification-count"]').exists()).toBe(true)

    await wrapper.find('[data-testid="mark-all-notifications-read"]').trigger('click')
    expect(wrapper.find('[data-testid="unread-notification-count"]').exists()).toBe(false)
  })

  it('emits theme and layout actions and exposes a menu close operation', async () => {
    let themeEvent: MouseEvent | undefined
    let themeEventCurrentTarget: EventTarget | null = null
    const { wrapper } = await mountHeader({
      onToggleThemeMode(event: MouseEvent) {
        themeEvent = event
        themeEventCurrentTarget = event.currentTarget
      },
    })

    const themeButton = wrapper.find('[data-testid="header-theme-toggle"]')
    await themeButton.trigger('click')
    await wrapper.find('[data-testid="header-layout-toggle"]').trigger('click')

    expect(wrapper.emitted('toggleThemeMode')).toHaveLength(1)
    expect(themeEvent).toBeInstanceOf(MouseEvent)
    expect(themeEventCurrentTarget).toBe(themeButton.element)
    expect(wrapper.emitted('update:layoutMode')).toEqual([['top']])

    await wrapper.find('[aria-label="打开通知"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.var-menu-stub__content').exists()).toBe(true)
    wrapper.vm.closeMenus()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.var-menu-stub__content').exists()).toBe(false)
  })
})
