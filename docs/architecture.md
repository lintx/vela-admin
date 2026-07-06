# 架构说明

本文面向使用 Vela Admin 开发后台应用的开发者，说明框架在业务项目中的组成方式和边界。仓库结构、模板同步和发布边界见 [维护者指南](development/maintainer-guide.md)。

## 应用组成

一个 Vela Admin 应用通常由以下部分组成：

```txt
业务应用
  Vue 入口
  Vela Admin 配置
  页面模块和 meta
  权限服务
  菜单服务
  主题系统
  业务自己的请求、状态和页面逻辑
```

Vela Admin 负责后台壳层和基础约定，业务应用仍然保留自己的工程组织和技术选择。

## 启动流程

典型启动流程如下：

1. 业务工程通过 `import.meta.glob()` 收集页面组件和同名 meta 文件，页面默认懒加载，meta 默认 eager。
2. `createAdminRouter()` 根据页面模块生成 Vue Router 路由。
3. `defineAdminConfig()` 描述应用名、布局、主题、设置和权限配置。
4. `createAdminApp()` 创建应用实例，安装路由、配置、权限和主题能力。
5. 业务应用按自己的方式接入请求、状态管理、接口类型和业务组件。

```js
const lazyPages = import.meta.glob([
  './pages/**/*.vue',
  '!./pages/index.vue',
])
const eagerPages = import.meta.glob([
  './pages/index.vue',
], { eager: true })
const pageMeta = import.meta.glob('./pages/**/*.meta.js', { eager: true })
const pagesMap = {
  ...lazyPages,
  ...eagerPages,
  ...pageMeta,
}

const router = createAdminRouter({
  pages: pagesMap,
})
```

## 页面、路由和菜单

页面文件决定路由路径，同名 meta 文件决定菜单标题、图标、排序、权限和缓存等信息。

```txt
src/pages/system/user.vue
src/pages/system/user.meta.js
```

父级菜单可以只提供 `.meta.js`，不提供页面组件。这样它只作为菜单目录存在，不会成为可直接访问的页面。

更多规则见 [路由规则](routing.md)。

## 加载和树摇边界

页面组件默认使用 Vite 的动态导入，访问对应路由时才加载页面代码。路由标题、图标、权限和排序等同步信息建议放在同名 `.meta.js` 中 eager 加载。

Vela Admin 也提供子入口，业务代码可以按能力导入，减少把无关模块带进同一个入口：

```js
import { createAdminApp, defineAdminConfig } from 'vela-admin/app'
import { createAdminRouter } from 'vela-admin/router'
import { createPermissionService } from 'vela-admin/permission'
```

根入口 `vela-admin` 仍保留完整导出，适合小项目或迁移期使用；希望更清晰的加载边界时，优先使用子入口。

## 权限边界

Vela Admin 提供权限服务、路由守卫、菜单过滤和按钮权限指令，但不规定生产鉴权方案。

业务应用需要自己负责：

- 登录接口。
- token 或 session 的存储策略。
- 会话续期。
- 退出登录。
- 后端权限数据结构。

Vela Admin 只要求业务应用最终把可信会话转换为 `AdminSession`：

```js
permission.setSession({
  token: 'token',
  user: { id: 1, name: 'Lin' },
  roles: ['admin'],
  permissions: ['system:user:list'],
})
```

更多规则见 [权限说明](permission.md)。

## 主题和设计系统

主题系统由三层组成：

1. Varlet 原生主题：MD2 / MD3、Light / Dark。
2. Material 动态主题：基于源颜色或图片生成。
3. Admin token：侧栏、菜单、标签栏、滚动条和布局语义变量。

Vela Admin 默认避免把 primary 大面积铺满后台界面，主题色主要用于状态层、指示条和重点操作。

更多规则见 [主题说明](theme.md) 和 [设计系统](varlet-admin-design-system.md)。

## 框架边界

Vela Admin 默认提供：

- 布局和后台壳层。
- 路由与菜单生成约定。
- 权限服务和权限指令。
- 设置中心、标签页、菜单搜索等后台通用交互。
- MD 风格主题和主题生成器。
- 语义图标适配。

Vela Admin 不强制提供或绑定：

- HTTP 请求库。
- 状态管理方案。
- 图表库。
- 表格高级封装。
- 富文本、地图、低代码等重型业务组件。
- 后端鉴权协议。

这些边界让业务项目可以按自己的场景选择 API、组件库补充、状态方案和工程规范。
