/**
 * 默认图标注册表：同时包含 Phosphor 和 Tabler 两套语义图标映射。
 *
 * 只想使用 Phosphor 的业务项目可以改用 `./phosphor-icon-components`，
 * 避免把整个 Tabler 图标集打入生产包。
 */
export { phosphorIconComponents, type PhosphorIconName } from './phosphor-icon-components'
export { tablerIconComponents, type TablerIconName } from './tabler-icon-components'
