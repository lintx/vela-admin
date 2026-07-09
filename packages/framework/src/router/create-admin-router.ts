import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type Router,
  type RouterHistory,
} from 'vue-router'

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
}

export function createAdminRouter(options: CreateAdminRouterOptions): Router {
  const routes = parseAdminRoutes(options.pages, options)
  applySpecialRoutes(routes, options.specialRoutes)

  return createRouter({
    history: options.history ?? createWebHistory(options.historyBase),
    routes,
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
