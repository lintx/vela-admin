---
name: using-varlet
description: Use when working in Vela Admin with Varlet components, @varlet/ui APIs, component selection, theme variables, excessive custom Vue markup or CSS, or deciding whether UI belongs in Varlet, framework, or example code.
---

# Using Varlet

## Overview

Base Varlet decisions on the project's installed version and official source. Prefer targeted evidence over memory, and require visual and behavioral equivalence before replacing existing UI.

## Workflow

1. Confirm the repository contains `examples/admin`, `packages/framework`, and `@varlet/ui`.
2. Run `node .agents/skills/using-varlet/scripts/sync-varlet-docs.mjs status`.
3. If cache is missing or its version differs, run the same script with `update`. If sync fails, continue with the local npm fallback printed by the script.
4. Read [references/retrieval-guide.md](references/retrieval-guide.md) for API, source, test, slot, event, or theme-variable queries.
5. Read [references/component-selection.md](references/component-selection.md) before recommending a Varlet replacement or framework extraction.
6. Report the installed version, official tag, exact document/source path, decision, and remaining visual or compatibility risk.

## Hard Rules

- Treat the installed package version as authoritative; do not answer from latest docs or model memory alone.
- Search narrowly with `rg`; do not load the full cache into context.
- Do not replace markup merely to reduce lines or class count.
- Do not claim visual equivalence without checking default spacing, typography, state layers, responsive behavior, accessibility, and DOM-dependent tests.
- Prefer Varlet composition, then reusable Vela Admin capability, then example-owned business markup.
- Keep downloaded official material in `.cache/`; never add it to Git.
- Cite `v<version>` plus the relative official document or source path for technical conclusions.

## Output

For audits, classify every candidate as one of:

- remove as redundant;
- replace with Varlet;
- reuse existing Vela Admin capability;
- extract into framework;
- keep, with the reason replacement is unsafe or low value.
