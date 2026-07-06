import { createApp, type App, type Component, type Plugin } from 'vue'
import type { Router } from 'vue-router'

import { createSettingsService, type SettingsService } from '../settings/create-settings-service'
import { mergeAdminConfig, type AdminConfig, type AdminConfigInput } from './define-admin-config'

export interface CreateAdminAppOptions {
  root: Component
  config?: AdminConfigInput
  router?: Router
  plugins?: Plugin[]
}

export interface AdminAppContext {
  config: AdminConfig
  settings: SettingsService
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $admin: AdminAppContext
  }
}

export function createAdminApp(options: CreateAdminAppOptions): App {
  const config = mergeAdminConfig(options.config)
  const settings = createSettingsService({ config })
  const app = createApp(options.root)

  app.config.globalProperties.$admin = {
    config,
    settings,
  }

  if (options.router) {
    app.use(options.router)
  }

  options.plugins?.forEach((plugin) => {
    app.use(plugin)
  })

  return app
}
