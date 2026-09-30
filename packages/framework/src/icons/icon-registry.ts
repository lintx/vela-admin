import { phosphorIconComponents, tablerIconComponents } from './icon-components'
import { findAdminSemanticIcon } from './semantic-icons'
import type { AdminIconConfig, AdminIconLibrary, ResolvedAdminIcon } from './icon-types'

const componentNamePrefixes: Record<AdminIconLibrary, string> = {
  phosphor: 'Ph',
  tabler: 'Icon',
}

export const defaultAdminIconConfig: AdminIconConfig = {
  defaultLibrary: 'phosphor',
  fallbackLibrary: 'tabler',
  phosphor: {
    weight: 'regular',
  },
}

export function resolveAdminIcon(
  value: string,
  config: AdminIconConfig = defaultAdminIconConfig,
): ResolvedAdminIcon {
  const parsed = parseIconValue(value, config.defaultLibrary)
  const semantic = findAdminSemanticIcon(parsed.name)
  const name = semantic?.[parsed.library] ?? parsed.name
  const direct = resolveLibraryIcon(parsed.library, name, value, false)

  if (direct) {
    return direct
  }

  const fallbackName = semantic?.[config.fallbackLibrary] ?? 'question'
  // 末位兜底取 phosphor 内置 question 图标，保证任何输入都能解析出可渲染组件
  const fallback = resolveLibraryIcon(config.fallbackLibrary, fallbackName, value, true)
    ?? resolveBuiltinQuestionIcon(value)

  warnUnknownIcon(value)

  return fallback
}

function resolveBuiltinQuestionIcon(key: string): ResolvedAdminIcon {
  const component = phosphorIconComponents.question

  return {
    key,
    library: 'phosphor',
    name: 'question',
    componentName: `${componentNamePrefixes.phosphor}${toPascalCase('question')}`,
    component,
    fallback: true,
  }
}

function parseIconValue(value: string, defaultLibrary: AdminIconLibrary): { library: AdminIconLibrary, name: string } {
  const [maybeLibrary, ...nameParts] = value.split(':')

  if ((maybeLibrary === 'phosphor' || maybeLibrary === 'tabler') && nameParts.length > 0) {
    return {
      library: maybeLibrary,
      name: nameParts.join(':'),
    }
  }

  return {
    library: defaultLibrary,
    name: value,
  }
}

function resolveLibraryIcon(
  library: AdminIconLibrary,
  name: string,
  key: string,
  fallback: boolean,
): ResolvedAdminIcon | undefined {
  const registry = library === 'phosphor' ? phosphorIconComponents : tablerIconComponents
  const component = registry[name as keyof typeof registry]

  if (!component) {
    return undefined
  }

  return {
    key,
    library,
    name,
    componentName: `${componentNamePrefixes[library]}${toPascalCase(name)}`,
    component,
    fallback,
  }
}

function toPascalCase(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join('')
}

function warnUnknownIcon(value: string) {
  if (import.meta.env.DEV) {
    console.warn(`[Vela Admin] Unknown admin icon "${value}", fallback icon is rendered.`)
  }
}
