import { defineComponent, h, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'

import { mockAuthInjectionKey } from '../../../../examples/admin/src/mock-auth'
import LoginPage from '../../../../examples/admin/src/pages/login.vue'

describe('example login page', () => {
  it('handles the Varlet form submit payload without treating it as a native event', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { render: () => h('main') } },
        { path: '/login', component: { render: () => h('main') } },
      ],
    })
    await router.push('/login')
    await router.isReady()

    const login = vi.fn()
    const wrapper = mount(LoginPage, {
      global: {
        plugins: [router],
        provide: {
          [mockAuthInjectionKey]: {
            accounts: [],
            session: ref(null),
            login,
          },
        },
        stubs: {
          VarForm: defineComponent({
            emits: ['submit'],
            setup(_, { emit, slots }) {
              return () => h('form', {
                onSubmit(event: SubmitEvent) {
                  event.preventDefault()
                  emit('submit', true)
                },
              }, slots.default?.())
            },
          }),
          VarInput: defineComponent({ template: '<input />' }),
          VarButton: defineComponent({
            inheritAttrs: false,
            setup(_, { attrs, slots }) {
              return () => h('button', {
                ...attrs,
                type: 'submit',
                onClick(event: MouseEvent) {
                  const listener = attrs.onClick
                  if (typeof listener === 'function') {
                    listener(event)
                  }
                  ;(event.currentTarget as HTMLButtonElement).form?.dispatchEvent(new SubmitEvent('submit', {
                    bubbles: true,
                    cancelable: true,
                    submitter: event.currentTarget as HTMLButtonElement,
                  }))
                },
              }, slots.default?.())
            },
          }),
          VarSpace: defineComponent({ template: '<div><slot /></div>' }),
          VarChip: defineComponent({ template: '<span><slot /></span>' }),
          VarRow: defineComponent({ template: '<div><slot /></div>' }),
          VarCol: defineComponent({ template: '<div><slot /></div>' }),
          VarCell: defineComponent({ template: '<div><slot name="icon" /><slot /></div>' }),
          VaIcon: defineComponent({ template: '<span />' }),
        },
      },
    })

    await expect(wrapper.find('.admin-login__submit').trigger('click')).resolves.toBeUndefined()
    await flushPromises()

    expect(login).toHaveBeenCalledTimes(1)
    expect(login).toHaveBeenCalledWith({ username: 'admin', password: 'admin123' })
    expect(router.currentRoute.value.path).toBe('/')
    wrapper.unmount()
  })
})
