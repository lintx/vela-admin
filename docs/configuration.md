# 配置参考

Vela Admin 通过 `defineAdminConfig()` 描述业务配置，通过 `mergeAdminConfig()` 合并默认值。

## 基础配置

```js
import { defineAdminConfig } from 'vela-admin/app'

export default defineAdminConfig({
  appName: 'Vela Admin',
  homePath: '/',
  loginPath: '/login',
})
```

## 完整结构

```ts
interface AdminConfig {
  appName: string
  homePath: string
  loginPath: string
  icons: AdminIconConfig
  layout: AdminLayoutConfig
  theme: AdminThemeConfig
  settings: AdminSettingsConfig
  permission: AdminPermissionConfig
}
```

## Icons

默认值：

```ts
icons: {
  defaultLibrary: 'phosphor',
  fallbackLibrary: 'tabler',
  phosphor: {
    weight: 'regular',
  },
}
```

说明：

- `defaultLibrary` 当前默认为 `phosphor`。
- `fallbackLibrary` 当前默认为 `tabler`。
- `phosphor.weight` 控制 Phosphor 图标字重，默认 `regular`。
- 具体用法见 [图标](icons.md)。

## Layout

默认值：

```ts
layout: {
  mode: 'side',
  sidebarWidth: 272,
  sidebarCollapsedWidth: 56,
  sidebarMenuItemHeight: 44,
  sidebarIconSize: 22,
  sidebarCollapsedIconSize: 26,
  expandedParentBackground: true,
  expandedParentStateOpacity: 0.04,
  activeStateOpacity: 0.11,
  hoverStateOpacity: 0.06,
  collapsedSubMenuTrigger: 'hover',
  scrollbar: 'thin',
  scrollbarWidth: 8,
  scrollbarThumbOpacity: 0.26,
  scrollbarThumbHoverOpacity: 0.42,
  tagsView: true,
  menuSearch: true,
  settings: true,
}
```

说明：

- `mode` 支持 `side`、`top`、`mixed`。
- `tagsView` 控制标签栏。
- `menuSearch` 控制命令面板搜索。
- `settings` 控制设置中心入口。
- `collapsedSubMenuTrigger` 当前用于收缩侧栏子菜单触发方式。

## Theme

默认值：

```ts
theme: {
  base: 'md3Light',
  mode: 'light',
  persist: true,
  developerTools: false,
  sourceColor: '#6750A4',
}
```

说明：

- `base` 支持 `md3Light`、`md3Dark`、`md2Light`、`md2Dark`。
- `mode` 支持 `light`、`dark`、`system`。
- `developerTools` 控制主题生成器里的 CSS / JSON 导出能力。
- `sourceColor` 用于动态主题生成。

## Settings

默认值：

```ts
settings: {
  persist: true,
  storageKey: 'varlet-admin:settings',
}
```

`storageKey` 默认使用稳定命名，方便业务项目长期保留本地设置。

## Permission

默认值：

```ts
permission: {
  unauthorizedBehavior: 'remove',
}
```

`unauthorizedBehavior` 支持：

- `remove`：无权限时从 DOM 移除。
- `disable`：无权限时禁用并设置 `aria-disabled`。
- `hide`：无权限时设置 `hidden`。
