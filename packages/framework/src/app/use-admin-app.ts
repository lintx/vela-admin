import { inject, type InjectionKey } from 'vue'

import type { AdminAppContext } from './create-admin-app'

export const adminAppInjectionKey: InjectionKey<AdminAppContext> = Symbol('admin-app')

export function useAdminApp(): AdminAppContext {
  const context = inject(adminAppInjectionKey, null)
  if (!context) {
    throw new Error('useAdminApp() must be called inside an app created by createAdminApp()')
  }

  return context
}

export function useAdminSettings(): AdminAppContext['settings'] {
  return useAdminApp().settings
}
