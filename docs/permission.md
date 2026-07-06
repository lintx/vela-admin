# 权限说明

Vela Admin 的权限系统分为登录态、角色、权限码、路由守卫、菜单过滤和按钮权限。

## Session

```ts
interface AdminSession {
  token?: string
  user?: AdminUser
  roles?: string[]
  permissions?: string[]
}
```

`createPermissionService()` 会规范化 `roles` 和 `permissions`，未设置时默认为空数组。

## 示例登录态

`examples/admin` 使用 mock 账号和 `localStorage` 演示登录态持久化，只用于展示权限、菜单过滤、路由守卫和按钮权限效果。它不是生产鉴权方案，也不表示 Vela Admin 要求业务项目把敏感 token 持久化到 `localStorage`。

真实项目应接入自己的后端登录、会话刷新、退出和凭据存储策略，再把可信会话转换为 `AdminSession` 传给权限服务。

## 权限服务

```js
import { createPermissionService } from 'vela-admin/permission'

const permission = createPermissionService({
  unauthorizedBehavior: 'remove',
})

permission.setSession({
  token: 'token',
  user: { id: 1, name: 'Lin' },
  roles: ['admin'],
  permissions: ['system:user:list'],
})
```

常用方法：

- `setSession(session)`：设置当前会话。
- `clearSession()`：清空会话。
- `isLoggedIn()`：判断是否登录。
- `hasPermission(permission, mode)`：检查权限码。
- `hasRole(role, mode)`：检查角色。

`mode` 支持：

- `all`：默认，必须全部满足。
- `any`：满足任意一个即可。

## 路由守卫

```js
import { createPermissionGuard } from 'vela-admin/permission'

router.beforeEach(createPermissionGuard(permission, {
  loginPath: '/login',
  forbiddenPath: '/exception/403',
}))
```

规则：

- 路由没有 `permission` 时直接放行。
- 未登录访问有权限要求的路由时跳转登录页。
- 已登录但权限不足时跳转 403。

## 菜单过滤

菜单服务会根据路由 meta 的 `permission` 和当前 session 过滤菜单。

```js
const menuService = createMenuService({
  routes: router.getRoutes(),
  permission,
})
```

登录或退出后应重新创建菜单服务，示例工程通过 `refreshMenus()` 触发。

## 按钮权限

```js
import { permissionDirective } from 'vela-admin/permission'

app.directive('permission', permissionDirective(permission))
```

模板使用：

```vue
<var-button v-permission="'system:user:add'">新增用户</var-button>
<var-button v-permission.any="['system:user:edit', 'system:user:admin']">编辑</var-button>
```

无权限行为由 `unauthorizedBehavior` 控制：

- `remove`
- `disable`
- `hide`
