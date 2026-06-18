# Design: Fix Routing Tri-Split

**Date:** 2026-06-18
**Change:** `openspec/changes/fix-routing-tri-split`

## Problem

Three sources of task routing use incompatible key names, causing AI agents to never match routing entries:

| Source | Keys | Status |
|---|---|---|
| `schema.yaml` | `feature`, `bugfix`, `refactor`, `docs` | Correct |
| `verify-change.ts` / `archive-change.ts` | `功能开发`, `缺陷修复`, `重构`, `文档` | Wrong |
| Installed `.claude/commands/ape/verify.md` / `archive.md` | Same Chinese keys | Wrong |

When the CLI returns `{ feature: [...] }`, but the AI reads Chinese keys from templates, every lookup fails silently. This is not a deliberate design — it's accumulated divergence from multiple contributors editing files in different languages.

## Solution

Remove all hardcoded routing tables from templates and installed files. Replace each with an inline directive that tells the AI to call the CLI for routing at runtime.

### Files Changed

| File | Current | Change |
|---|---|---|
| `src/core/templates/workflows/verify-change.ts` | `taskRoutingBlock` constant (~20 lines) | Delete constant, add inline CLI directive |
| `src/core/templates/workflows/archive-change.ts` | `taskRoutingBlock` constant (~20 lines) | Delete constant, add inline CLI directive |
| `.claude/commands/ape/verify.md` | Chinese routing table (~25 lines) | Delete table, add inline CLI directive |
| `.claude/commands/ape/archive.md` | Chinese routing table (~25 lines) | Delete table, add inline CLI directive |

### Files NOT Changed

- `schema.yaml` — already has correct English keys
- `instructions.ts` — already reads schema and returns correct routing
- `apply-change.ts` — already follows "do not inline static table" principle

### Directive Text

Each file gets its own inline directive, written consistently:

> 任务类型路由：调用 `apeworkflow instructions <phase> --change <name> --json` 获取。不要在此内联静态路由表。

No shared module — inline is simpler, and the directive is a single sentence unlikely to need frequent changes.

## Verification

- `npm run build` passes
- `grep` confirms no Chinese routing keys remain in templates or installed files
- `apeworkflow instructions verify --json` and `apeworkflow instructions archive --json` still return correct `taskTypeRouting`

## Risks

- **Someone adds routing back later** — Low risk. The spec self-review and openspec validation provide guards. A CI lint check is mentioned as a future enhancement in the design doc.
- **CLI call adds latency** — ~2 seconds, negligible compared to overall verify/archive workflow. AI can cache the response per session.
