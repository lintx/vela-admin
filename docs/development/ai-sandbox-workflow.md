# AI 沙盒开发流程

## 目标与适用范围

本文件约束 AI 助手在 Vela Admin 仓库内的实际写操作。目标：

1. 主目录作为用户审核区，只接收沙盒验证后的候选 patch。
2. `.ai-dev/` 保存 AI 每个可描述阶段的 checkpoint，便于回退。
3. AI 试错提交不进入主仓库正式历史和 Git 对象库。

除只读检查、解释代码、单处错别字或链接修正等极小任务外，AI 助手默认应使用本流程。用户明确要求直接在主目录修改时，以用户即时指令为准，但仍应先说明风险。

## 基本约定

- 主目录是正式工作区和审核区；不得在主目录直接试错。
- `.ai-dev/` 是项目根下的独立 clone，必须被主仓库忽略，长期保留。
- 一个确认计划、一个明确任务或用户指定基点对应一个验收批次；不得把多个风险域混在一个批次。

## 开始前

新验收批次开始前：

```sh
git status --porcelain
```

主目录不干净时必须停止，除非用户明确把这些改动纳入当前批次或允许继续调整同一审核区。主目录干净后，记录当前 `HEAD` 为本轮 `base`；候选 patch 只能从该基准生成。

## 初始化与对齐

`.ai-dev/` 不存在时，先说明影响范围并等待确认后创建。已存在时，先确认 AI 目录工作区干净；若有未提交改动，先提交 checkpoint 或等待用户决定，不得用 reset、checkout 或 clean 未忽略文件丢弃。

```sh
git fetch <主目录remote>
git merge --no-ff <主目录HEAD>
```

对齐目标是让候选 patch 基于主目录当前 `HEAD`，同时保留 `.ai-dev/` 既有 checkpoint 历史。已有 `.ai-dev/` 不得使用 `git reset --hard <主目录HEAD>` 移动当前分支。

merge 冲突时停止并说明冲突文件、当前 checkpoint 和主目录基准，不得自行 reset 或覆盖。只有 `.ai-dev/` 刚创建且没有 checkpoint，或用户明确要求丢弃沙箱历史时，才允许 reset 类命令。

历史 checkpoint 只在 reflog 中时，先保护引用，防止 Git GC 清理：

```sh
git update-ref refs/ai-checkpoints/<name> <commit>
```

该引用不是正式分支，不得同步进主仓库。AI 目录只可清理忽略文件：

```sh
git clean -fdX
```

清理未忽略文件需要单独确认。

## 开发与 checkpoint

AI 只在 `.ai-dev/` 中开发和试错。每个可描述阶段都提交 checkpoint，例如 `checkpoint: 调整布局`、`checkpoint: 修复构建错误`。这些提交只用于沙盒恢复、生成候选 patch 和定位回退点；不得 cherry-pick、merge、rebase 到主目录，也不得 amend、squash 或 reset 掉旧 checkpoint。

## patch 到主目录审核

完成后先确认 `.ai-dev/` 工作区干净。候选变更只通过 diff 或 patch 回到主目录：

```sh
git diff <base>..<target-checkpoint>
```

应用 patch 前再次检查主目录。主目录不干净时停止，除非用户明确要求继续调整同一审核区。应用后主目录仍只是审核区，AI 不得主动提交。

用户要求继续调整同一批次时，回到 `.ai-dev/` 基于当前 checkpoint 修改、提交新 checkpoint，再生成增量或完整 patch；不得在主目录直接补改。

## 验收后决策

用户验收主目录审核区变更后，可以选择：

1. 接受：保留主目录变更，进入下一批或等待用户自行提交。
2. 调整：回到 `.ai-dev/` 继续修改，重新 checkpoint 和 patch 到主目录审核。
3. 回退：使用本验收批次 patch 的 reverse patch 回退主目录变更。

回退不得使用 `git reset --hard`、`git checkout --` 或其它会覆盖用户改动的破坏性命令，除非用户明确要求并确认风险。回退前必须确认主目录只包含本批次相关待审核变更。

## 冲突与失败处理

patch 无法干净应用时，报告冲突文件和原因；不得覆盖主目录文件，也不得复制整个 `.ai-dev/` 文件树。开发失败时说明可选 checkpoint、失败原因和可恢复路径。

## 验收要求

AI 目录验证只说明候选实现可用。最终 diff 应用到主目录后，必须按 `testing-and-verification.md` 重新运行与修改范围匹配的验证。只改文档时至少检查 `git diff --stat` 和 `git diff --check`。

## 禁止事项

AI 助手不得：

1. 自动 stash、reset、checkout、删除或覆盖主目录中的用户改动。
2. 把 `.ai-dev/` checkpoint 当作正式历史同步到主目录。
3. 在主目录直接补改本应属于验收批次的候选变更。
4. 复制整个 `.ai-dev/` 文件树覆盖主目录。
5. 未确认影响范围就创建、删除或重建 `.ai-dev/`。
6. 把 `.ai-dev/` 中的临时文件、构建产物或依赖目录提交到主仓库。
