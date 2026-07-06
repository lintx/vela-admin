# vela-admin

Vela Admin 是一个面向 Vue 3 的后台应用框架基底，提供后台应用常见的布局、路由解析、菜单、权限、主题和基础交互能力。

它默认采用 Varlet UI 与 Material Design 风格，适合希望快速启动后台应用，同时保留业务技术选择自由度的项目。

## 快速开始

推荐使用生成器创建项目：

```sh
npm create vela-admin@latest my-app
```

进入项目后安装依赖并启动：

```sh
cd my-app
pnpm install
pnpm run dev
```

## 基础接入

业务工程通常通过子入口按需导入框架能力：

```js
import '@varlet/ui/es/style'
import 'vela-admin/style'

import Varlet from '@varlet/ui'
import { createAdminApp, defineAdminConfig } from 'vela-admin/app'
import { createAdminRouter } from 'vela-admin/router'

import App from './App.vue'

const pages = import.meta.glob('./pages/**/*.vue')
const pageMeta = import.meta.glob('./pages/**/*.meta.js', { eager: true })

const router = createAdminRouter({
  pages: {
    ...pages,
    ...pageMeta,
  },
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

## 文档

- 快速开始：https://github.com/lintx/vela-admin#readme
- 路由规则：https://github.com/lintx/vela-admin/blob/main/docs/routing.md
- 配置参考：https://github.com/lintx/vela-admin/blob/main/docs/configuration.md
- 主题说明：https://github.com/lintx/vela-admin/blob/main/docs/theme.md
