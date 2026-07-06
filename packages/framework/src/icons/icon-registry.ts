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
  const fallback = resolveLibraryIcon(config.fallbackLibrary, fallbackName, value, true)
    ?? resolveLibraryIcon('phosphor', 'question', value, true)

  warnUnknownIcon(value)

  return fallback
}

function parseIconValue(value: string, defaultLibrary: AdminIconLibrary) {
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
