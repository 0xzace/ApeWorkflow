# cli-reliability-audit-fixes — Task Outline

## 1. Core Logic Fixes (P0)

- 1.1 Fix generateArchiveName: replace dead code branch with working collision-suffix logic in src/core/archive.ts, wire generateArchiveName into execute(), add unit tests for collision paths
- 1.2 Fix resolveEditRoots: wire resolveEditScope() from change-status-policy.ts into the templates that currently use hardcoded workspace-planning STOP logic, ensure it returns actionable edit scope instead of empty array
- 1.3 Add type field to TaskItem interface and parseTaskItems: add `type?: string` to src/commands/workflow/shared.ts TaskItem interface, update parseChecklistItems to extract optional `type:` prefix from task descriptions, update ApplyInstructions to include task types

## 2. Feature Completion (P1)

- 2.1 Implement verify command skeleton: create src/commands/verify.ts with artifact consistency checks (proposal presence, specs completeness, design sections, tasks checkbox validation, plans existence), output scorecard format with CRITICAL/WARNING/SUGGESTION priorities
- 2.2 Wire taskTypeRouting in apply-change: implement the actual type-based skill chain lookup in src/core/templates/workflows/apply-change.ts — parse task type from description, match against schema taskTypeRouting.taskTypes, fallback to default, execute matched skill chain
- 2.3 Add --include-archived flag to list commands: add flag to src/core/list.ts filtering, add flag to src/commands/change.ts list subcommand, output archived indicator column in table format

## 3. Consistency Fixes (P2)

- 3.1 Fix config.yaml default values: update config.yaml line 20 from `false` to `true` for TDD default, update apeworkflow/config.yaml line 20 similarly, ensure all commented defaults match src/core/project-config.ts DEFAULT_PROJECT_CONFIG
- 3.2 Unify language: replace Chinese characters in archive.md (lines 20 and 94) with English equivalents, ensure no CJK characters in any .claude/commands/ape/ or .claude/skills/*/SKILL.md files
- 3.3 Fix duplicate frontmatter: remove the second YAML frontmatter block from explore.md, propose.md, verify.md, and feedback.md, verify resulting files parse correctly
- 3.4 Align selectionPolicy: update verify.ts template recommended value from `always-prompt` to `auto-if-single`, update config.yaml comments to match
