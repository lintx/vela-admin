import { createApp, defineComponent, h, nextTick } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  useRoute,
} from 'vue-router'
import { describe, expect, it, vi } from 'vitest'

import {
  createPermissionService,
  createSettingsService,
  mergeAdminConfig,
  useAdminTabs,
  type AdminTabsController,
} from '../../src/index'

const routes = [
  { path: '/', component: { render: () => h('main') }, meta: { title: '控制台' } },
  {
    path: '/system/user',
    component: { render: () => h('main') },
    meta: { title: '用户管理', permission: 'system:user:list' },
  },
  {
    path: '/system/role',
    component: { render: () => h('main') },
    meta: { title: '角色管理', permission: 'system:role:list' },
  },
  { path: '/reports', component: { render: () => h('main') }, meta: { title: '报表' } },
  {
    path: '/secret',
    component: { render: () => h('main') },
    meta: { title: '机密', permission: 'secret:view' },
  },
  {
    path: '/missing',
    component: { render: () => h('main') },
    meta: { title: '无权', permission: 'missing:view' },
  },
]

interface HarnessOptions {
  resolveScroller?: () => HTMLElement | null
  requestFrame?: (callback: FrameRequestCallback) => number
}

async function createHarness(initialPath = '/', options: HarnessOptions = {}) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  const settings = createSettingsService({
    config: mergeAdminConfig({
      homePath: '/',
      settings: { persist: false },
      tabs: {
        fixedTabs: [
          { path: '/system/user', title: '用户管理' },
          { path: '/missing', title: '无效标签' },
          { path: '/secret', title: '无权标签' },
        ],
      },
    }),
    storage: undefined,
  })
  const permission = createPermissionService({
    session: {
      token: 'token',
      permissions: ['system:user:list', 'system:role:list'],
    },
  })

  await router.push(initialPath)
  await router.isReady()

  let controller: AdminTabsController
  const root = defineComponent({
    setup() {
      controller = useAdminTabs({
        router,
        route: useRoute(),
        settings,
        permission,
        ...options,
      })
      return () => h('main')
    },
  })
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(root)
  app.use(router)
  app.mount(host)
  await nextTick()

  return {
    app,
    host,
    router,
    settings,
    controller: controller!,
  }
}

async function disposeHarness(harness: Awaited<ReturnType<typeof createHarness>>) {
  harness.controller.dispose()
  harness.app.unmount()
  harness.host.remove()
  await harness.settings.dispose()
}

async function flushNavigation() {
  await nextTick()
  await Promise.resolve()
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('useAdminTabs', () => {
  it('restores accessible fixed tabs and navigates to the nearest tab when closing current', async () => {
    const harness = await createHarness()

    expect(harness.controller.tabs.value.map(tab => tab.path)).toEqual(['/', '/system/user'])

    await harness.router.push('/system/role')
    await flushNavigation()
    harness.controller.closeTab('/system/role')
    await flushNavigation()

    expect(harness.router.currentRoute.value.path).toBe('/system/user')
    await disposeHarness(harness)
  })

  it('reconciles replaced fixed settings without removing dynamic tabs or writing settings back', async () => {
    const harness = await createHarness('/system/role')
    const remoteFixedTabs = [
      { path: '/reports', title: '远端报表' },
      { path: '/system/role', title: '远端角色' },
      { path: '/secret', title: '无权标签' },
    ]

    harness.settings.updateSettings({ tabs: { fixedTabs: remoteFixedTabs } })
    await nextTick()

    expect(harness.controller.tabs.value).toMatchObject([
      { path: '/', fixed: true },
      { path: '/reports', fixed: true },
      { path: '/system/role', fixed: true },
      { path: '/system/user', fixed: false },
    ])
    expect(harness.settings.getSettings().tabs?.fixedTabs).toEqual(remoteFixedTabs)
    await disposeHarness(harness)
  })

  it('uses the nearest left fixed tab after closing all route tabs', async () => {
    const harness = await createHarness('/system/role')

    expect(harness.controller.tabs.value.map(tab => tab.path)).toEqual(['/', '/system/user', '/system/role'])
    harness.controller.closeAllTabs()
    await flushNavigation()

    expect(harness.router.currentRoute.value.path).toBe('/system/user')
    expect(harness.controller.tabs.value.map(tab => tab.path)).toEqual(['/', '/system/user'])
    await disposeHarness(harness)
  })

  it('keeps the current tab and cache when close navigation is aborted', async () => {
    const harness = await createHarness('/system/role')
    const cacheKey = harness.controller.getRouteCacheKey(harness.router.currentRoute.value)
    const removeGuard = harness.router.beforeEach(to => to.path === '/system/user' ? false : true)

    harness.controller.closeTab('/system/role')
    await flushNavigation()

    expect(harness.router.currentRoute.value.path).toBe('/system/role')
    expect(harness.controller.tabs.value.map(tab => tab.path)).toEqual(['/', '/system/user', '/system/role'])
    expect(harness.controller.getRouteCacheKey(harness.router.currentRoute.value)).toBe(cacheKey)
    removeGuard()
    await disposeHarness(harness)
  })

  it('keeps all tabs when batch-close navigation is aborted', async () => {
    const harness = await createHarness('/system/role')
    const removeGuard = harness.router.beforeEach(to => to.path === '/system/user' ? false : true)

    harness.controller.closeAllTabs()
    await flushNavigation()

    expect(harness.router.currentRoute.value.path).toBe('/system/role')
    expect(harness.controller.tabs.value.map(tab => tab.path)).toEqual(['/', '/system/user', '/system/role'])
    removeGuard()
    await disposeHarness(harness)
  })

  it('keeps tabs and consumes rejected close navigation', async () => {
    const harness = await createHarness('/system/role')
    const push = vi.spyOn(harness.router, 'push').mockRejectedValueOnce(new Error('navigation rejected'))

    harness.controller.closeTab('/system/role')
    await flushNavigation()

    expect(harness.controller.tabs.value.map(tab => tab.path)).toEqual(['/', '/system/user', '/system/role'])
    push.mockRestore()
    await disposeHarness(harness)
  })

  it('keeps the closing tab when navigation is redirected elsewhere', async () => {
    const harness = await createHarness('/system/role')
    const removeGuard = harness.router.beforeEach(to => to.path === '/system/user' ? '/reports' : true)

    harness.controller.closeTab('/system/role')
    await flushNavigation()

    expect(harness.router.currentRoute.value.path).toBe('/reports')
    expect(harness.controller.tabs.value.map(tab => tab.path)).toContain('/system/role')
    removeGuard()
    await disposeHarness(harness)
  })

  it('invalidates a slow close when a newer synchronous close starts', async () => {
    const harness = await createHarness('/system/role')
    let releaseGuard: (() => void) | undefined
    const removeGuard = harness.router.beforeEach(to => to.path === '/system/user'
      ? new Promise<boolean>((resolve) => {
          releaseGuard = () => resolve(true)
        })
      : true)

    harness.controller.closeTab('/system/role')
    await flushNavigation()
    expect(releaseGuard).toBeTypeOf('function')
    harness.controller.closeOtherTabs('/system/role')
    releaseGuard?.()
    await flushNavigation()

    expect(harness.controller.tabs.value.map(tab => tab.path)).toContain('/system/role')
    removeGuard()
    await disposeHarness(harness)
  })

  it('freezes batch-close paths while navigation is pending', async () => {
    const harness = await createHarness('/reports')
    const originalPush = harness.router.push.bind(harness.router)
    let resolveCloseNavigation: (() => void) | undefined
    const closeNavigation = new Promise<void>((resolve) => {
      resolveCloseNavigation = resolve
    })
    const push = vi.spyOn(harness.router, 'push').mockReturnValueOnce(closeNavigation)

    harness.controller.closeAllTabs()
    harness.controller.pinTab('/reports')
    await originalPush('/system/role')
    await flushNavigation()
    await originalPush('/system/user')
    await flushNavigation()
    resolveCloseNavigation?.()
    await flushNavigation()

    expect(harness.controller.tabs.value).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: '/reports', fixed: true }),
      expect.objectContaining({ path: '/system/role', fixed: false }),
    ]))
    push.mockRestore()
    await disposeHarness(harness)
  })

  it('keeps the target route when closing other tabs removes the current route', async () => {
    const harness = await createHarness('/system/role')
    await harness.router.push('/reports')
    await flushNavigation()

    harness.controller.closeOtherTabs('/system/role')
    await flushNavigation()

    expect(harness.router.currentRoute.value.path).toBe('/system/role')
    expect(harness.controller.tabs.value.map(tab => tab.path)).toEqual(['/', '/system/user', '/system/role'])
    await disposeHarness(harness)
  })

  it('closes tabs on the requested side and navigates when the current route is removed', async () => {
    const harness = await createHarness('/system/role')
    await harness.router.push('/reports')
    await flushNavigation()

    harness.controller.closeLeftTabs('/reports')
    expect(harness.controller.tabs.value.map(tab => tab.path)).toEqual(['/', '/system/user', '/reports'])
    expect(harness.router.currentRoute.value.path).toBe('/reports')

    await harness.router.push('/system/role')
    await flushNavigation()
    harness.controller.closeRightTabs('/system/user')
    await flushNavigation()

    expect(harness.router.currentRoute.value.path).toBe('/system/user')
    expect(harness.controller.tabs.value.map(tab => tab.path)).toEqual(['/', '/system/user'])
    await disposeHarness(harness)
  })

  it('persists pin and reorder changes as fixed tabs without the home tab', async () => {
    const harness = await createHarness('/system/role')

    harness.controller.pinTab('/system/role')
    harness.controller.reorderTab('/system/role', '/system/user')

    expect(harness.settings.getSettings().tabs?.fixedTabs).toEqual([
      { path: '/system/role', title: '角色管理' },
      { path: '/system/user', title: '用户管理' },
    ])
    await disposeHarness(harness)
  })

  it('refreshes route cache keys and restores scroll position on the next frame', async () => {
    const scroller = document.createElement('main')
    let frameCallback: FrameRequestCallback | undefined
    const harness = await createHarness('/system/user', {
      resolveScroller: () => scroller,
      requestFrame: callback => {
        frameCallback = callback
        return 1
      },
    })
    const controller = harness.controller

    scroller.scrollTop = 320
    scroller.scrollLeft = 12
    controller.saveScroll('/system/user')
    scroller.scrollTop = 0
    scroller.scrollLeft = 0
    controller.restoreScroll('/system/user')
    await nextTick()
    frameCallback?.(0)

    expect(scroller.scrollTop).toBe(320)
    expect(scroller.scrollLeft).toBe(12)

    const before = controller.getRouteCacheKey(harness.router.currentRoute.value)
    controller.refreshTab('/system/user')
    expect(controller.getRouteCacheKey(harness.router.currentRoute.value)).not.toBe(before)

    await disposeHarness(harness)
  })

  it('does not save or restore scroll when tags view is disabled', async () => {
    const scroller = document.createElement('main')
    let frameCallback: FrameRequestCallback | undefined
    const harness = await createHarness('/system/user', {
      resolveScroller: () => scroller,
      requestFrame: callback => {
        frameCallback = callback
        return 1
      },
    })
    harness.settings.updateSettings({ layout: { tagsView: false } })

    scroller.scrollTop = 320
    harness.controller.saveScroll('/system/user')
    scroller.scrollTop = 0
    harness.controller.restoreScroll('/system/user')
    await nextTick()
    frameCallback?.(0)

    expect(scroller.scrollTop).toBe(0)
    await disposeHarness(harness)
  })

  it('respects an explicit scroller resolver that currently returns null', async () => {
    const fallbackScroller = document.createElement('main')
    let frameCallback: FrameRequestCallback | undefined
    fallbackScroller.id = 'va-admin-main'
    fallbackScroller.scrollTop = 320
    document.body.appendChild(fallbackScroller)
    const harness = await createHarness('/system/user', {
      resolveScroller: () => null,
      requestFrame: callback => {
        frameCallback = callback
        return 1
      },
    })

    harness.controller.saveScroll('/system/user')
    fallbackScroller.scrollTop = 0
    harness.controller.restoreScroll('/system/user')
    await nextTick()
    frameCallback?.(0)

    expect(fallbackScroller.scrollTop).toBe(0)
    fallbackScroller.remove()
    await disposeHarness(harness)
  })

  it('ignores a stale scroll restore callback after a newer restore', async () => {
    const scroller = document.createElement('main')
    const frameCallbacks: FrameRequestCallback[] = []
    const harness = await createHarness('/system/user', {
      resolveScroller: () => scroller,
      requestFrame: callback => {
        frameCallbacks.push(callback)
        return frameCallbacks.length
      },
    })
    scroller.scrollTop = 100
    harness.controller.saveScroll('/system/user')
    scroller.scrollTop = 200
    harness.controller.saveScroll('/reports')
    scroller.scrollTop = 0

    harness.controller.restoreScroll('/system/user')
    await nextTick()
    harness.controller.restoreScroll('/reports')
    await nextTick()
    frameCallbacks[1]?.(0)
    frameCallbacks[0]?.(0)

    expect(scroller.scrollTop).toBe(200)
    await disposeHarness(harness)
  })

  it('ignores a pending scroll restore callback after dispose', async () => {
    const scroller = document.createElement('main')
    let frameCallback: FrameRequestCallback | undefined
    const harness = await createHarness('/system/user', {
      resolveScroller: () => scroller,
      requestFrame: callback => {
        frameCallback = callback
        return 1
      },
    })
    scroller.scrollTop = 180
    harness.controller.saveScroll('/system/user')
    scroller.scrollTop = 0

    harness.controller.restoreScroll('/system/user')
    await nextTick()
    harness.controller.dispose()
    frameCallback?.(0)

    expect(scroller.scrollTop).toBe(0)
    harness.app.unmount()
    harness.host.remove()
    await harness.settings.dispose()
  })

  it('stops route synchronization after dispose and supports maximize restore', async () => {
    const harness = await createHarness('/')
    harness.controller.maximize()
    expect(harness.controller.maximized.value).toBe(true)
    harness.controller.restore()
    expect(harness.controller.maximized.value).toBe(false)

    harness.controller.dispose()
    await harness.router.push('/reports')
    await flushNavigation()

    expect(harness.controller.tabs.value.map(tab => tab.path)).toEqual(['/', '/system/user'])
    harness.app.unmount()
    harness.host.remove()
    await harness.settings.dispose()
  })
})
