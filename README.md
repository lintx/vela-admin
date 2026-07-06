# Vela Admin

Vela Admin 是一个面向 Vue 3 的后台应用框架基底。它提供后台应用最基础、最容易重复搭建的部分：布局、菜单、路由解析、权限指令、主题和示例模板；其它业务能力仍交给应用自己选择。

它适合希望快速启动一个后台应用，同时又不想被高度集成方案锁住技术选择的团队。

## 设计取向

- **克制**：只把后台框架的共性能力做进核心，不把请求、图表、业务组件、状态方案等全部预设进来。
- **轻量**：强绑定的第三方库较少，核心依赖围绕 Vue、Vue Router、Vite 和 Varlet UI 展开。
- **重细节**：尽量处理那些容易被忽略但会影响体验的小问题，例如浮动菜单、主题切换、布局间距和交互反馈。
- **MD 风格**：默认遵循 Varlet 与 Material Design 风格，提供 MD2 / MD3 主题基础和主题生成能力。
- **升级方便**：框架负责后台壳层和基础约定，业务代码可以保持相对独立，减少升级时的迁移负担。
- **低心智负担**：路由、菜单、权限、主题等能力按清晰约定组织，尽量减少必须记住的特殊规则。
- **自由组合**：除了基础后台框架外，请求库、状态管理、图表、表格扩展、业务组件和工程规范都可以按项目偏好选择。
- **开源**：项目以公开源码维护，设计和实现细节可以直接审阅、调整和扩展。

## 快速开始

使用生成器创建应用：

```sh
npm create vela-admin@latest my-app
```

需要自动导入时可以在创建时启用：

```sh
npm create vela-admin@latest my-app -- --auto-import
```

进入项目并安装依赖：

```sh
cd my-app
pnpm install
pnpm run dev
```

生成后的应用会依赖普通 npm 版本的 `vela-admin`，不需要手动处理 monorepo 或模板同步。

## 基础用法

业务工程通常通过 `createAdminApp()`、`createAdminRouter()` 和 `defineAdminConfig()` 接入框架：

```js
import '@varlet/ui/es/style'
import 'vela-admin/style'

import Varlet from '@varlet/ui'
import {
  createAdminApp,
  defineAdminConfig,
} from 'vela-admin/app'
import {
  createAdminRouter,
} from 'vela-admin/router'

import App from './App.vue'

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

createAdminApp({
  root: App,
  router,
  config: defineAdminConfig({
    appName: 'Vela Admin',
    homePath: '/',
    loginPath: '/login',
  }),
  plugins: [Varlet],
}).mount('#app')
```

## 已提供能力

- 多种后台布局模式：侧栏、顶栏、混合布局。
- 基于文件和 meta 的路由、菜单解析。
- 权限服务、路由守卫和 `v-permission` 指令。
- 标签页、菜单搜索、设置抽屉和主题生成器。
- MD2 / MD3 Light / Dark 主题基础。
- 语义图标和图标库适配。
- 示例登录页、控制台、用户管理、角色管理、按钮权限、多级菜单和错误页。

## 不强制绑定的内容

Vela Admin 不强制规定以下业务选择：

- HTTP 请求库。
- 后端鉴权协议。
- 状态管理方案。
- 图表库。
- 富文本、低代码、地图等重型业务组件。
- 业务目录和接口分层方式。

这意味着你可以把它作为后台应用的基础壳层，也可以逐步替换或扩展其中的能力。

## 示例账号

示例工程内置 mock 登录：

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| `admin` | `admin123` | 系统管理员 |
| `operator` | `demo123` | 运营人员 |

不同账号会展示不同菜单和按钮权限。示例 mock 登录态只用于模板演示，不代表生产鉴权方案。

## 使用文档

- [快速开始](docs/quick-start.md)
- [自动导入](docs/auto-import.md)
- [配置参考](docs/configuration.md)
- [路由规则](docs/routing.md)
- [图标](docs/icons.md)
- [权限说明](docs/permission.md)
- [主题说明](docs/theme.md)
- [架构说明](docs/architecture.md)
- [设计系统](docs/varlet-admin-design-system.md)
- [页面模式与视觉验收](docs/varlet-admin-page-patterns.md)
- [路线图](docs/roadmap.md)

## 维护者入口

仓库结构、发布流程、模板同步、测试验收和 AI 协作规则见 [维护规范总览](docs/development/README.md)。
