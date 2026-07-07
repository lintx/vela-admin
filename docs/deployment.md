# 部署说明

本文面向需要部署 Vela Admin 应用或查看示例预览的使用者，说明静态托管、路由模式和服务端 fallback 的常见配置。

## 在线预览

Vela Admin 示例工程提供在线预览：

- 预览地址：[https://lintx.github.io/vela-admin/](https://lintx.github.io/vela-admin/)
- 预览使用前端 mock 数据和 `localStorage` 保存登录态。
- 预览使用 hash 路由适配 GitHub Pages 这类纯静态托管环境。

示例 mock 只用于模板演示，不代表生产鉴权、接口协议或数据存储方案。

## 静态托管配置

Vite 构建时的 `base` 应与部署路径一致：

```env
VITE_ADMIN_BASE=/
```

部署到子路径时应包含首尾斜线，例如：

```env
VITE_ADMIN_BASE=/admin/
```

路由模式可以按部署环境选择：

```env
VITE_ADMIN_ROUTER_HISTORY=web
```

或：

```env
VITE_ADMIN_ROUTER_HISTORY=hash
```

hash 路由适合不方便配置服务端 fallback 的静态托管；history 路由需要服务端把前端路由回退到 `index.html`。

## Nginx history 路由 fallback

如果应用部署在域名根路径，可以使用：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

如果应用部署在子路径，例如 `/vela-admin/`，可以使用：

```nginx
location /vela-admin/ {
  try_files $uri $uri/ /vela-admin/index.html;
}
```

同时确保 Vite `base` 与子路径一致：

```env
VITE_ADMIN_BASE=/vela-admin/
VITE_ADMIN_ROUTER_HISTORY=web
```
