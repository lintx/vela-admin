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
  tabs?: AdminTabsConfig
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
  schemaVersion: 1,
}
```

- `storageKey` 默认使用稳定命名，方便业务项目长期保留本地设置。
- `schemaVersion` 用于框架迁移旧设置快照，业务通常不需要手工修改。

### 本地持久化与服务端同步

远端同步是可选能力。业务可以在 `createAdminApp()` 中提供适配器，framework 不绑定 HTTP 客户端、鉴权协议或服务端存储结构：

```js
const app = createAdminApp({
  root: App,
  router,
  config,
  settings: {
    syncDebounce: 500,
    sync: {
      load: () => api.get('/me/settings'),
      save: async (settings) => {
        await api.put('/me/settings', settings)
      },
    },
    onSyncError({ operation, error }) {
      console.error(`settings ${operation} failed`, error)
    },
  },
})
```

同步契约：

1. `updateSettings()` 和 `resetSettings()` 会先更新响应式状态和本地存储，界面无需等待网络请求。
2. 登录或会话恢复完成后，业务按需调用 `loadRemoteSettings()`；未配置 `sync.load` 时无需调用。
3. 远端返回的字段覆盖本地同名字段，远端缺失字段保留本地值，合并结果仍会补齐框架默认值。
4. 远端加载成功后不会立即回传，避免形成“加载—保存”循环。
5. 自动保存默认防抖 `500ms`；防抖期间或请求进行中继续修改时，协调器会在当前请求后保存最新快照。
6. `syncSettings()` 立即保存调用时的完整当前设置，`retrySync()` 在失败后重试最新本地设置。
7. 保存失败不会回滚已经生效的界面状态或本地设置。

组件内可以通过 `useAdminSettings()` 读取状态和触发同步：

```js
const settings = useAdminSettings()

await restoreSession()
await settings.loadRemoteSettings()

const status = settings.syncStatus.value // idle | scheduled | syncing | synced | error
const error = settings.lastError.value

await settings.syncSettings()
await settings.retrySync()
```

`syncStatus` 和 `lastError` 是只读响应式引用。`loadRemoteSettings()` 完成后，`useAdminTabs()` 会监听设置中的 `fixedTabs`，按当前路由和权限重新协调固定标签。

## Tabs

默认值：

```ts
tabs: {
  fixedTabs: [],
}
```

`fixedTabs` 保存用户固定的标签页；首页由 `AdminConfig.homePath` 确定，不需要重复写入。

低层 `createTabsService({ homePath })` 选项已弃用，因为它不参与标签状态。请显式传入固定标签，或在应用层使用 `useAdminTabs()`：

```js
const tabs = createTabsService({
  fixedTabs: [{ path: config.homePath, title: '首页', closable: false }],
})
```

该弃用字段只会在下一个 major 版本中，并且文档、示例、生成器与生态调用完成迁移且至少经过一个稳定版本的弃用窗口后，才考虑移除。

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
