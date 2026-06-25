## Why

A comprehensive audit of the CLI codebase uncovered 10 critical issues spanning P0 (crashes), P1 (trapping users), and P2 (correctness/quality) severity levels. These issues range from dead code causing archive collision crashes to incomplete commands, configuration contradictions, and UX inconsistencies. While none have caused user-facing incidents yet, the dead-code paths represent latent crash risks, and the incomplete features leave the CLI in a partially broken state.

## What Changes

- Remove `generateArchiveName` dead code branch in `archive-change.ts` that causes archive collision crashes
- Wire up `resolveEditRoots` in `workspace-planning` to replace dead code with actual workspace root resolution
- Add `type` field to task type routing configuration so taskTypeRouting actually routes by type
- Complete the `verify` command skeleton with actual verification logic
- Fix `config.yaml` default values so CLI comments and code defaults match
- Standardize language across files: remove Chinese characters from English files, unify error message language
- Fix `selectionPolicy` recommended value to align with code default
- Make archived changes visible in listing/management commands (currently archived changes are invisible forever)
- Remove duplicate frontmatter blocks from files that contain them

## Capabilities

### New Capabilities

- `dead-code-removal`: Remove unreachable/dead code branches that cause crashes (generateArchiveName collision path, resolveEditRoots dead path)
- `feature-completion`: Implement missing functionality in skeleton commands (verify command, task type routing)
- `config-defaults-fix`: Align config.yaml defaults, comments, and recommended values with actual code defaults
- `ux-unification`: Standardize language (English only) and unify error messages across the CLI
- `archive-visibility`: Make archived changes visible in CLI listing and management commands

### Modified Capabilities

- *(none)*

## Impact

**Affected code areas:**
- `src/core/templates/workflows/archive-change.ts` — generateArchiveName dead code
- `src/core/commands/workspace-planning.ts` — resolveEditRoots dead code
- `src/core/commands/verify.ts` — skeleton implementation
- `src/core/templates/workflows/taskTypeRouting.ts` — missing type field
- `src/cli/config.ts` — default values mismatch with config.yaml
- `apeworkflow/changes/*/proposal.md` — duplicate frontmatter
- `apeworkflow/changes/*/tasks.md` — duplicate frontmatter

**Risk surface:**
- The dead-code removal changes (P0) are the highest risk — removing code that appears unreachable but may still be hit requires careful review of the call paths
- Config default changes (P2) are low risk — the code defaults are already correct, we are only fixing the documentation/config files to match
- UX unification (P2) is no risk — language normalization with no behavioral change
- Archive visibility (P1) adds new behavior but does not change existing behavior

**Breaking changes:** None. All fixes preserve existing behavior while removing crash paths and completing partial implementations.
