import type { NavigationGuard } from 'vue-router'

import type { PermissionService } from './create-permission-service'

export interface CreatePermissionGuardOptions {
  loginPath: string
  forbiddenPath: string
}

function normalizePermission(permission: unknown): string | string[] | undefined {
  if (typeof permission === 'string') {
    return permission
  }

  if (Array.isArray(permission)) {
    return permission.filter((item): item is string => typeof item === 'string')
  }

  return undefined
}

export function createPermissionGuard(
  service: PermissionService,
  options: CreatePermissionGuardOptions,
): NavigationGuard {
  return (to) => {
    const permission = normalizePermission(to.meta.permission)

    if (!permission) {
      return true
    }

    if (!service.isLoggedIn()) {
      return {
        path: options.loginPath,
        query: {
          redirect: to.fullPath,
        },
      }
    }

    if (!service.hasPermission(permission)) {
      return {
        path: options.forbiddenPath,
      }
    }

    return true
  }
}
