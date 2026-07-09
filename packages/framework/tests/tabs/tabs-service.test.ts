import { describe, expect, it } from 'vitest'

import { createTabsService } from '../../src/index'

describe('createTabsService', () => {
  it('adds route tabs, keeps fixed tabs, and avoids duplicates', () => {
    const service = createTabsService({
      homePath: '/',
      fixedTabs: [
        { path: '/', title: '控制台' },
      ],
    })

    service.addTab({ path: '/system/user', title: '用户管理' })
    service.addTab({ path: '/system/user', title: '用户管理' })
    service.addTab({ path: '/system/role', title: '角色管理' })

    expect(service.getTabs()).toMatchObject([
      { path: '/', title: '控制台', fixed: true },
      { path: '/system/user', title: '用户管理', fixed: false },
      { path: '/system/role', title: '角色管理', fixed: false },
    ])
  })

  it('does not replace a fixed tab title with a path fallback', () => {
    const service = createTabsService({
      homePath: '/',
      fixedTabs: [
        { path: '/', title: '控制台' },
      ],
    })

    service.addTab({ path: '/', title: '/' })

    expect(service.getTabs()[0]).toMatchObject({
      path: '/',
      title: '控制台',
      fixed: true,
    })
  })

  it('updates fixed state when adding an existing tab', () => {
    const service = createTabsService()

    service.addTab({ path: '/system/user', title: '用户管理' })
    service.addTab({ path: '/system/user', title: '用户管理', fixed: true, closable: false })

    expect(service.getTabs()[0]).toMatchObject({
      path: '/system/user',
      fixed: true,
      closable: false,
    })
    expect(service.closeAll()).toEqual([])

    service.addTab({ path: '/system/user', title: '用户管理', fixed: false, closable: true })

    expect(service.closeAll().map((tab) => tab.path)).toEqual(['/system/user'])
  })

  it('keeps user pinned tabs until they are explicitly unpinned', () => {
    const service = createTabsService({
      fixedTabs: [{ path: '/', title: '控制台' }],
    })

    service.addTab({ path: '/system/user', title: '用户管理' })
    service.addTab({ path: '/system/user', title: '用户管理', fixed: true, closable: true })

    expect(service.closeAll()).toEqual([])

    service.addTab({ path: '/system/user', title: '用户管理', fixed: false, closable: true })

    expect(service.closeAll().map((tab) => tab.path)).toEqual(['/system/user'])
    expect(service.getTabs().map((tab) => tab.path)).toEqual(['/'])
  })

  it('moves newly fixed tabs after the existing fixed tabs', () => {
    const service = createTabsService({
      fixedTabs: [{ path: '/', title: '控制台' }],
    })

    service.addTab({ path: '/system/user', title: '用户管理' })
    service.addTab({ path: '/system/role', title: '角色管理' })
    service.addTab({ path: '/system/role', title: '角色管理', fixed: true, closable: false })

    expect(service.getTabs().map((tab) => tab.path)).toEqual(['/', '/system/role', '/system/user'])
  })

  it('reorders fixed tabs only inside the fixed group', () => {
    const service = createTabsService({
      fixedTabs: [
        { path: '/', title: '控制台' },
        { path: '/system/user', title: '用户管理' },
      ],
    })
    service.addTab({ path: '/system/role', title: '角色管理' })

    expect(service.moveTab('/system/user', '/')).toEqual(true)
    expect(service.getTabs().map((tab) => tab.path)).toEqual(['/system/user', '/', '/system/role'])

    expect(service.moveTab('/', '/system/role')).toEqual(false)
    expect(service.getTabs().map((tab) => tab.path)).toEqual(['/system/user', '/', '/system/role'])
  })

  it('keeps route tabs after the fixed group when reordering', () => {
    const service = createTabsService({ fixedTabs: [{ path: '/', title: '控制台' }] })
    service.addTab({ path: '/system/user', title: '用户管理' })
    service.addTab({ path: '/system/role', title: '角色管理' })

    expect(service.moveTab('/system/role', '/')).toEqual(true)
    expect(service.getTabs().map((tab) => tab.path)).toEqual(['/', '/system/role', '/system/user'])
  })

  it('keeps route tabs after user pinned tabs when reordering', () => {
    const service = createTabsService({ fixedTabs: [{ path: '/', title: '控制台' }] })
    service.addTab({ path: '/system/user', title: '用户管理', fixed: true, closable: true })
    service.addTab({ path: '/system/role', title: '角色管理' })
    service.addTab({ path: '/demo/level1', title: '一级目录' })

    expect(service.moveTab('/demo/level1', '/system/user')).toEqual(true)
    expect(service.getTabs().map((tab) => tab.path)).toEqual([
      '/',
      '/system/user',
      '/demo/level1',
      '/system/role',
    ])
  })

  it('keeps user pinned tabs before route tabs when reordering', () => {
    const service = createTabsService({ fixedTabs: [{ path: '/', title: '控制台' }] })
    service.addTab({ path: '/system/user', title: '用户管理', fixed: true, closable: true })
    service.addTab({ path: '/system/role', title: '角色管理' })
    service.addTab({ path: '/demo/level1', title: '一级目录' })

    expect(service.moveTab('/system/user', '/demo/level1')).toEqual(false)
    expect(service.getTabs().map((tab) => tab.path)).toEqual([
      '/',
      '/system/user',
      '/system/role',
      '/demo/level1',
    ])
  })

  it('preserves fixed state when adding an existing tab without fixed metadata', () => {
    const service = createTabsService()

    service.addTab({ path: '/system/user', title: '用户管理', fixed: true, closable: false })
    service.addTab({ path: '/system/user', title: '用户管理' })

    expect(service.getTabs()[0]).toMatchObject({
      fixed: true,
      closable: false,
    })
  })

  it('closes current, other, left, right, and all tabs while preserving fixed tabs', () => {
    const service = createTabsService({
      homePath: '/',
      fixedTabs: [{ path: '/', title: '控制台' }],
    })

    service.addTab({ path: '/system/user', title: '用户管理' })
    service.addTab({ path: '/system/role', title: '角色管理' })
    service.addTab({ path: '/demo/level1', title: '一级目录' })

    expect(service.closeLeft('/system/role').map((tab) => tab.path)).toEqual(['/system/user'])
    expect(service.getTabs().map((tab) => tab.path)).toEqual(['/', '/system/role', '/demo/level1'])

    expect(service.closeRight('/system/role').map((tab) => tab.path)).toEqual(['/demo/level1'])
    expect(service.getTabs().map((tab) => tab.path)).toEqual(['/', '/system/role'])

    service.addTab({ path: '/system/user', title: '用户管理' })
    expect(service.closeOthers('/system/user').map((tab) => tab.path)).toEqual(['/system/role'])
    expect(service.getTabs().map((tab) => tab.path)).toEqual(['/', '/system/user'])

    expect(service.closeCurrent('/system/user')?.path).toBe('/system/user')
    expect(service.getTabs().map((tab) => tab.path)).toEqual(['/'])

    service.addTab({ path: '/system/user', title: '用户管理' })
    service.addTab({ path: '/system/role', title: '角色管理' })
    expect(service.closeAll().map((tab) => tab.path)).toEqual(['/system/user', '/system/role'])
    expect(service.getTabs().map((tab) => tab.path)).toEqual(['/'])
  })
})
