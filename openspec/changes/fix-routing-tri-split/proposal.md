# Fix Routing Tri-Split

## Why

The task type routing system has three disconnected sources of truth that use incompatible key names, causing AI agents to never match routing entries:

- `schema.yaml`: `feature`, `bugfix`, `refactor`, `docs` (English keys)
- `verify-change.ts` / `archive-change.ts` templates: `功能开发`, `缺陷修复`, `重构`, `文档` (Chinese keys)
- `apply-change.ts`: says "do not inline a static task route table" (avoids the problem but provides no alternative)

When `apeworkflow instructions verify/archive --json` returns routing with English keys, but the command/Skill files embed Chinese keys, the AI agent reads the Chinese keys and tries to match them against the CLI's English-key response. **Every lookup fails silently.** The embedded Chinese routing table is dead code.

This was not a deliberate design decision — it is the result of multiple people editing files in different languages over time, without a mechanism to keep them in sync.

## What Changes

- Remove hardcoded `taskRoutingBlock` from `verify-change.ts` and `archive-change.ts`
- Replace with a single directive to use `apeworkflow instructions <phase> --change <name> --json` for routing
- Align all three template files to the same pattern: "get routing from CLI, do not hardcode"
- Remove duplicate Chinese routing tables from `.claude/commands/ape/archive.md` and `.claude/commands/ape/verify.md`

## Capabilities

### Modified Capabilities
- `cli-routing`: Task type routing system for verify/archive phases

### New Capabilities
- `routing-verification`: A testable verification step to ensure routing key names are consistent across schema.yaml and templates

## Impact

- `src/core/templates/workflows/verify-change.ts` — remove `taskRoutingBlock`, add CLI routing directive
- `src/core/templates/workflows/archive-change.ts` — remove `taskRoutingBlock`, add CLI routing directive
- `.claude/commands/ape/verify.md` — remove embedded Chinese routing table
- `.claude/commands/ape/archive.md` — remove embedded Chinese routing table
- `src/commands/workflow/instructions.ts` — no changes needed (already returns correct routing)
- `schemas/spec-driven/schema.yaml` — no changes needed (already has correct routing)
