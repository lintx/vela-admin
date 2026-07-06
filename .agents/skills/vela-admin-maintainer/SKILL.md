---
name: vela-admin-maintainer
description: Use only inside the Vela Admin repository when modifying source, example, docs, release/package config, AI workflow, or project governance. Do not use for other projects unless the user explicitly asks to adapt this skill.
---

# Vela Admin Maintainer

## Project Guard

Before acting, verify this is the Vela Admin repo:

- `packages/framework/package.json` name is `vela-admin`.
- `packages/create-vela-admin/package.json` name is `create-vela-admin`.
- `AGENTS.md` and `docs/development/ai-sandbox-workflow.md` exist.

If any marker is missing, stop unless the user explicitly asks to adapt this skill for another project.

## Non-Negotiables

- Use Chinese for plans, questions, progress, and summaries.
- Never commit, tag, push, publish, reset, stash, or rewrite main-repo history unless the user explicitly asks for that exact action.
- User approval of a plan or patch is not approval to commit.
- Treat uncommitted main-repo files as user-owned. Do not overwrite or “sync” them into a task unless the user explicitly scopes them in.
- For non-trivial writes, follow `docs/development/ai-sandbox-workflow.md`: main repo is review area, `.ai-dev/` is the only development/checkpoint area.
- `.ai-dev` checkpoint commits stay in `.ai-dev/.git`; never merge/cherry-pick/fetch them into main.
- Do not amend, rebase, squash, or otherwise rewrite `.ai-dev` checkpoint history. Each meaningful change gets a new checkpoint so rollback/audit remains possible.
- Do not create extra sandbox branches by default. Use `.ai-dev` local `main` unless the user asks to park separate work.

## Context Discipline

- Do not re-read every project doc by default. Load only the docs required for the current task.
- Reuse verified facts from the current conversation instead of repeatedly retesting or re-searching.
- Prefer one targeted search/read over broad directory scans.
- For repeated failures, stop and identify the root cause before trying another fix.
- When a command has already proven a fact in this task, cite it instead of running it again unless the file changed.
- Keep final summaries focused on changed files, verification, and remaining decisions.

## Synchronization Triggers

When changing one surface, check whether paired surfaces must change in the same batch:

- Public API, route behavior, permission behavior, theme behavior, or package exports -> update user docs and compatibility notes when users need to know.
- Example app behavior -> update related user docs and ensure create-template packaging still reflects the example.
- `examples/admin` template-source changes -> run create/template checks when generated app behavior or package contents may change.
- Release workflow, package `files`, versioning, npm README, or Trusted Publishing -> update `docs/development/release-policy.md` and package README files if npm users are affected.
- Development rules in `AGENTS.md` or `docs/development/*` -> update this skill when the rule affects AI execution, sandboxing, commits, verification, or context discipline.
- This skill changes -> update `docs/plans/maintenance-governance.md` status when project skill milestones change, then remind the user to run `pnpm run codex:install-skill` unless the local skill is linked with `pnpm run codex:link-skill`.
- UI/layout/theme changes -> update design-system or page-pattern docs when the change becomes a reusable convention.
- New dependencies or security-sensitive behavior -> update dependency/security docs and verification notes.
- Long-term decisions about architecture, compatibility, release, or workflow -> ask whether to record an ADR.

## Required Reading Router

Always read `AGENTS.md` first for project rules, then load only the relevant docs:

- Sandbox or AI workflow: `docs/development/ai-sandbox-workflow.md`, `docs/development/ai-collaboration.md`
- Code structure or file placement: `docs/development/code-organization.md`
- UI/framework components: `docs/development/component-policy.md`, `docs/varlet-admin-design-system.md`
- Example/template work: `docs/development/example-policy.md`
- Docs work: `docs/development/documentation-policy.md`
- Tests/verification: `docs/development/testing-and-verification.md`
- Public API/compatibility: `docs/development/compatibility-policy.md`
- Dependencies/security: `docs/development/dependency-policy.md`, `docs/development/security-policy.md`
- Release/package/tag/npm: `docs/development/release-policy.md`
- Review requests: `docs/development/review-policy.md`
- Long-running governance or skill work: `docs/plans/maintenance-governance.md`, `docs/plans/maintenance-governance-trial.md`

## Sandbox Checklist

For non-trivial edits:

1. Check `git status --porcelain` in main.
2. If main is dirty, stop unless the user gives a one-time explicit override.
3. Record main `HEAD` as the batch base.
4. Align `.ai-dev` to that base.
5. Edit and verify only in `.ai-dev`.
6. Commit `.ai-dev` checkpoint.
7. Generate/apply a patch back to main only after re-checking main status.
8. Re-run matching verification in main after patch application.

## Verification Matrix

- Framework: `pnpm --filter vela-admin test`; add `pnpm --filter vela-admin build` for build/runtime/API changes.
- Example: `pnpm --filter vela-admin-example build`.
- Create/template: `pnpm run test:create`; add `pnpm run pack:create` for package content changes.
- Release/package boundary: `pnpm run release:verify`.
- Docs-only: `git diff --check` plus targeted link/path checks.

Report exactly which commands ran, whether they passed, and any remaining warnings.
