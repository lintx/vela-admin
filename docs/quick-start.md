# 快速开始

本文面向使用 Vela Admin 开发自己后台应用的开发者。仓库维护、模板同步和发布流程见 [维护者指南](development/maintainer-guide.md)。

## 创建应用

使用生成器创建项目：

```sh
npm create vela-admin@latest my-app
```

如果希望生成后直接启用 Vue、Vue Router 和 Vela Admin 常用 API 的自动导入，可以加上参数：

```sh
npm create vela-admin@latest my-app -- --auto-import
```

进入项目并安装依赖：

```sh
cd my-app
pnpm install
pnpm run dev
```

启动后访问终端输出的本地地址即可预览应用。

## 应用目录

生成后的项目是一个普通 Vite 应用，核心目录通常类似：

```txt
my-app/
  src/
    App.vue
    main.js
    pages/
      index.vue
      login.vue
      login.meta.js
      system/
        user.vue
        user.meta.js
    config/
      admin.config.js
    scripts/
      enable-auto-import.js
  package.json
  vite.config.js
```

- `src/main.js`：创建 Vue 应用、路由和 Vela Admin 实例。
- `src/App.vue`：应用根组件。
- `src/pages/`：页面组件和同名 meta 文件，路由与菜单会从这里生成。
- `src/config/admin.config.js`：应用名、布局、主题、权限等配置。

实际文件名可能随模板演进略有差异，但使用方式保持一致：页面放在 `pages`，配置放在项目自己的源码目录，业务代码不需要依赖 Vela Admin 仓库结构。

## 示例账号

模板内置 mock 登录，用于演示菜单、路由守卫和按钮权限：

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| `admin` | `admin123` | 系统管理员 |
| `operator` | `demo123` | 运营人员 |

这些账号只用于本地演示。真实项目应接入自己的后端登录、会话续期、退出和敏感凭据存储策略。

## 最小接入

业务工程通过 `createAdminApp()`、`createAdminRouter()` 和 `defineAdminConfig()` 接入框架：

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

## 添加页面

新增页面时，创建页面组件和同名 meta 文件：

```txt
src/pages/system/user.vue
src/pages/system/user.meta.js
```

meta 示例：

```js
import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '用户管理',
  icon: 'users',
  permission: 'system:user:list',
  order: 10,
})
```

更多路由和菜单规则见 [路由规则](routing.md)。

模板首页示例把 `route` 写在 `index.vue` 内，所以它被单独加入 `eagerPages`。普通业务页面建议继续使用同名 `.meta.js`，页面组件保持懒加载。

## 自动导入

如果创建项目时没有加 `--auto-import`，后续也可以在生成后的项目里一键启用：

```sh
pnpm run enable:auto-import
```

它会安装自动导入插件，并更新默认的 `vite.config.js`。详细说明见 [自动导入](auto-import.md)。

## 常用下一步

- 调整应用名、布局和主题：阅读 [配置参考](configuration.md)。
- 了解页面文件如何生成路由和菜单：阅读 [路由规则](routing.md)。
- 减少样板导入：阅读 [自动导入](auto-import.md)。
- 接入登录态、菜单过滤和按钮权限：阅读 [权限说明](permission.md)。
- 调整 MD2 / MD3、浅色 / 深色和主题色：阅读 [主题说明](theme.md)。
- 配置菜单和页面图标：阅读 [图标](icons.md)。

## 构建

生成后的业务项目使用自己的 npm scripts 构建：

```sh
pnpm run build
```

如果模板示例资源较多，Vite 可能提示 chunk size warning。这通常不是构建失败；生产项目可以按自己的业务拆包策略处理。
