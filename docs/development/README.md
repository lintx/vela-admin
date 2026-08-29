# 维护规范总览

本目录面向 Vela Admin 的长期维护者、贡献者和 AI 助手。用户使用、配置、路由、权限、主题等文档仍放在 `docs/` 根级。

## 阅读顺序

1. [代码组织规范](code-organization.md)
2. [组件选型规范](component-policy.md)
3. [文档规范](documentation-policy.md)
4. [示例工程规范](example-policy.md)
5. [测试与验收规范](testing-and-verification.md)
6. [Review 规范](review-policy.md)
7. [兼容性与弃用规范](compatibility-policy.md)
8. [发布规范](release-policy.md)
9. [依赖治理规范](dependency-policy.md)
10. [安全开发规范](security-policy.md)
11. [维护者指南](maintainer-guide.md)
12. [AI 协作规范](ai-collaboration.md)
13. [AI 沙盒开发流程](ai-sandbox-workflow.md)

## 核心原则

1. 最小修改：只改任务需要的文件，不顺手重构。
2. 单一模板源：只长期维护 `examples/admin`，不维护生成后的 `template`。
3. Varlet 优先：新增 UI 先查 Varlet，再考虑 Vela Admin 封装，最后才手写。
4. 文档分层：用户文档、维护规范和设计决策分别存放，避免混在一个长文件中。
5. 验收可追溯：每次修改都应能说清楚影响范围和验证命令。
6. 公开 API、发布、依赖和安全边界的改动必须显式评估长期维护影响。
7. AI 沙盒默认：除极小任务外，AI 实际开发应先在 `.ai-dev/` 独立 clone 中试错和 checkpoint，最终只把确认后的 diff 应用回主目录。

## 后续治理

当前仓库提供以下项目级 skill：

- `.agents/skills/vela-admin-maintainer/`：固化 AI 执行入口、上下文读取顺序和沙箱约束。
- `.agents/skills/using-varlet/`：按项目实际 Varlet 版本查询官方文档与源码，并指导组件选型、页面精简和 framework 边界判断。

skill 不替代本目录中的稳定维护规范。使用 `pnpm run codex:link-skill -- <skill-name>` 链接单个 skill，或使用 `pnpm run codex:link-skills` 链接全部项目 skill。

修改 `AGENTS.md` 或 `docs/development/` 中会影响 AI 执行、沙箱、提交、验收或上下文读取的规则时，应同步更新项目 skill。长期计划放在 [docs/plans](../plans/README.md)，影响长期维护的决策记录放在 [docs/adr](../adr/README.md)。
