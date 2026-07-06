# 项目治理规范补全计划

本计划用于补齐 Vela Admin 作为长期公开项目需要的协作、发布、兼容、安全和质量治理规则。计划完成后，应把结论沉淀到稳定文档，并按 `docs/plans/README.md` 的规则清理或标记本计划。

## 目标

1. 补齐长期维护中最容易遗漏的 review、发布、兼容、依赖和安全规则。
2. 将暂时不急的公开协作和社区治理事项纳入后续 checklist，避免依赖临时记忆。
3. 保持第一阶段只新增规范文档，不改业务代码和构建配置。

## 第一阶段：优先规范

- [x] 新增 `docs/development/review-policy.md`，定义 code review 和 AI review 的重点。
- [x] 新增 `docs/development/compatibility-policy.md`，定义公开 API、配置、CSS variables 和弃用规则。
- [x] 新增 `docs/development/release-policy.md`，定义版本、发布顺序、包内容检查和回滚原则。
- [x] 新增 `docs/development/dependency-policy.md`，定义新增、升级和锁文件变更规则。
- [x] 新增 `docs/development/security-policy.md`，定义权限、输入输出、CLI 文件写入和前端安全基线。
- [x] 更新 `AGENTS.md` 和 `docs/development/README.md` 的规范入口。
- [x] 检查 Markdown 链接和 git diff 范围。

## 第二阶段：公开协作入口

- [ ] 新增或完善 `CONTRIBUTING.md`。
- [ ] 新增 `CHANGELOG.md` 或 changelog 维护规则。
- [ ] 新增 `.github/pull_request_template.md`。
- [ ] 新增 `.github/ISSUE_TEMPLATE/` 中的 bug、feature 和 documentation 模板。
- [ ] 评估是否需要 `SECURITY.md` 作为公开安全披露入口。

## 第三阶段：质量门禁和自动化

- [ ] 将 Definition of Done 固化到 `docs/development/testing-and-verification.md` 或独立质量门禁文档。
- [ ] 将可访问性验收从设计系统抽出为开发验收 checklist。
- [ ] 评估是否引入 lint、format、typecheck 的统一命令。
- [ ] 准备 GitHub Actions CI 规范和 workflow。
- [ ] 评估是否需要发布 dry-run 自动化检查。

## 暂缓事项

- [ ] 维护者规模扩大后再评估 `CODEOWNERS`。
- [ ] 社区协作规模扩大后再评估 `CODE_OF_CONDUCT.md`。
- [ ] 权限、登录和模板生成器更稳定后再做完整 threat model。
- [ ] 发布节奏稳定后再评估 changeset 或其他版本管理工具。
