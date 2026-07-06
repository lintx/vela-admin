import type { ObjectDirective } from 'vue'

import type {
  PermissionCheckMode,
  PermissionService,
  UnauthorizedBehavior,
} from './create-permission-service'

type PermissionDirectiveValue = string | string[]

function applyUnauthorizedBehavior(element: HTMLElement, behavior: UnauthorizedBehavior) {
  if (behavior === 'disable') {
    element.setAttribute('disabled', '')
    element.setAttribute('aria-disabled', 'true')
    return
  }

  if (behavior === 'hide') {
    element.hidden = true
    return
  }

  element.parentElement?.removeChild(element)
}

export function permissionDirective(service: PermissionService): ObjectDirective<HTMLElement, PermissionDirectiveValue> {
  return {
    mounted(element, binding) {
      const mode: PermissionCheckMode = binding.modifiers.any ? 'any' : 'all'

      if (service.hasPermission(binding.value, mode)) {
        return
      }

      applyUnauthorizedBehavior(element, service.options.unauthorizedBehavior)
    },
  }
}
