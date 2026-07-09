import '@varlet/ui/es/style'
import '@varlet/touch-emulator'
import 'vela-admin/style'

import Varlet from '@varlet/ui'
import { ref } from 'vue'
import { createWebHashHistory, createWebHistory } from 'vue-router'
import {
  createAdminApp,
  defineAdminConfig,
} from 'vela-admin/app'
import {
  createMenuService,
  menuInjectionKey,
} from 'vela-admin/menu'
import {
  createPermissionGuard,
  createPermissionService,
  permissionDirective,
  permissionInjectionKey,
} from 'vela-admin/permission'
import {
  createAdminRouter,
  parseAdminMenuMeta,
} from 'vela-admin/router'

import { createMockAuthService, mockAuthInjectionKey } from './mock-auth'
import App from './App.vue'

const lazyPages = import.meta.glob([
  './pages/**/*.vue',
  '!./pages/index.vue',
  '!./pages/errors/**/*.vue',
])
const eagerPages = import.meta.glob([
  './pages/index.vue',
  './pages/errors/**/*.vue',
], { eager: true })
const pageMeta = import.meta.glob('./pages/**/*.meta.js', { eager: true })
const pagesMap = {
  ...lazyPages,
  ...eagerPages,
  ...pageMeta,
}
const routerHistoryMode = import.meta.env.VITE_ADMIN_ROUTER_HISTORY === 'hash' ? 'hash' : 'web'
const router = createAdminRouter({
  pages: pagesMap,
  specialRoutes: [
    { path: '/exception/403', type: 'forbidden' },
    { path: '/exception/404', type: 'not-found' },
    { path: '/exception/500', type: 'server-error' },
    { path: '/:path(.*)', type: 'not-found' },
  ],
  history: routerHistoryMode === 'hash'
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
})

const permission = createPermissionService()
const menuVersion = ref(0)
let menuService

router.beforeEach(createPermissionGuard(permission, {
  loginPath: '/login',
  forbiddenPath: '/exception/403',
}))

function createExampleMenuService() {
  const service = createMenuService({
    routes: router.getRoutes(),
    menuMeta: parseAdminMenuMeta(pagesMap),
    permission,
  })

  return {
    getMenus() {
      const menus = service.getMenus()

      // 仅在开发环境追加超长菜单，方便验证收缩侧栏浮层的滚动边界。
      return import.meta.env.DEV ? [...menus, createOverflowMenu()] : menus
    },

    getDiagnostics() {
      return service.getDiagnostics()
    },

    getActivePaths(path) {
      if (path.startsWith('/overflow-menu/')) {
        return ['/overflow-menu', path]
      }

      return service.getActivePaths(path)
    },
  }
}

function createOverflowMenu() {
  return {
    path: '/overflow-menu',
    title: '超长菜单',
    icon: 'format-list-bulleted',
    order: 90,
    navigable: false,
    children: Array.from({ length: 32 }, (_, index) => {
      const itemNumber = index + 1

      return {
        path: `/overflow-menu/item-${itemNumber}`,
        title: `超长菜单项 ${String(itemNumber).padStart(2, '0')}`,
        order: itemNumber,
        navigable: true,
        children: [],
      }
    }),
  }
}

function refreshMenuService() {
  menuService = createExampleMenuService()
  menuVersion.value += 1
}

const auth = createMockAuthService({
  permission,
  refreshMenus: refreshMenuService,
})

menuService = createExampleMenuService()

const reactiveMenuService = {
  getMenus() {
    menuVersion.value
    return menuService.getMenus()
  },

  getDiagnostics() {
    menuVersion.value
    return menuService.getDiagnostics()
  },

  getActivePaths(path) {
    menuVersion.value
    return menuService.getActivePaths(path)
  },
}

const app = createAdminApp({
  root: App,
  router,
  config: defineAdminConfig({
    appName: 'Vela Admin',
    homePath: '/',
    loginPath: '/login',
    theme: {
      developerTools: true,
    },
  }),
  plugins: [Varlet],
})

app.directive('permission', permissionDirective(permission))
app.provide(permissionInjectionKey, permission)
app.provide(menuInjectionKey, reactiveMenuService)
app.provide(mockAuthInjectionKey, auth)
app.mount('#app')
