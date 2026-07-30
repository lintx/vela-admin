import { describe, expect, it, vi } from 'vitest'

import {
  createAdminApp,
  defaultAdminConfig,
  defineAdminConfig,
  mergeAdminConfig,
} from '../../src/index'
import { createMemoryHistory, createRouter } from 'vue-router'

describe('defineAdminConfig and mergeAdminConfig', () => {
  it('keeps config object identity for JavaScript users while preserving type inference', () => {
    const config = {
      appName: 'Example Admin',
      homePath: '/dashboard',
      loginPath: '/login',
    }

    expect(defineAdminConfig(config)).toBe(config)
  })

  it('merges user layout and theme options with framework defaults', () => {
    const config = mergeAdminConfig({
      appName: 'Example Admin',
      layout: {
        sidebarWidth: 300,
        tagsView: false,
      },
      theme: {
        base: 'md3Dark',
        persist: false,
      },
    })

    expect(config.appName).toBe('Example Admin')
    expect(config.homePath).toBe(defaultAdminConfig.homePath)
    expect(config.layout.sidebarWidth).toBe(300)
    expect(config.layout.sidebarCollapsedWidth).toBe(56)
    expect(config.layout.tagsView).toBe(false)
    expect(config.theme.base).toBe('md3Dark')
    expect(config.theme.persist).toBe(false)
  })
})

describe('createAdminApp', () => {
  it('creates a Vue app and installs provided plugins before returning it', () => {
    const install = vi.fn()
    const root = { template: '<main />' }

    const app = createAdminApp({
      root,
      config: defineAdminConfig({ appName: 'Example Admin' }),
      plugins: [{ install }],
    })

    expect(app.config.globalProperties.$admin.config.appName).toBe('Example Admin')
    expect(app.config.globalProperties.$admin.settings.getSettings().appName).toBe('Example Admin')
    expect(install).toHaveBeenCalledTimes(1)
  })

  it('installs the provided router before returning the app', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<main />' } }],
    })

    const app = createAdminApp({
      root: { template: '<router-view />' },
      router,
    })

    expect(app.config.globalProperties.$router).toBe(router)
  })
})
