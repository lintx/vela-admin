import type { RouteRecordName } from 'vue-router'

export class AdminRouteDiagnosticError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminRouteDiagnosticError'
  }
}

export function throwDuplicateRoutePath(path: string): never {
  throw new AdminRouteDiagnosticError(`Duplicate route path "${path}" detected.`)
}

export function throwDuplicateRouteName(name: RouteRecordName): never {
  throw new AdminRouteDiagnosticError(`Duplicate route name "${String(name)}" detected.`)
}
