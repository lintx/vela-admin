import { createApp, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'

import {
  createPermissionGuard,
  createPermissionService,
  permissionDirective,
  providePermission,
  usePermission,
} from '../../src/index'

describe('createPermissionService', () => {
  it('tracks login state, roles and permissions', () => {
    const service = createPermissionService()

    expect(service.isLoggedIn()).toBe(false)
    expect(service.hasPermission()).toBe(true)
    expect(service.hasRole()).toBe(true)

    service.setSession({
      token: 'token',
      roles: ['admin', 'editor'],
      permissions: ['system:user:list', 'system:user:add'],
    })

    expect(service.isLoggedIn()).toBe(true)
    expect(service.hasPermission('system:user:list')).toBe(true)
    expect(service.hasPermission(['system:user:list', 'system:user:delete'], 'any')).toBe(true)
    expect(service.hasPermission(['system:user:list', 'system:user:delete'], 'all')).toBe(false)
    expect(service.hasRole(['admin', 'auditor'], 'any')).toBe(true)
    expect(service.hasRole(['admin', 'auditor'], 'all')).toBe(false)

    service.clearSession()

    expect(service.isLoggedIn()).toBe(false)
    expect(service.hasPermission('system:user:list')).toBe(false)
  })
})

describe('permissionDirective', () => {
  it('removes unauthorized elements by default', () => {
    const service = createPermissionService()
    const host = document.createElement('div')
    const button = document.createElement('button')
    host.append(button)

    permissionDirective(service).mounted(button, {
      value: 'system:user:add',
      modifiers: {},
    } as never)

    expect(host.contains(button)).toBe(false)
  })

  it('disables unauthorized elements when configured', () => {
    const service = createPermissionService({ unauthorizedBehavior: 'disable' })
    const button = document.createElement('button')

    permissionDirective(service).mounted(button, {
      value: 'system:user:add',
      modifiers: {},
    } as never)

    expect(button.hasAttribute('disabled')).toBe(true)
    expect(button.getAttribute('aria-disabled')).toBe('true')
  })

  it('uses any modifier for permission arrays', () => {
    const service = createPermissionService()
    service.setSession({
      roles: [],
      permissions: ['system:user:edit'],
    })
    const host = document.createElement('div')
    const button = document.createElement('button')
    host.append(button)

    permissionDirective(service).mounted(button, {
      value: ['system:user:add', 'system:user:edit'],
      modifiers: { any: true },
    } as never)

    expect(host.contains(button)).toBe(true)
  })
})

describe('createPermissionGuard', () => {
  it('redirects unauthenticated protected routes to login and unauthorized routes to 403', async () => {
    const service = createPermissionService()
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/login', component: { template: '<main />' } },
        { path: '/403', component: { template: '<main />' } },
        { path: '/users', component: { template: '<main />' }, meta: { permission: 'system:user:list' } },
      ],
    })

    router.beforeEach(createPermissionGuard(service, {
      loginPath: '/login',
      forbiddenPath: '/403',
    }))

    await router.push('/users')
    expect(router.currentRoute.value.path).toBe('/login')

    service.setSession({
      token: 'token',
      roles: [],
      permissions: [],
    })

    await router.push('/users')
    expect(router.currentRoute.value.path).toBe('/403')
  })
})

describe('usePermission', () => {
  it('injects the permission service provided by the app', () => {
    const service = createPermissionService()
    let injected = null
    const app = createApp({
      setup() {
        providePermission(service)
        return () => h(Child)
      },
    })
    const Child = {
      setup() {
        injected = usePermission()
        return () => null
      },
    }

    app.mount(document.createElement('div'))

    expect(injected).toBe(service)
  })
})
