# create-vela-admin

Vela Admin 的项目生成器，用于创建基于 Vue 3、Vite、Varlet UI 和 `vela-admin` 的后台应用模板。

## 在线演示

- [Vela Admin 在线预览](https://demo.vela.pub/)

## 使用

```sh
npm create vela-admin@latest my-app
```

创建完成后：

```sh
cd my-app
pnpm install
pnpm run dev
```

## 自动导入

创建项目时可以启用自动导入：

```sh
npm create vela-admin@latest my-app -- --auto-import
```

如果创建时没有启用，也可以在生成后的项目中执行：

```sh
pnpm run enable:auto-import
```

## 文档

- 项目主页：https://github.com/lintx/vela-admin#readme
- 快速开始：https://github.com/lintx/vela-admin/blob/main/docs/quick-start.md
- 自动导入：https://github.com/lintx/vela-admin/blob/main/docs/auto-import.md
