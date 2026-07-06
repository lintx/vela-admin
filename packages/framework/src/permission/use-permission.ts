import { inject, provide, type InjectionKey } from 'vue'

import type { PermissionService } from './create-permission-service'

export const permissionInjectionKey: InjectionKey<PermissionService> = Symbol('varlet-admin-permission')

export function providePermission(service: PermissionService) {
  provide(permissionInjectionKey, service)
}

export function usePermission(): PermissionService {
  const service = inject(permissionInjectionKey)

  if (!service) {
    throw new Error('[Vela Admin] Permission service is not provided.')
  }

  return service
}
