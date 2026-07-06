import { describe, expect, it } from 'vitest'
import type { RouteRecordRaw } from 'vue-router'

import {
  createMenuService,
  createPermissionService,
  searchAdminMenus,
} from '../../src/index'

describe('createMenuService', () => {
  it('creates a nested menu tree from route meta and filters unauthorized entries', () => {
    const permission = createPermissionService({
      session: {
        token: 'token',
        permissions: ['dashboard:view', 'system:user:list'],
        roles: [],
      },
    })
    const service = createMenuService({
      routes: routes(),
      permission,
    })

    expect(service.getMenus()).toMatchObject([
      {
        path: '/',
        title: '控制台',
      },
      {
        path: '/system',
        title: '系统管理',
        children: [
          {
            path: '/system/user',
            title: '用户管理',
          },
        ],
      },
    ])
  })

  it('creates menu-only parents from meta records and marks parents as non-navigable', () => {
    const service = createMenuService({
      routes: [
        route('/', '控制台', { icon: 'view-dashboard-outline', order: 10 }),
        route('/demo/level1/leaf', '四级页面', { order: 10 }),
      ],
      menuMeta: [
        menuMeta('/demo', '多级示例', { icon: 'format-list-bulleted', order: 30 }),
        menuMeta('/demo/level1', '一级目录', { order: 10 }),
      ],
    })

    expect(service.getMenus()).toMatchObject([
      {
        path: '/',
        title: '控制台',
        navigable: true,
      },
      {
        path: '/demo',
        title: '多级示例',
        navigable: false,
        children: [
          {
            path: '/demo/level1',
            title: '一级目录',
            navigable: false,
            children: [
              {
                path: '/demo/level1/leaf',
                title: '四级页面',
                navigable: true,
              },
            ],
          },
        ],
      },
    ])
  })

  it('keeps parents with children non-navigable even when a same-path page exists', () => {
    const service = createMenuService({
      routes: [
        route('/system', '系统管理', { icon: 'cog-outline', order: 20 }),
        route('/system/user', '用户管理', { order: 10 }),
        route('/system/role', '角色管理', { order: 20 }),
      ],
      menuMeta: [
        menuMeta('/system', '系统管理', { icon: 'cog-outline', order: 20 }),
      ],
    })

    expect(service.getMenus()).toMatchObject([
      {
        path: '/system',
        title: '系统管理',
        navigable: false,
        firstNavigableChildPath: '/system/user',
        children: [
          {
            path: '/system/user',
            navigable: true,
          },
          {
            path: '/system/role',
            navigable: true,
          },
        ],
      },
    ])
  })

  it('computes active paths for nested and dynamic routes', () => {
    const service = createMenuService({ routes: routes() })

    expect(service.getActivePaths('/system/user/42')).toEqual([
      '/system',
      '/system/user',
      '/system/user/:id',
    ])
  })

  it('reports first-level menus without icons', () => {
    const service = createMenuService({
      routes: [
        route('/reports', '报表中心'),
      ],
    })

    expect(service.getDiagnostics()).toEqual([
      {
        code: 'MISSING_TOP_LEVEL_ICON',
        message: 'Top-level menu "/reports" should define an icon.',
        path: '/reports',
      },
    ])
  })
})

describe('searchAdminMenus', () => {
  it('searches visible menus and excludes unauthorized results', () => {
    const permission = createPermissionService({
      session: {
        token: 'token',
        permissions: ['system:user:list'],
        roles: [],
      },
    })
    const service = createMenuService({
      routes: routes(),
      permission,
    })

    expect(searchAdminMenus(service.getMenus(), '用户')).toEqual([
      expect.objectContaining({
        path: '/system/user',
        title: '用户管理',
      }),
    ])
    expect(searchAdminMenus(service.getMenus(), '角色')).toEqual([])
  })

  it('does not return menu-only parent groups as navigable search results', () => {
    const service = createMenuService({
      routes: [
        route('/demo/level1/leaf', '四级页面'),
      ],
      menuMeta: [
        menuMeta('/demo', '多级示例', { icon: 'format-list-bulleted' }),
        menuMeta('/demo/level1', '一级目录'),
      ],
    })

    expect(searchAdminMenus(service.getMenus(), '多级')).toEqual([
      expect.objectContaining({
        path: '/demo/level1/leaf',
        title: '四级页面',
        parents: ['多级示例', '一级目录'],
      }),
    ])
    expect(searchAdminMenus(service.getMenus(), '四级')).toEqual([
      expect.objectContaining({
        path: '/demo/level1/leaf',
        title: '四级页面',
        parents: ['多级示例', '一级目录'],
      }),
    ])
  })
})

function routes(): RouteRecordRaw[] {
  return [
    route('/', '控制台', { icon: 'view-dashboard-outline', permission: 'dashboard:view', order: 10 }),
    route('/system', '系统管理', { icon: 'cog-outline', order: 20 }),
    route('/system/user', '用户管理', { permission: 'system:user:list', order: 10 }),
    route('/system/user/:id', '用户详情', { hidden: true, activeMenu: '/system/user' }),
    route('/system/role', '角色管理', { permission: 'system:role:list', order: 20 }),
  ]
}

function route(path: string, title: string, meta: Record<string, unknown> = {}): RouteRecordRaw {
  return {
    path,
    component: { template: '<main />' },
    meta: {
      title,
      ...meta,
    },
  }
}

function menuMeta(path: string, title: string, meta: Record<string, unknown> = {}) {
  return {
    path,
    title,
    ...meta,
  }
}
