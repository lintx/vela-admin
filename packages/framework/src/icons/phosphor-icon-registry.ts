import { phosphorIconComponents } from './phosphor-icon-components'
import { findAdminSemanticIcon } from './semantic-icons'
import type { AdminIconConfig, ResolvedAdminIcon } from './icon-types'

const phosphorComponentNamePrefix = 'Ph'

/**
 * Phosphor-only 图标配置。
 *
 * 与默认配置的区别是 `fallbackLibrary` 也指向 phosphor：
 * 业务项目只用 Phosphor 时，`vela-admin/icons/phosphor` 入口不会把
 * Tabler 图标集静态打入生产包。
 */
export const phosphorOnlyAdminIconConfig: AdminIconConfig = {
  defaultLibrary: 'phosphor',
  fallbackLibrary: 'phosphor',
  phosphor: {
    weight: 'regular',
  },
}

/**
 * 只在 Phosphor 注册表内解析图标。
 *
 * 行为与 `resolveAdminIcon` 一致，但 fallback 链不经过 Tabler，
 * 因此配合 `vela-admin/icons/phosphor` 子路径使用时可以减小打包体积。
 */
export function resolvePhosphorIcon(
  value: string,
  config: AdminIconConfig = phosphorOnlyAdminIconConfig,
): ResolvedAdminIcon {
  const semantic = findAdminSemanticIcon(value)
  const name = semantic?.phosphor ?? value
  const direct = resolvePhosphorComponent(name, value, false)

  if (direct) {
    return direct
  }

  warnUnknownIcon(value)

  const fallbackName = semantic?.phosphor ?? 'question'

  // phosphor 注册表内置 question 图标，保证任何输入都能解析出可渲染组件
  return resolvePhosphorComponent(fallbackName, value, true)
    ?? resolveBuiltinQuestionIcon(value)
}

function resolvePhosphorComponent(
  name: string,
  key: string,
  fallback: boolean,
): ResolvedAdminIcon | undefined {
  const component = phosphorIconComponents[name as keyof typeof phosphorIconComponents]

  if (!component) {
    return undefined
  }

  return {
    key,
    library: 'phosphor',
    name,
    componentName: `${phosphorComponentNamePrefix}${toPascalCase(name)}`,
    component,
    fallback,
  }
}

function resolveBuiltinQuestionIcon(key: string): ResolvedAdminIcon {
  const component = phosphorIconComponents.question

  return {
    key,
    library: 'phosphor',
    name: 'question',
    componentName: `${phosphorComponentNamePrefix}${toPascalCase('question')}`,
    component,
    fallback: true,
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
