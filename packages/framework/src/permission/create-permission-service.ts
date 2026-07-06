export type PermissionCheckMode = 'all' | 'any'
export type UnauthorizedBehavior = 'remove' | 'disable' | 'hide'

export interface AdminUser {
  id?: string | number
  name?: string
  [key: string]: unknown
}

export interface AdminSession {
  token?: string
  user?: AdminUser
  roles?: string[]
  permissions?: string[]
  [key: string]: unknown
}

export interface PermissionOptions {
  unauthorizedBehavior?: UnauthorizedBehavior
  session?: AdminSession
}

export interface PermissionService {
  readonly options: Required<Pick<PermissionOptions, 'unauthorizedBehavior'>>
  getSession(): Required<Pick<AdminSession, 'roles' | 'permissions'>> & AdminSession
  setSession(session: AdminSession): void
  clearSession(): void
  isLoggedIn(): boolean
  hasPermission(permission?: string | string[], mode?: PermissionCheckMode): boolean
  hasRole(role?: string | string[], mode?: PermissionCheckMode): boolean
}

const defaultSession = (): Required<Pick<AdminSession, 'roles' | 'permissions'>> & AdminSession => ({
  roles: [],
  permissions: [],
})

function normalizeSession(session: AdminSession = {}) {
  return {
    ...session,
    roles: [...(session.roles ?? [])],
    permissions: [...(session.permissions ?? [])],
  }
}

function checkIncludes(values: string[], required?: string | string[], mode: PermissionCheckMode = 'all') {
  if (!required || (Array.isArray(required) && required.length === 0)) {
    return true
  }

  const requiredList = Array.isArray(required) ? required : [required]
  return mode === 'any'
    ? requiredList.some((item) => values.includes(item))
    : requiredList.every((item) => values.includes(item))
}

export function createPermissionService(options: PermissionOptions = {}): PermissionService {
  let session = normalizeSession(options.session)

  return {
    options: {
      unauthorizedBehavior: options.unauthorizedBehavior ?? 'remove',
    },

    getSession() {
      return normalizeSession(session)
    },

    setSession(nextSession) {
      session = normalizeSession(nextSession)
    },

    clearSession() {
      session = defaultSession()
    },

    isLoggedIn() {
      return Boolean(session.token || session.user)
    },

    hasPermission(permission, mode = 'all') {
      return checkIncludes(session.permissions, permission, mode)
    },

    hasRole(role, mode = 'all') {
      return checkIncludes(session.roles, role, mode)
    },
  }
}
