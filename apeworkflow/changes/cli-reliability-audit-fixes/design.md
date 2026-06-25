## Context

The ApeWorkflow CLI codebase was audited for reliability, and 10 critical issues were identified spanning P0 (crashes), P1 (trapping users), and P2 (correctness/quality) severity levels. The issues affect multiple areas: core workflow logic, template consistency, UX/language, configuration, and command completeness.

**Current state:**
- `generateArchiveName` in `archive-change.ts` contains a dead code branch that causes crashes on archive name collisions
- `resolveEditRoots` in `workspace-planning.ts` is dead code that traps users in workspace planning mode
- `taskTypeRouting` configuration exists but the `type` field is unused, making routing non-functional
- The `verify` command is a skeleton with no actual verification logic
- `config.yaml` default values and comments contradict actual code defaults in `src/cli/config.ts`
- The `selectionPolicy` recommended value conflicts with the code default
- 4 files contain duplicate frontmatter blocks
- Chinese characters are mixed into English-language files
- Archived changes become invisible after being moved to the archive directory

**Constraints:**
- No breaking changes — all fixes must preserve existing behavior
- The code defaults in `src/cli/config.ts` are already correct; only `config.yaml` needs to be fixed
- Dead code removal must be done carefully — removing code that appears dead may still be reachable

## Goals / Non-Goals

**Goals:**
- Eliminate crash-inducing dead code paths (P0)
- Complete incomplete features to functional state (P1)
- Fix configuration consistency and language mixing (P2)
- Make archived changes discoverable again (P1)
- Achieve clean, consistent English across all user-facing strings

**Non-Goals:**
- Refactoring the overall CLI architecture
- Adding new commands beyond completing existing skeletons
- Changing the core workflow schema or artifact structure
- Internationalization (i18n) — all strings will be English only

## Decisions

### D1: Remove dead code branches rather than fix them

**Decision:** For `generateArchiveName` and `resolveEditRoots`, remove the dead code branches entirely rather than attempt to "fix" them in place.

**Rationale:** These branches represent code paths that were either incorrectly implemented or never completed. Fixing them in place would require significant re-architecture. Removing them and implementing the correct logic is cleaner and reduces the risk of introducing new bugs.

**Alternatives considered:**
- Fix in place: Would require understanding why the branch is "dead" and correcting it. Higher risk of subtle bugs.
- Add guard conditions: Would leave the dead code as commented-out legacy. Adds maintenance burden.

### D2: Implement verify from scratch rather than extend skeleton

**Decision:** The `verify` command skeleton shall be replaced with a complete implementation rather than incrementally extended.

**Rationale:** The skeleton is likely to be structurally incompatible with a proper implementation. Starting fresh ensures consistent validation logic that checks all artifact requirements uniformly.

**Alternatives considered:**
- Incremental extension: Risk of building on broken foundations and accumulating technical debt.

### D3: Batch fixes by impact area in implementation

**Decision:** Implementation should be organized into batches by impact area:
1. Core logic fixes (P0): dead code removal
2. Feature completion (P1): verify command, task type routing, archive visibility
3. Consistency fixes (P2): config defaults, language unification, duplicate frontmatter

**Rationale:** This order ensures that the most critical fixes (crash prevention) are implemented and tested first. Lower-risk fixes can be verified alongside each other. Each batch is self-contained and testable.

**Alternatives considered:**
- Fix by file: Would mix severity levels and make it harder to prioritize correctly.
- Fix by priority only: Would scatter related changes across different files, making review harder.

### D4: Archive visibility via opt-in flag

**Decision:** Archived changes will be visible by default via a `--include-archived` flag (or similar). The default listing behavior remains unchanged (no archived changes shown) to avoid breaking existing scripts or workflows.

**Rationale:** This preserves backward compatibility. Users who need to see archived changes can opt in. Changing default behavior could break automated scripts that parse change listings.

**Alternatives considered:**
- Always show archived: Simpler but breaks backward compatibility.
- Show archived by default, hide with flag: Reverses the burden on users who don't need archived changes.

### D5: Config.yaml as the source of truth for defaults

**Decision:** `config.yaml` defaults will be updated to match the code defaults in `src/cli/config.ts`. The code is considered correct; config.yaml documentation is wrong.

**Rationale:** The code is the runtime source of truth. If users configure values based on config.yaml comments, they would get unexpected behavior. Fixing config.yaml aligns documentation with reality.

**Alternatives considered:**
- Fix code to match config.yaml: Would require changing code defaults, which could affect existing users who depend on those defaults. Higher risk.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Removing "dead code" that is actually reachable | Add defensive logging before removal; write tests that hit the affected paths; review git history for context |
| Verify command changes break existing workflows | Implement verify as non-blocking by default; make it an opt-in command rather than a mandatory step |
| Config default changes surprise users relying on wrong defaults | Users depending on wrong config defaults would only be affected if they explicitly set those values — the fix only corrects documentation/comments and default values, not explicitly set config values |
| Archive visibility flag changes parsing for scripts | Use a clearly named flag (`--include-archived`) that scripts can filter on; document the change in release notes |
| Language normalization changes error message text | All changes are English-only normalization — the meaning and format remain the same, only language is corrected |

## Migration Plan

This change requires no migration. All fixes are self-contained:
- Dead code removal: no migration needed, just code change
- Feature completion: adds new functionality to existing commands
- Config defaults: only changes default values and comments; explicit user settings are unaffected
- Language fixes: no behavioral change
- Archive visibility: opt-in feature with backward-compatible defaults

Deploy in a single release — no phased rollout required.

## Open Questions

1. Should the `verify` command be made mandatory before workflow execution, or remain optional?
2. Should duplicate frontmatter removal be automated (tool-assisted) or done manually per file?
3. Is there a specific reason Chinese characters were introduced into English files — are they temporary placeholders or should they be translated?
