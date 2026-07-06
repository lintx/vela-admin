# 维护治理计划

本计划用于分阶段建立 Vela Admin 的长期维护规范，避免一次性引入过重流程，也避免规则散落在聊天记录中。

## 目标

1. 建立项目级 `AGENTS.md`，让 AI 开发时有稳定入口。
2. 建立 `docs/development/` 维护规范，供维护者、贡献者和 AI 共同遵守。
3. 建立计划分级和执行状态机制，避免任务进度只依赖上下文记忆。
4. 先沉淀公开仓库内可见规则，再视使用情况抽取项目级 AI skill。

## 第一阶段：项目内规范

创建和维护以下文件：

```text
AGENTS.md
docs/development/
  README.md
  code-organization.md
  component-policy.md
  documentation-policy.md
  example-policy.md
  testing-and-verification.md
  ai-collaboration.md
```

执行状态：

- [x] 写入本计划，固定范围和阶段。
- [x] 新增项目级 `AGENTS.md`。
- [x] 新增 `docs/development/` 下的维护规范。
- [x] 更新 README 的文档入口。
- [x] 将 `docs/architecture.md` 中容易重复漂移的细则收敛为摘要和链接。
- [x] 固定短期计划目录 `.task-plans/`，并加入 git 忽略。
- [x] 新增 `docs/adr/` 作为长期决策记录入口。
- [x] 新增 `docs/plans/` 作为长期计划目录。
- [x] 检查 Markdown 链接和 git diff 范围。

## 计划执行机制

计划按生命周期分为两类：

1. 长期计划：放在 `docs/plans/` 并加入 git 跟踪，适用于路线图、治理、架构、发布、迁移和跨任务维护。
2. 短期计划：只服务当前任务，放在 `.task-plans/`，不加入 git 跟踪，任务结束后删除。

执行计划必须使用 todo/checklist 标记状态。进行中的事项只能有一个，阶段完成后立即更新状态；任务中断后，先读取计划和状态，再继续执行。

## 第二阶段：规范试运行

第一阶段完成后，后续至少用这些规则完成数次真实维护任务，再评估：

- [ ] 在 [维护规范试运行记录](maintenance-governance-trial.md) 中记录至少 3 次真实维护任务中触发的规则。
- [ ] 评估哪些规则经常被触发。
- [ ] 评估哪些规则表述含糊或执行成本过高。
- [ ] 评估哪些规则适合保留在人类文档中，哪些适合抽成 AI 工作流。

## 第三阶段：项目 skill

当规范稳定后，可创建项目级 skill，让使用 Codex 或兼容 Agent Skills 机制的维护者共享同一套执行流程：

```text
.agents/skills/vela-admin-maintainer/SKILL.md
```

执行状态：

- [ ] 确认 `vela-admin-maintainer` skill 的触发场景。
- [ ] 确认 skill 只索引项目文档，不复制整套规范。
- [ ] 创建项目级 skill。
- [ ] 用真实任务验证 skill 是否会先读取 `AGENTS.md` 和相关 `docs/development/` 文件。
- [ ] 根据试运行结果修订 skill。

建议触发场景：

- 在 Vela Admin 中新增功能、改 UI、写 example、改 framework、改 docs。
- 调整构建、发布、模板同步或测试流程。
- 做代码审查、维护计划、拆分计划或发布前检查。

项目 skill 应只包含 AI 执行流程和入口索引，不复制整套项目文档。执行时先读取 `AGENTS.md` 和相关 `docs/development/` 文件，避免 skill 与仓库文档长期漂移。

其他不读取 Agent Skills 的工具仍以 `AGENTS.md` 和 `docs/development/` 为权威来源；如需覆盖特定工具，可在确认需求后补充对应入口文件。

## 验收标准

1. 文档入口清晰，README 能引导到维护规范。
2. `AGENTS.md` 简短可执行，不替代详细文档。
3. 维护规范覆盖代码组织、组件选型、文档、示例、测试验收和 AI 协作。
4. 没有修改业务代码、构建配置或锁文件。
5. Markdown 链接路径有效。
