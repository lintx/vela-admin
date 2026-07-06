import { StyleProvider } from '@varlet/ui'

import { md2LightScopedVariableNames, type ResolvedAdminTheme } from './create-theme'

export interface ThemeStyleTarget {
  style: {
    setProperty(name: string, value: string): void
    removeProperty?(name: string): void
  }
  classList?: {
    add(...tokens: string[]): void
    remove(...tokens: string[]): void
  }
}

const appliedCssVariables = new WeakMap<object, Set<string>>()

export function applyAdminTheme(theme: ResolvedAdminTheme, target?: ThemeStyleTarget): void {
  StyleProvider(Object.keys(theme.varletTheme).length > 0 ? theme.varletTheme : null)

  const resolvedTarget = target ?? globalThis.document?.documentElement

  if (!resolvedTarget) {
    return
  }

  const cssVariables = getGlobalCssVariables(theme)
  const nextCssVariableNames = new Set(Object.keys(cssVariables))
  const previousCssVariableNames = appliedCssVariables.get(resolvedTarget.style) ?? new Set<string>()

  if (theme.base === 'md2Light' && Object.keys(theme.varletTheme).length === 0) {
    removeInlineVarletColorVariables(resolvedTarget.style, nextCssVariableNames)
    removeInlineMd2ScopedVariables(resolvedTarget.style, nextCssVariableNames)
  }

  previousCssVariableNames.forEach((name) => {
    if (!nextCssVariableNames.has(name)) {
      resolvedTarget.style.removeProperty?.(name)
    }
  })

  Object.entries(cssVariables).forEach(([name, value]) => {
    resolvedTarget.style.setProperty(name, value)
  })

  applyThemeFamilyClass(theme, resolvedTarget)
  appliedCssVariables.set(resolvedTarget.style, nextCssVariableNames)
}

function applyThemeFamilyClass(theme: ResolvedAdminTheme, target: ThemeStyleTarget): void {
  const familyClass = theme.base.startsWith('md2') ? 'varlet-admin-theme-md2' : 'varlet-admin-theme-md3'
  const staleFamilyClass = familyClass === 'varlet-admin-theme-md2'
    ? 'varlet-admin-theme-md3'
    : 'varlet-admin-theme-md2'

  target.classList?.remove(staleFamilyClass)
  target.classList?.add(familyClass)
}

function getGlobalCssVariables(theme: ResolvedAdminTheme): Record<string, string> {
  if (theme.base !== 'md2Light' || Object.keys(theme.varletTheme).length > 0) {
    return theme.cssVariables
  }

  return Object.fromEntries(
    Object.entries(theme.cssVariables).filter(([name]) => !md2LightScopedVariableNames.has(name)),
  )
}

function removeInlineVarletColorVariables(style: CSSStyleDeclaration, nextCssVariableNames: Set<string>): void {
  Array.from(style)
    .filter((name) => (/^--hsl-/.test(name) || /^--color-/.test(name)) && !nextCssVariableNames.has(name))
    .forEach((name) => style.removeProperty?.(name))
}

function removeInlineMd2ScopedVariables(style: CSSStyleDeclaration, nextCssVariableNames: Set<string>): void {
  md2LightScopedVariableNames
    .forEach((name) => {
      if (!nextCssVariableNames.has(name)) {
        style.removeProperty?.(name)
      }
    })
}
