# 路由规则

Vela Admin 的路由由业务工程传入页面模块生成。

```js
const pages = import.meta.glob('./pages/**/*.vue')
const pageMeta = import.meta.glob('./pages/**/*.meta.js', { eager: true })

const router = createAdminRouter({
  pages: {
    ...pages,
    ...pageMeta,
  },
})
```

默认情况下，`.vue` 页面会被 Vite 编译为动态导入函数，进入对应路由时才加载页面代码；同名 `.meta.js` 会 eager 加载，用于同步生成菜单、标题、权限和排序。

## 文件到路径

| 文件 | 路由 |
| --- | --- |
| `pages/index.vue` | `/` |
| `pages/login.vue` | `/login` |
| `pages/system.user.vue` | `/system/user` |
| `pages/system.user.[id].vue` | `/system/user/:id` |
| `pages/article.[slug].vue` | `/article/:slug` |
| `pages/article.[[id]].vue` | `/article/:id?` |
| `pages/[...path].vue` | `/:path(.*)` |

点号和目录分隔符都可以形成路由层级；方括号用于动态参数。

## Meta 文件

推荐将路由 meta 放在同名 `.meta.js` 文件：

```js
import { defineRouteMeta } from 'vela-admin/router'

export default defineRouteMeta({
  title: '用户管理',
  icon: 'users',
  permission: 'system:user:list',
  order: 10,
  keepAlive: true,
})
```

含有子菜单的父级菜单应只作为目录节点，不绑定页面组件。此时只保留 `.meta.js`，不要创建同名 `.vue` 页面：

```txt
pages/demo.meta.js
pages/demo.level1.meta.js
pages/demo.level1.level2.meta.js
pages/demo.level1.level2.leaf.vue
pages/demo.level1.level2.leaf.meta.js
```

在示例中，`/demo`、`/demo/level1`、`/demo/level1/level2` 只出现在菜单树中，用于展开或收缩；只有 `/demo/level1/level2/leaf` 是可访问页面。

业务工程需要同时把页面模块和 meta 模块传给路由与菜单服务。菜单服务会从没有同名页面的 `.meta.js` 中生成目录节点：

```js
const pagesMap = {
  ...import.meta.glob('./pages/**/*.vue'),
  ...import.meta.glob('./pages/**/*.meta.js', { eager: true }),
}

const router = createAdminRouter({
  pages: pagesMap,
})

const menuService = createMenuService({
  routes: router.getRoutes(),
  menuMeta: parseAdminMenuMeta(pagesMap),
})
```

## 页面内 route

如果更希望把某些页面的路由信息和组件放在同一个 `.vue` 文件里，可以导出 `route`：

```vue
<script>
import { defineRouteMeta } from 'vela-admin/router'

export const route = {
  meta: defineRouteMeta({
    title: '控制台',
    icon: 'dashboard',
    permission: 'dashboard:view',
    order: 10,
  }),
}
</script>

<script setup>
// 页面逻辑
</script>
```

这种写法需要同步读取 `.vue` 模块，所以只能用于被单独 eager 的页面：

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
```

建议只把首页、少数特殊入口页或确实需要页面内 `route` 的文件加入 `eagerPages`；普通业务页继续使用同名 `.meta.js`，这样页面代码仍然可以懒加载。

## Meta 字段

- `title`：页面标题和菜单标题。
- `icon`：菜单图标，使用 Vela Admin 语义图标名；顶级菜单必须配置。详见 [图标](icons.md)。
- `permission`：访问权限码。
- `order`：排序值，数值越小越靠前。
- `hidden`：从菜单隐藏。
- `activeMenu`：动态详情页可指定高亮菜单。
- `layout: 'plain'`：使用无后台布局的页面，例如登录页。
