# 维护者指南

## 适用范围

本文面向 Vela Admin 的维护者、贡献者和 AI 助手，用于说明仓库结构、本地开发、模板维护和发布检查。使用框架开发业务应用的用户应优先阅读根目录 README 和 `docs/` 根级用户文档。

## 仓库结构

```text
.
  package.json
  pnpm-workspace.yaml
  docs/
  examples/
    admin/
  packages/
    framework/
    create-vela-admin/
  scripts/
    package-command.js
```

- `packages/framework`：框架包源码和测试，发布包名为 `vela-admin`。
- `examples/admin`：示例工程，也是生成器模板的唯一长期维护源码。
- `packages/create-vela-admin`：项目生成器，发布后支持 `npm create vela-admin@latest my-app`。
- `packages/create-vela-admin/template`：发布流程临时生成，不手工维护，不提交。

## 本地开发

安装依赖：

```sh
pnpm install
```

启动示例工程：

```sh
pnpm run dev
```

构建示例工程和框架包：

```sh
pnpm run build
```

运行测试：

```sh
pnpm run test
```

只运行 create 包测试：

```sh
pnpm run test:create
```

生成一个本地测试项目：

```sh
pnpm run create -- my-app
```

该命令会在当前执行目录下生成 `my-app`。在仓库根目录执行时，生成目录位于仓库根目录下，不会落到 `packages/create-vela-admin` 内。

## 模板维护

仓库内只长期维护 `examples/admin` 这一份模板源码。发布 `create-vela-admin` 时，模板由发布流程临时同步到 `packages/create-vela-admin/template/admin`，并在打包后清理。

维护要求：

1. 不手工维护 `packages/create-vela-admin/template`。
2. 不提交发布流程临时生成的模板目录。
3. 示例工程应使用框架已提供能力和 Varlet 组件组织页面。
4. 改 create 包或模板同步逻辑后运行 `pnpm run test:create`。

相关规范：

- [示例工程规范](example-policy.md)
- [发布规范](release-policy.md)
- [测试与验收规范](testing-and-verification.md)

## 打包和发布检查

常用打包检查：

```sh
pnpm run pack:framework
pnpm run pack:create
```

常用发布命令：

```sh
pnpm run publish:framework
pnpm run publish:create
pnpm run publish:all
```

默认先发布 `vela-admin`，再发布 `create-vela-admin`。

发布前至少确认：

1. `packages/framework` 只包含发布所需文件。
2. `packages/create-vela-admin` 包含由示例工程同步出的模板。
3. create 包不依赖 monorepo 外部路径。
4. README 和用户文档没有混入维护者专用流程。

## 维护原则

1. 只维护 `examples/admin` 这一份模板源码。
2. 不提交 `packages/create-vela-admin/template`。
3. 不在 `create` 命令中依赖 monorepo 外部路径。
4. 发布前通过 `pnpm run pack:create` 检查 create 包是否包含模板。
5. 发布前通过 `pnpm run pack:framework` 检查 framework 包是否只包含必要文件。
6. 维护者和 AI 协作规则见 [AI 协作规范](ai-collaboration.md)。
