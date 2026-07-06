import { describe, expect, it } from 'vitest'

import {
  createAdminRouter,
  defineRouteMeta,
  parseAdminMenuMeta,
  parseAdminRoutes,
} from '../../src/index'
import { createMemoryHistory } from 'vue-router'

describe('parseAdminRoutes', () => {
  it('parses flat page file names into Vue Router paths', () => {
    const routes = parseAdminRoutes({
      './pages/index.vue': pageComponent('Home'),
      './pages/login.vue': pageComponent('Login'),
      './pages/system.user.vue': pageComponent('UserList'),
      './pages/system.user.[id].vue': pageComponent('UserDetail'),
      './pages/system.user.[id].edit.vue': pageComponent('UserEdit'),
      './pages/article.[slug].vue': pageComponent('ArticleDetail'),
      './pages/article.[...path].vue': pageComponent('ArticleCatchAll'),
      './pages/overflow-menu.[item].vue': pageComponent('OverflowMenuItem'),
      './pages/user.[[id]].vue': pageComponent('OptionalUser'),
    })

    expect(routePaths(routes)).toEqual([
      '/',
      '/login',
      '/system/user',
      '/system/user/:id',
      '/system/user/:id/edit',
      '/article/:slug',
      '/article/:path(.*)',
      '/overflow-menu/:item',
      '/user/:id?',
    ])
  })

  it('merges adjacent meta files and sorts routes by order then path', () => {
    const routes = parseAdminRoutes({
      './pages/users.vue': pageComponent('Users'),
      './pages/users.meta.js': metaFile({ title: '用户管理', icon: 'mdi-account-group-outline', order: 20 }),
      './pages/dashboard.vue': pageComponent('Dashboard'),
      './pages/dashboard.meta.js': metaFile({ title: '控制台', icon: 'mdi-view-dashboard-outline', order: 10 }),
    })

    expect(routes.map((route) => route.path)).toEqual(['/dashboard', '/users'])
    expect(routes[0].meta).toMatchObject({
      title: '控制台',
      icon: 'mdi-view-dashboard-outline',
      order: 10,
    })
  })

  it('infers the shared pages root when the first glob entry is nested', () => {
    const routes = parseAdminRoutes({
      './pages/context-menu/index.vue': pageComponent('ContextMenu'),
      './pages/index.vue': pageComponent('Home'),
      './pages/login.vue': pageComponent('Login'),
    })

    expect(routePaths(routes)).toEqual(['/context-menu', '/', '/login'])
  })

  it('allows page modules to override route path and name', () => {
    const routes = parseAdminRoutes({
      './pages/errors/[...path].vue': pageComponentWithRoute('NotFound', {
        path: '/:path(.*)',
        name: 'not-found',
        meta: {
          title: '404',
          hidden: true,
        },
      }),
    })

    expect(routes).toHaveLength(1)
    expect(routes[0]).toMatchObject({
      path: '/:path(.*)',
      name: 'not-found',
      meta: {
        title: '404',
        hidden: true,
      },
    })
  })

  it('keeps lazy page modules lazy while applying adjacent eager meta', () => {
    const lazyPage = () => Promise.resolve(pageComponent('LazyUser'))
    const routes = parseAdminRoutes({
      './pages/system/user.vue': lazyPage,
      './pages/system/user.meta.js': metaFile({ title: '用户管理', permission: 'system:user:list', order: 20 }),
    })

    expect(routes).toHaveLength(1)
    expect(routes[0].component).toBe(lazyPage)
    expect(routes[0].meta).toMatchObject({
      title: '用户管理',
      permission: 'system:user:list',
      order: 20,
    })
  })

  it('supports eager page modules with exported route meta', () => {
    const eagerPage = pageComponentWithRoute('Dashboard', {
      meta: defineRouteMeta({
        title: '控制台',
        icon: 'dashboard',
        order: 10,
      }),
    })
    const routes = parseAdminRoutes({
      './pages/index.vue': eagerPage,
    })

    expect(routes).toHaveLength(1)
    expect(routes[0].component).toBe(eagerPage.default)
    expect(routes[0].meta).toMatchObject({
      title: '控制台',
      icon: 'dashboard',
      order: 10,
    })
  })

  it('throws diagnostics for duplicate paths', () => {
    expect(() => parseAdminRoutes({
      './pages/user.vue': pageComponent('UserList'),
      './pages/user/index.vue': pageComponent('UserIndex'),
    })).toThrow(/Duplicate route path/)
  })
})

describe('parseAdminMenuMeta', () => {
  it('creates menu-only records from meta files without page components', () => {
    const menuMeta = parseAdminMenuMeta({
      './pages/demo.meta.js': metaFile({ title: '多级示例', icon: 'demo', order: 30 }),
      './pages/demo.level1.meta.js': metaFile({ title: '一级目录', order: 10 }),
      './pages/demo.level1.leaf.vue': pageComponent('Leaf'),
      './pages/demo.level1.leaf.meta.js': metaFile({ title: '叶子页面', order: 10 }),
    })

    expect(menuMeta).toEqual([
      {
        path: '/demo',
        title: '多级示例',
        icon: 'demo',
        order: 30,
      },
      {
        path: '/demo/level1',
        title: '一级目录',
        order: 10,
      },
    ])
  })
})

describe('defineRouteMeta', () => {
  it('keeps route meta object identity for JS users', () => {
    const meta = { title: '用户详情', permission: 'system:user:view' }

    expect(defineRouteMeta(meta)).toBe(meta)
  })
})

describe('createAdminRouter', () => {
  it('creates a router from parsed pages and preserves configured history base', () => {
    const router = createAdminRouter({
      pages: {
        './pages/index.vue': pageComponent('Home'),
        './pages/users.vue': pageComponent('Users'),
      },
      history: createMemoryHistory('/admin/'),
      historyBase: '/admin/',
    })

    expect(router.getRoutes().map((route) => route.path).sort()).toEqual(['/', '/users'])
    expect(router.options.history.base).toBe('/admin')
  })
})

function routePaths(routes: ReturnType<typeof parseAdminRoutes>) {
  return routes.map((route) => route.path)
}

function pageComponent(name: string) {
  return {
    default: {
      name,
      template: `<main>${name}</main>`,
    },
  }
}

function pageComponentWithRoute(name: string, route: Record<string, unknown>) {
  return {
    ...pageComponent(name),
    route,
  }
}

function metaFile(meta: Record<string, unknown>) {
  return {
    default: defineRouteMeta(meta),
  }
}
