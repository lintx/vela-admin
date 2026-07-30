import { createApp, type App, type Component, type Plugin } from 'vue'
import type { Router } from 'vue-router'

import {
  createSettingsService,
  type CreateSettingsServiceOptions,
  type SettingsService,
} from '../settings/create-settings-service'
import { mergeAdminConfig, type AdminConfig, type AdminConfigInput } from './define-admin-config'
import { adminAppInjectionKey } from './use-admin-app'

export interface CreateAdminAppOptions {
  root: Component
  config?: AdminConfigInput
  router?: Router
  plugins?: Plugin[]
  settings?: Omit<CreateSettingsServiceOptions, 'config'>
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
  const settings = createSettingsService({
    ...options.settings,
    config,
  })
  const app = createApp(options.root)
  const context: AdminAppContext = {
    config,
    settings,
  }

  app.provide(adminAppInjectionKey, context)
  app.config.globalProperties.$admin = context
  app.onUnmount(() => {
    // 等同步卸载钩子全部完成后再清理，允许组件和后安装插件保存最终设置。
    void Promise.resolve().then(() => settings.dispose()).catch(() => undefined)
  })

  if (options.router) {
    app.use(options.router)
  }

  options.plugins?.forEach((plugin) => {
    app.use(plugin)
  })

  return app
}
