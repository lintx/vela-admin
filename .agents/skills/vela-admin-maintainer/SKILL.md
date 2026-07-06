---
name: vela-admin-maintainer
description: Use only inside the Vela Admin repository when modifying source, example, docs, release/package config, AI workflow, or project governance. Do not use for other projects unless the user explicitly asks to adapt this skill.
---

# Vela Admin Maintainer

## Project Guard

Use only when these repo markers exist:

- `packages/framework/package.json` name is `vela-admin`.
- `packages/create-vela-admin/package.json` name is `create-vela-admin`.
- `AGENTS.md` and `docs/development/ai-sandbox-workflow.md` exist.

If any marker is missing, stop unless the user explicitly asks to adapt this skill for another project.

## Hard Rules

- Use Chinese for plans, questions, progress, and summaries.
- Never commit, tag, push, publish, reset, stash, or rewrite main-repo history unless the user explicitly asks for that exact action.
- User approval of a plan or patch is not approval to commit.
- Treat uncommitted main-repo files as user-owned. Do not overwrite or “sync” them into a task unless the user explicitly scopes them in.
- For non-trivial writes, follow `docs/development/ai-sandbox-workflow.md`: main repo is review area, `.ai-dev/` is the only development/checkpoint area.
- `.ai-dev` checkpoint commits stay in `.ai-dev/.git`; never merge/cherry-pick/fetch them into main.
- Do not amend, rebase, squash, reset, or otherwise rewrite `.ai-dev` checkpoint history. Each meaningful change gets a new checkpoint so rollback/audit remains possible.
- Do not create extra sandbox branches by default. Use `.ai-dev` local `main` unless the user asks to park separate work.

## Context Discipline

- Read only task-relevant docs; do not load every project rule by default.
- Reuse verified facts from the current conversation; do not repeat broad searches or full tests without a changed risk.
- Prefer targeted reads/searches. For repeated failures, stop and identify the root cause before trying another fix.
- Keep final summaries focused on changed files, verification, and remaining decisions.

## Read Router

Read `AGENTS.md` first, then only the relevant docs:

- Sandbox/AI workflow: `docs/development/ai-sandbox-workflow.md`, `docs/development/ai-collaboration.md`
- Code structure or file placement: `docs/development/code-organization.md`
- UI/framework components: `docs/development/component-policy.md`, `docs/varlet-admin-design-system.md`
- Example/template work: `docs/development/example-policy.md`
- Docs work: `docs/development/documentation-policy.md`
- Tests/verification: `docs/development/testing-and-verification.md`
- Public API/compatibility: `docs/development/compatibility-policy.md`
- Dependencies/security: `docs/development/dependency-policy.md`, `docs/development/security-policy.md`
- Release/package/tag/npm: `docs/development/release-policy.md`
- Review requests: `docs/development/review-policy.md`
- Governance/skill work: `docs/development/ai-collaboration.md`, `docs/development/ai-sandbox-workflow.md`, `docs/plans/README.md`, and the active plan if one exists.

## Sandbox Checklist

For non-trivial edits:

1. Check `git status --porcelain` in main.
2. If main is dirty, stop unless the user gives a one-time explicit override.
3. Record main `HEAD` as the batch base.
4. Align `.ai-dev` to that base without resetting checkpoint history: fetch main, merge the base into `.ai-dev/main`, and stop on conflicts.
5. Edit and verify only in `.ai-dev`.
6. Commit `.ai-dev` checkpoint.
7. Generate/apply a patch back to main only after re-checking main status.
8. Re-run matching verification in main after patch application.

If older checkpoints are only visible through reflog, protect them with `refs/ai-checkpoints/<name>` before any further sandbox operation. Do not create visible sandbox branches unless the user asks for them.

## Sync Checks

- User-visible behavior/API/theme/route/package changes -> update user docs or compatibility notes when users need to know.
- Example/template/release/package changes -> update matching development docs and run the matching package checks.
- Development rules in `AGENTS.md`, `docs/development/*`, or this skill -> keep the three surfaces consistent.
- Long-term architecture, compatibility, release, dependency, security, or workflow decisions -> ask whether to record an ADR.

## Verification Matrix

- Framework: `pnpm --filter vela-admin test`; add `pnpm --filter vela-admin build` for build/runtime/API changes.
- Example: `pnpm --filter vela-admin-example build`.
- Create/template: `pnpm run test:create`; add `pnpm run pack:create` for package content changes.
- Release/package boundary: `pnpm run release:verify`.
- Docs-only: `git diff --check` plus targeted link/path checks.

Report exactly which commands ran, whether they passed, and any remaining warnings.
