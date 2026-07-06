export class AdminRouteDiagnosticError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminRouteDiagnosticError'
  }
}

export function throwDuplicateRoutePath(path: string): never {
  throw new AdminRouteDiagnosticError(`Duplicate route path "${path}" detected.`)
}

export function throwDuplicateRouteName(name: string): never {
  throw new AdminRouteDiagnosticError(`Duplicate route name "${name}" detected.`)
}
