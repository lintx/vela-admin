import {
  createRouter,
  createWebHistory,
  type Router,
  type RouterHistory,
} from 'vue-router'

import { parseAdminRoutes, type PageGlob, type ParseAdminRoutesOptions } from './route-parser'

export interface CreateAdminRouterOptions extends ParseAdminRoutesOptions {
  pages: PageGlob
  history?: RouterHistory
  historyBase?: string
}

export function createAdminRouter(options: CreateAdminRouterOptions): Router {
  return createRouter({
    history: options.history ?? createWebHistory(options.historyBase),
    routes: parseAdminRoutes(options.pages, options),
  })
}
