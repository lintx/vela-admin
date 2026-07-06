import { inject, provide, type InjectionKey } from 'vue'

import type { MenuService } from './create-menu-service'

export const menuInjectionKey: InjectionKey<MenuService> = Symbol('varlet-admin-menu')

export function provideMenu(service: MenuService) {
  provide(menuInjectionKey, service)
}

export function useMenu(): MenuService {
  const service = inject(menuInjectionKey)

  if (!service) {
    throw new Error('[Vela Admin] Menu service is not provided.')
  }

  return service
}
