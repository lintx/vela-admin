# 自动导入

Vela Admin 默认不强制绑定自动导入插件。需要减少样板导入时，可以在创建项目时启用，也可以在生成后用一条命令启用。

## 创建时启用

```sh
npm create vela-admin@latest my-app -- --auto-import
```

生成器会在项目模板中启用：

- `unplugin-auto-import`：自动导入 Vue、Vue Router 和 Vela Admin 常用 API。
- `unplugin-vue-components`：自动导入 Vela Admin 提供的少量公共组件。

## 生成后启用

进入已经生成的项目后执行：

```sh
pnpm run enable:auto-import
```

该命令会更新 `package.json` 和默认 `vite.config.js`，然后执行依赖安装。只想写入配置、不立即安装依赖时，可以执行：

```sh
pnpm run enable:auto-import -- --skip-install
```

## 导入边界

自动导入配置会优先使用 Vela Admin 子入口，例如：

```js
import { createAdminApp } from 'vela-admin/app'
import { createAdminRouter } from 'vela-admin/router'
import { createPermissionService } from 'vela-admin/permission'
```

组件自动导入也会从 `vela-admin/components` 解析，避免因为组件解析把根入口的其它能力一起带入。

## 适用场景

自动导入适合希望减少重复 `import` 的项目。偏好显式依赖边界、希望每个文件都能直接看出来源的项目，可以继续使用手写导入；两种方式都受支持。
