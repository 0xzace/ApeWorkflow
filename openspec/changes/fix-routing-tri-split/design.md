# Design: Fix Routing Tri-Split

## Context

The ApeWorkflow CLI has three layers involved in task type routing:

```
Layer 1: schema.yaml (authoritative definition)
  taskTypeRouting:
    taskTypes:
      feature: [...]    ← English keys
      bugfix: [...]
      refactor: [...]
      docs: [...]

Layer 2: instructions.ts (runtime delivery)
  - Reads schema.yaml
  - Returns taskTypeRouting JSON with English keys
  - This works correctly

Layer 3: templates + installed files (AI consumption)
  - verify-change.ts: embeds Chinese keys via taskRoutingBlock
  - archive-change.ts: embeds Chinese keys via taskRoutingBlock
  - apply-change.ts: says "do not inline static table" (correct approach)
  - Installed .claude/commands/ape/verify.md: contains Chinese routing
  - Installed .claude/commands/ape/archive.md: contains Chinese routing
```

The problem: Layer 3 has Chinese keys, Layer 2 has English keys. When an AI agent reads Layer 3's file, it sees `功能开发 → [...]` but the CLI returns `{ feature: [...] }`. The lookup fails silently.

## Decisions

### Decision 1: Remove all hardcoded taskRoutingBlock from templates

**Approach**: Delete the `taskRoutingBlock` constant from both `verify-change.ts` and `archive-change.ts`, replacing it with a directive to call the CLI for routing.

**Rationale**: 
- `apply-change.ts` already follows this pattern ("Route selection is controlled by the active schema's taskTypeRouting")
- This means we only need to match one pattern, not invent a new one
- The CLI returns the actual routing at runtime, so embedding it in static files is always stale

**Trade-off**: The AI needs to make an extra CLI call. This adds ~2 seconds but is negligible compared to the overall verify/archive workflow.

### Decision 2: Use a shared constant for the routing directive

**Approach**: Create a shared template string in a common module (e.g., `routing-directive.ts`) that both verify-change and archive-change import. This ensures the directive text is identical across both files.

**Rationale**:
- `apply-change.ts` already has the directive
- If we add it to verify-change and archive-change manually, it will diverge over time (same problem as routing tables)
- A shared constant ensures consistency

**Trade-off**: Adds a new module. But the cost is one string constant, and the benefit is preventing future divergence.

### Decision 3: Clean up installed command files

**Approach**: After fixing the templates, manually clean up `.claude/commands/ape/verify.md` and `.claude/commands/ape/archive.md` to remove embedded routing tables.

**Rationale**:
- These are post-install files, not generated from templates currently
- They diverged from the templates via manual edits (visible in git diff)
- Cleaning them up separately prevents a "template fix but installed file still wrong" gap

**Trade-off**: Requires separate handling of installed files vs templates. Ideally, installed files would be auto-generated from templates on every `apeworkflow update` command.

## Implementation Plan

1. **Template fix**: Remove `taskRoutingBlock` from `verify-change.ts` and `archive-change.ts`, replace with CLI routing directive
2. **Command file fix**: Remove Chinese routing tables from `.claude/commands/ape/verify.md` and `.claude/commands/ape/archive.md`
3. **Verify**: Run `npm run build`, check that dist output is correct, run `apeworkflow instructions verify --json` to confirm routing is returned
4. **Test**: Validate the fix resolves the tri-split by confirming no Chinese keys remain in templates or installed files

## Risks

- **Risk**: Someone adds routing back to templates later
  - **Mitigation**: Add a lint check in CI that scans template files for routing-related keywords

- **Risk**: CLI call adds latency
  - **Mitigation**: The AI can cache the routing response. The routing rarely changes during a session.

- **Risk**: The directive text diverges from `apply-change.ts`
  - **Mitigation**: Shared constant (Decision 2)
