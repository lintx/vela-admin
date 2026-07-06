# Vela Admin 项目规则

## 规则优先级

本文件只记录 Vela Admin 项目特有规则。未覆盖的事项继续遵循用户全局规则；如发生冲突，以用户即时指令优先，其次是本文件，再其次是全局规则。

## 开发前置要求

1. 开始任何修改前，先阅读本文件以及本次任务相关的 `docs/development/` 文档。
2. 涉及文件修改、依赖变更、配置变更、目录调整或发布流程变更时，先说明计划、影响范围、风险和验收方式，等待确认后再执行。
3. 除错别字、单处链接修正、只读检查等很小修改外，必须先制定计划，再按计划执行。
4. 计划执行必须使用可更新的 todo/checklist 标记进度；同一时间只允许一个进行中事项，完成一个阶段就更新一次状态。
5. 长期计划应加入 git 跟踪；短期执行计划放在 `.task-plans/`，不纳入 git 跟踪，任务结束后删除。
6. 只做任务相关的最小修改，不顺手重构、不迁移风格、不改无关文件。
7. 不主动提交 commit、创建分支、打 tag、重置或覆盖用户已有改动。
8. 除只读检查、解释代码、单处错别字或链接修正等极小任务外，AI 实际开发默认遵循 `docs/development/ai-sandbox-workflow.md`：先确认主目录干净，以一个对话任务、一个确认计划或用户指定基点作为验收批次，在 `.ai-dev/` 独立 clone 中开发并自动 checkpoint，再将候选 patch 应用回主目录供用户审核。
9. 上述沙盒流程适用于所有非极小写操作，包括源码、文档、配置、Git 跟踪文件、未跟踪文件和被忽略的 `.task-plans/` 文件；不得因为文件被 git 忽略就直接在主目录修改。
10. 用户确认方案、范围或执行计划，不等于允许跳过沙盒流程。只有用户明确说“允许直接在主目录修改”或同等含义时，AI 助手才可以跳过 `.ai-dev/`，并且仍需先说明风险和验收方式。
11. 主目录应用候选 patch 后只作为审核区，是否接受、继续调整或回退由用户决定；AI 助手不得主动提交主目录，也不得用破坏性命令回退用户未确认的改动。

## 项目结构约束

1. `packages/framework` 是框架包源码和测试，发布包名为 `vela-admin`。
2. `examples/admin` 是示例工程，也是生成器模板的唯一长期维护源码。
3. `packages/create-vela-admin/template` 只能由发布流程临时生成，不手工维护、不提交。
4. `docs` 存放用户文档、架构文档和维护规范；开发规范放在 `docs/development/`。

## UI 与示例约束

1. framework 新增 UI 时，先查 Varlet 是否已有可直接使用的组件；能组合或轻量封装 Varlet 时，不手写同类 UI。
2. Varlet 无法覆盖时，先评估是否应沉淀为 Vela Admin 可复用能力；最后才考虑手写框架组件。
3. `examples/admin` 只能使用 Varlet 组件和 Vela Admin 已提供能力组织页面，不引入一次性业务 UI 作为模板核心。
4. UI 改动必须遵循 `docs/varlet-admin-design-system.md`。

## 文档与代码组织

1. 用户使用文档放在 `docs/` 根级；维护者和 AI 协作规范放在 `docs/development/`。
2. 新增或大改 Vue SFC 超过 300 行要在计划中说明不拆分原因；超过 400 行默认应拆分。
3. 新增或大改 JS/TS 服务、工具文件超过 250 行要检查是否可按职责拆分。
4. 存量大文件不要求无关重构，但触及核心逻辑时应优先提出局部拆分计划。
5. 开发过程中遇到影响长期维护的决策时，应提醒是否记录到 `docs/adr/`。

## 验收要求

1. 改 framework 后优先运行 `pnpm --filter vela-admin test`，必要时运行根级 `pnpm run build`。
2. 改 example 后优先运行 `pnpm --filter vela-admin-example build`，涉及 UI 时按设计系统要求做视口和主题检查。
3. 改 create 包或模板同步逻辑后运行 `pnpm run test:create`，必要时运行 `pnpm run pack:create`。
4. 涉及公开 API、兼容性、发布、依赖或安全边界时，必须查阅对应 development 规范，并在计划中说明影响。
5. 只改文档时至少检查 Markdown 链接和 git diff 范围。

## 详细规范

- [维护规范总览](docs/development/README.md)
- [代码组织规范](docs/development/code-organization.md)
- [组件选型规范](docs/development/component-policy.md)
- [文档规范](docs/development/documentation-policy.md)
- [示例工程规范](docs/development/example-policy.md)
- [测试与验收规范](docs/development/testing-and-verification.md)
- [Review 规范](docs/development/review-policy.md)
- [兼容性与弃用规范](docs/development/compatibility-policy.md)
- [发布规范](docs/development/release-policy.md)
- [依赖治理规范](docs/development/dependency-policy.md)
- [安全开发规范](docs/development/security-policy.md)
- [AI 协作规范](docs/development/ai-collaboration.md)
- [AI 沙盒开发流程](docs/development/ai-sandbox-workflow.md)
