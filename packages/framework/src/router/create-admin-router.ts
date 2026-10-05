import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type Router,
  type RouterHistory,
} from 'vue-router'

import {
  adminLoadingBar,
  type AdminLoadingBarService,
} from '../loading-bar'
import { parseAdminRoutes, type PageGlob, type ParseAdminRoutesOptions } from './route-parser'

export type AdminSpecialRouteType = 'forbidden' | 'not-found' | 'server-error'

export interface AdminSpecialRoute {
  path: string
  type: AdminSpecialRouteType
}

export interface CreateAdminRouterOptions extends ParseAdminRoutesOptions {
  pages: PageGlob
  history?: RouterHistory
  historyBase?: string
  specialRoutes?: AdminSpecialRoute[]
  /** 页面切换时默认显示 Varlet LoadingBar；传入 false 可关闭，也可以传入自定义服务。 */
  loadingBar?: boolean | AdminLoadingBarService
}

export function createAdminRouter(options: CreateAdminRouterOptions): Router {
  const routes = parseAdminRoutes(options.pages, options)
  applySpecialRoutes(routes, options.specialRoutes)

  const router = createRouter({
    history: options.history ?? createWebHistory(options.historyBase),
    routes,
  })

  const loadingBar = resolveLoadingBar(options.loadingBar)
  if (loadingBar) {
    installLoadingBar(router, loadingBar)
  }

  return router
}

function resolveLoadingBar(option: CreateAdminRouterOptions['loadingBar']): AdminLoadingBarService | undefined {
  if (option === false) {
    return undefined
  }

  return option === true || option === undefined ? adminLoadingBar : option
}

function installLoadingBar(router: Router, loadingBar: AdminLoadingBarService): void {
  router.beforeEach(() => {
    loadingBar.start()
  })

  router.afterEach(() => {
    // 导航被取消时也要收起加载条；真正的导航异常由 onError 使用错误态反馈。
    loadingBar.finish()
  })

  router.onError(() => {
    loadingBar.error()
  })
}

function applySpecialRoutes(routes: RouteRecordRaw[], specialRoutes: AdminSpecialRoute[] = []) {
  if (specialRoutes.length === 0) {
    return
  }

  const specialRouteMap = new Map(specialRoutes.map((route) => [route.path, route.type]))

  routes.forEach((route) => {
    const specialRoute = specialRouteMap.get(route.path)
    if (!specialRoute) {
      return
    }

    route.meta = {
      ...route.meta,
      public: true,
      specialRoute,
    }
  })
}
