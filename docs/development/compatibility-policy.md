# 兼容性与弃用规范

本规范用于降低 Vela Admin 作为公开框架包的升级成本。公开能力一旦发布，应默认按兼容承诺维护。

## 公开兼容面

以下内容属于兼容性敏感区域：

1. `packages/framework/src/index.ts` 导出的函数、类型、组件和常量。
2. `defineAdminConfig()` 支持的配置结构和默认值。
3. 路由文件命名规则、meta 字段和权限语义。
4. CSS variables、主题 token 和样式入口 `vela-admin/style`。
5. 示例模板生成后的目录结构和依赖方式。
6. `create-vela-admin` 的命令行参数、生成行为和错误提示。

## 变更原则

1. 新增能力优先保持向后兼容。
2. 修改默认行为前必须说明迁移影响。
3. 删除或重命名公开 API 前必须先弃用。
4. 内部实现可以调整，但不能破坏公开入口和文档承诺。
5. 示例模板应避免依赖未稳定的内部 API。

## 弃用规则

弃用公开能力时，应同时提供：

1. `@deprecated` 或文档中的弃用说明。
2. 推荐替代方案。
3. 迁移示例。
4. 预计移除版本或条件。

除非存在安全风险或严重错误，不应在没有迁移路径的情况下直接删除公开能力。

## 弃用注册表

公开 API 的弃用生命周期统一登记在根级 `deprecations.json`：

1. 每项使用稳定 ID，例如 `VA-DEP-001`。
2. 源码 `@deprecated` 注释必须包含 `[ID]`，并与注册表的 `source` 双向一致。
3. 注册表必须记录包名、API 类型、符号、弃用版本、替代方案、迁移方式、最早移除版本、移除条件和状态。
4. `active` 表示兼容保留；实际删除后改为 `removed` 并记录 `removedIn`，历史记录不得删除。
5. 用户文档 `docs/deprecations.md` 由 `pnpm run deprecations:generate` 生成，不手工维护。

`pnpm run test:deprecations` 严格检查注册表、源码注释和生成文档。`pnpm run deprecations:audit` 只报告已达到最早移除版本的 active 项，不自动删除，也不以“到期”阻断普通开发；维护者仍需人工确认迁移窗口和具体移除条件。

## Breaking Change

以下情况应视为 breaking change：

1. 删除、重命名或改变公开导出。
2. 改变配置默认值导致用户页面行为变化。
3. 改变路由解析规则或权限判断语义。
4. 删除 CSS variables 或改变 token 语义。
5. 改变 create 包生成项目的必要运行方式。

breaking change 必须记录到计划、发布说明和迁移文档中，并提醒是否需要 ADR。
