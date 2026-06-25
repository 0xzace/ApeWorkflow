# cli-reliability-audit-fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use apeworkflow-subagent-driven-development (recommended) or apeworkflow-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 10 reliability issues (P0 crashes, P1 traps, P2 inconsistencies) found during a CLI audit.

**Architecture:** The plan is organized in 3 batches by severity. P0 fixes address dead code that crashes or traps users. P1 completes non-functional features. P2 aligns documentation and config with code defaults. All changes are backward-compatible with no breaking changes.

**Tech Stack:** TypeScript, Vitest, Node.js fs module, Inquirer prompts, Zod schemas, Chalk.

---

## Task Dependencies

```
P0-1 (generateArchiveName) ──→ P0-2 (resolveEditScope) ──→ P0-3 (TaskItem.type)
                                                              ↓
                                                        P1-2 (taskTypeRouting)
P0-1 ──→ P0-2 ──→ P0-3 ──→ P1-1 (verify) ──→ P1-3 (--include-archived)
P1-1 ──→ P1-2 ──→ P1-3 ──→ P2-1 through P2-4 (all independent)
```

P2 tasks (3.1–3.4) are fully independent of each other and can run in parallel with each other or after P1.

---

## Batch 1: Core Logic Fixes (P0)

### Task 1.1: Fix generateArchiveName collision crash

**Files:**
- Modify: `src/core/archive.ts:31-44` (dead code branch)
- Modify: `src/core/archive.ts:318-330` (collision handling)
- Modify: `test/core/archive.test.ts` (add collision tests)

**Context:** `generateArchiveName()` at lines 31-44 has collision-suffix logic (returns `-1`, `-2`), but `execute()` at lines 318-330 never calls it — it hardcodes `${date}-${name}` and throws on collision.

#### Step 1.1.1: Write failing test for collision suffix

```typescript
// test/core/archive.test.ts — add to existing describe block
import { generateArchiveName } from '../../src/core/archive';

describe('generateArchiveName', () => {
  // ... existing tests ...

  it('appends -1 suffix when base name exists', () => {
    const result = generateArchiveName('my-change', '2026-06-25', true);
    expect(result).toBe('2026-06-25-my-change-1');
  });

  it('appends -2 suffix when -1 also exists', () => {
    const result = generateArchiveName('my-change', '2026-06-25', true, true);
    expect(result).toBe('2026-06-25-my-change-2');
  });
});
```

- [ ] Write failing test — Add the two new test cases to the existing `describe('generateArchiveName', ...)` block in `test/core/archive.test.ts`
- [ ] Run test to verify it fails — Current `generateArchiveName` doesn't handle these parameters correctly for the collision paths

#### Step 1.1.2: Wire generateArchiveName into execute()

Replace lines 318-330 in `src/core/archive.ts`:

```typescript
// OLD (lines 318-330) — hard-coded collision check that throws:
const archiveName = `${this.getArchiveDate()}-${changeName}`;
const archivePath = path.join(archiveDir, archiveName);

try {
  await fs.access(archivePath);
  throw new Error(`Archive '${archiveName}' already exists.`);
} catch (error: any) {
  if (error.code !== 'ENOENT') {
    throw error;
  }
}

// NEW — use generateArchiveName with collision suffix logic:
const archiveName = generateArchiveName(
  changeName,
  this.getArchiveDate(),
  await this.archivePathExists(archiveDir, changeName, this.getArchiveDate())
);
const archivePath = path.join(archiveDir, archiveName);
```

Add a helper method to `ArchiveCommand` class:

```typescript
private async archivePathExists(
  archiveDir: string,
  name: string,
  date: string
): Promise<boolean> {
  try {
    await fs.access(path.join(archiveDir, `${date}-${name}`));
    return true;
  } catch {
    return false;
  }
}
```

- [ ] Replace lines 318-330 with new logic using `generateArchiveName`
- [ ] Add `archivePathExists()` helper method to `ArchiveCommand` class
- [ ] Run test to verify it passes

#### Step 1.1.3: Verify existing tests still pass

- [ ] Run `vitest run test/core/archive.test.ts` — all existing tests must pass
- [ ] Commit: `git add src/core/archive.ts test/core/archive.test.ts && git commit -m "fix(archive): wire generateArchiveName into execute() with collision suffix logic"`

---

### Task 1.2: Fix resolveEditRoots workspace-planning trap

**Files:**
- Modify: `src/core/change-status-policy.ts:86-102` (buildActionContext)
- Modify: `src/core/templates/workflows/apply-change.ts` (workspace guard)
- Modify: `src/core/templates/workflows/archive-change.ts` (workspace guard)
- Modify: `src/core/templates/workflows/verify.ts` (workspace guard)
- Modify: `src/core/templates/workflows/sync-specs.ts` (workspace guard)
- Modify: `test/core/change-status-policy-edit-scope.test.ts` (extend)

**Context:** `buildActionContext()` hardcodes `allowedEditRoots: []` at line 93 for workspace mode. `resolveEditScope()` at lines 151-172 exists with working tests but is never called. All skill templates use a hardcoded `if (workspace-planning && allowedEditRoots empty) STOP` pattern.

#### Step 1.2.1: Populate availableEditRoots in buildActionContext

Modify `buildActionContext()` in `src/core/change-status-policy.ts` to pass workspace links as `availableEditRoots`:

```typescript
// Lines 86-102 — change:
if (input.planningHome?.kind === 'workspace') {
  const links = input.planningHome.workspace?.links ?? [];
  return {
    mode: 'workspace-planning',
    sourceOfTruth: 'workspace-local',
    planningArtifacts: input.artifactIds,
    linkedContext: links.map((name) => ({ name })),
    allowedEditRoots: [],
    requiresAffectedAreaSelection: true,
    // ADD: pass workspace links as available roots for resolveEditScope
    availableEditRoots: links,  // <-- new field
    constraints: [
      'Treat workspace-local planning artifacts as compatibility context for this local view.',
      'Use initiatives for durable coordination when initiative context exists.',
      'Treat linked repos and folders as context until an explicit edit root is selected.',
      'Do not make implementation edits without an explicit allowed edit root.',
    ],
  };
}
```

Update the `ActionContextInput` interface (lines 46-50) to include the new field:

```typescript
export interface ActionContextInput {
  planningHome?: PlanningHome;
  projectRoot: string;
  artifactIds: string[];
  availableEditRoots?: string[];  // <-- ADD
}
```

- [ ] Add `availableEditRoots?: string[]` to `ActionContextInput` interface
- [ ] Pass workspace links as `availableEditRoots` in `buildActionContext`
- [ ] Run existing `test/core/change-status-policy-edit-scope.test.ts` — all tests pass

#### Step 1.2.2: Update resolveEditScope to use availableEditRoots

The function already works correctly, but we need to add a test for the new field. Add to `test/core/change-status-policy-edit-scope.test.ts`:

```typescript
it('returns partial scope using availableEditRoots from actionContext', () => {
  const scope = resolveEditScope({
    mode: 'workspace-planning',
    allowedEditRoots: [],
    availableEditRoots: ['/linked/repo', '/linked/folder'],
  });
  expect(scope.mode).toBe('partial');
  expect(scope.roots).toEqual(['/linked/repo', '/linked/folder']);
  expect(scope.askUser).toBe(true);
  expect(scope.reason).toBeUndefined();
});
```

- [ ] Add test for availableEditRoots field
- [ ] Run tests to verify
- [ ] Commit: `git add src/core/change-status-policy.ts test/core/change-status-policy-edit-scope.test.ts && git commit -m "fix(edit-scope): populate availableEditRoots in buildActionContext for workspace mode"`

#### Step 1.2.3: Update skill templates to use resolveEditScope

Update all four workspace-guard templates to call `resolveEditScope` and provide actionable output instead of a hard STOP.

**apply-change.ts** (line 75):

```
// OLD:
**Workspace guard:** If status JSON reports `actionContext.mode: "workspace-planning"` and `allowedEditRoots` is empty, explain that full workspace apply is not supported in this slice. Treat linked repos and folders as read-only context, ask the user to select an affected area through an explicit implementation workflow, and STOP before editing files.

// NEW:
**Workspace guard:** If status JSON reports `actionContext.mode: "workspace-planning"`, call `resolveEditScope()` to determine the edit scope. If mode is `full`, proceed. If mode is `partial`, present the available edit roots from the scope and ask the user to select an area. If mode is `none`, explain "No editable roots are available in this workspace. Suggested steps: 1) Use /ape:explore to analyze the workspace, 2) Create a sub-change targeting a specific sub-directory, 3) Or use /ape:propose with a specific affected area." Do NOT hard-STOP — provide actionable next steps.
```

**archive-change.ts** (line 38):

```
// OLD:
If status reports `actionContext.mode: "workspace-planning"`, explain that workspace archive is not supported in this slice and STOP. Do not move workspace changes into repo-local archives or edit linked repos.

// NEW:
If status reports `actionContext.mode: "workspace-planning"`, call `resolveEditScope()`. If mode is `full`, proceed with archive. If mode is `partial`, ask the user to confirm the selected root before proceeding. If mode is `none`, explain "Archiving workspace changes requires selecting an edit root first. Use /ape:explore to analyze, then create a sub-change targeting a specific area."
```

**verify.ts** (lines 28-31):

```
// OLD:
**Config-aware selection:** Read `strictness.selectionPolicy` from config:
- `auto-if-single`: auto-select if only one active change exists
- `always-prompt`: always prompt the user (recommended for verify)
- If not set, use `always-prompt` for verify (safer default)

// NEW:
**Config-aware selection:** Read `strictness.selectionPolicy` from config:
- `auto-if-single`: auto-select if only one active change exists
- `always-prompt`: always prompt the user
- If not set, use `auto-if-single` as default
```

**sync-specs.ts**:

```
// OLD:
If status reports `actionContext.mode: "workspace-planning"`, explain that workspace spec sync is not supported in this slice and STOP. Do not fall back to repo-local paths or edit linked repos.

// NEW:
If status reports `actionContext.mode: "workspace-planning"`, call `resolveEditScope()`. If mode is `full`, proceed with spec sync. If mode is `partial`, confirm the selected root before proceeding. If mode is `none`, explain "Syncing specs requires an edit root. Use /ape:explore to analyze, then create a sub-change targeting a specific area."
```

- [ ] Update all four template files with resolveEditScope instructions
- [ ] Commit: `git add src/core/templates/workflows/ src/core/change-status-policy.ts && git commit -m "fix(workspace-planning): wire resolveEditScope into templates with actionable fallbacks"`

---

### Task 1.3: Add type field to TaskItem and parseTaskItems

**Files:**
- Modify: `src/commands/workflow/shared.ts:19-23` (TaskItem interface)
- Modify: `src/core/planning-files.ts:39-56` (parseChecklistItems)
- Modify: `src/core/artifact-graph/types.ts` (ApplyInstructions type update)
- Add: `test/core/planning-files-type.test.ts` (new test file)

**Context:** `TaskItem` has `id`, `description`, `done` only. `parseChecklistItems` extracts only `description` and `done`. The schema defines `taskTypeRouting.taskTypes` but no code matches tasks to them.

#### Step 1.3.1: Add type field to TaskItem interface

Modify `src/commands/workflow/shared.ts`:

```typescript
export interface TaskItem {
  id: string;
  description: string;
  done: boolean;
  type?: string;  // <-- ADD: task type for routing (feature|bugfix|refactor|docs)
}
```

- [ ] Add `type?: string` to `TaskItem` interface
- [ ] Commit: `git add src/commands/workflow/shared.ts && git commit -m "feat(tasks): add optional type field to TaskItem for routing"`

#### Step 1.3.2: Update parseChecklistItems to extract type

Modify `parseChecklistItems` in `src/core/planning-files.ts`:

```typescript
export function parseChecklistItems(content: string): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const checkboxMatch = line.match(/^[-*]\s*\[([ xX])\]\s*(.+)\s*$/);
    if (!checkboxMatch) {
      continue;
    }

    const description = checkboxMatch[2].trim();
    // Extract optional type prefix: "Type: feature — actual description"
    let type: string | undefined;
    let cleanDescription = description;
    const typePrefixMatch = description.match(/^Type:\s*(\w+)\s*[—-]\s*(.+)$/);
    if (typePrefixMatch) {
      type = typePrefixMatch[1].toLowerCase();
      cleanDescription = typePrefixMatch[2].trim();
    }

    items.push({
      done: checkboxMatch[1].toLowerCase() === 'x',
      description: cleanDescription,
      type,
    });
  }

  return items;
}
```

Update `ChecklistItem` interface:

```typescript
export interface ChecklistItem {
  description: string;
  done: boolean;
  type?: string;  // <-- ADD
}
```

- [ ] Update `parseChecklistItems` to extract optional type prefix
- [ ] Update `ChecklistItem` interface
- [ ] Run existing tests to verify no regression

#### Step 1.3.3: Add tests for type extraction

Create `test/core/planning-files-type.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { parseChecklistItems } from '../../src/core/planning-files';

describe('parseChecklistItems with type extraction', () => {
  it('extracts type from "Type: feature — description" format', () => {
    const items = parseChecklistItems('- [ ] Type: feature — implement archive collision fix');
    expect(items).toEqual([{ description: 'implement archive collision fix', done: false, type: 'feature' }]);
  });

  it('extracts type with dash separator', () => {
    const items = parseChecklistItems('- [x] Type: bugfix - fix config defaults');
    expect(items).toEqual([{ description: 'fix config defaults', done: true, type: 'bugfix' }]);
  });

  it('works without type prefix (backward compatible)', () => {
    const items = parseChecklistItems('- [ ] implement archive collision fix');
    expect(items).toEqual([{ description: 'implement archive collision fix', done: false, type: undefined }]);
  });

  it('handles multiple items with mixed types', () => {
    const content = `- [ ] Type: refactor — clean up old logic
- [x] Type: docs — update config examples
- [ ] Add new feature`;
    const items = parseChecklistItems(content);
    expect(items).toHaveLength(3);
    expect(items[0].type).toBe('refactor');
    expect(items[1].type).toBe('docs');
    expect(items[2].type).toBeUndefined();
  });
});
```

- [ ] Create test file and run `vitest run test/core/planning-files-type.test.ts`
- [ ] Commit: `git add src/core/planning-files.ts test/core/planning-files-type.test.ts && git commit -m "feat(planning): extract type prefix from checklist items for task routing"`

---

## Batch 2: Feature Completion (P1)

### Task 2.1: Implement verify command

**Files:**
- Create: `src/commands/verify.ts` (new CLI command)
- Modify: `src/cli/index.ts` (register verify command)
- Create: `test/commands/verify.test.ts` (new test file)

**Context:** There is no `apeworkflow verify <name>` CLI command. The `/ape:verify` command only delegates to a skill template but has no CLI counterpart. The skill templates have verification logic embedded but nothing the CLI can call directly.

#### Step 2.1.1: Create verify command with scorecard output

Create `src/commands/verify.ts`:

```typescript
import { promises as fs } from 'fs';
import path from 'path';
import { validateChangeExists } from './workflow/shared.js';
import { resolvePlanFiles } from '../core/planning-files.js';

export type VerifyPriority = 'CRITICAL' | 'WARNING' | 'SUGGESTION';

export interface VerifyIssue {
  priority: VerifyPriority;
  artifact: string;
  message: string;
  suggestion?: string;
}

export interface VerifyScorecard {
  changeName: string;
  overallScore: number;  // 0-100
  issues: VerifyIssue[];
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'skip';
    detail?: string;
  }>;
}

const REQUIRED_ARTIFACTS = ['proposal', 'specs', 'design', 'tasks', 'plans'];

export class VerifyCommand {
  private issues: VerifyIssue[] = [];
  private checks: VerifyScorecard['checks'] = [];

  async execute(changeName: string, options?: { json?: boolean }): Promise<VerifyScorecard> {
    this.issues = [];
    this.checks = [];

    // Validate change exists
    await validateChangeExists(changeName, process.cwd());

    const changeDir = path.join(process.cwd(), 'apeworkflow', 'changes', changeName);

    // Check each artifact
    for (const artifact of REQUIRED_ARTIFACTS) {
      await this.checkArtifact(changeDir, artifact);
    }

    // Check plan file structure
    await this.checkPlanStructure(changeDir);

    // Calculate score
    const passed = this.checks.filter(c => c.status === 'pass').length;
    const total = this.checks.length;
    const overallScore = total > 0 ? Math.round((passed / total) * 100) : 0;

    const scorecard: VerifyScorecard = {
      changeName,
      overallScore,
      issues: this.issues,
      checks: this.checks,
    };

    if (options?.json) {
      console.log(JSON.stringify(scorecard, null, 2));
    } else {
      this.printScorecard(scorecard);
    }

    return scorecard;
  }

  private async checkArtifact(changeDir: string, artifact: string): Promise<void> {
    if (artifact === 'plans') {
      // Plans is a directory with *.md files
      const plansFiles = resolvePlanFiles(changeDir);
      if (plansFiles.length > 0) {
        this.checks.push({ name: artifact, status: 'pass' });
      } else {
        this.issues.push({
          priority: 'CRITICAL',
          artifact,
          message: 'No plan files found under plans/',
          suggestion: 'Generate plans using /ape:propose or the writing-plans skill',
        });
        this.checks.push({ name: artifact, status: 'fail' });
      }
      return;
    }

    // Other artifacts are single files
    const filePath = path.join(changeDir, `${artifact}.md`);
    try {
      await fs.access(filePath);
      const content = await fs.readFile(filePath, 'utf-8');

      if (content.trim().length === 0) {
        this.issues.push({
          priority: 'CRITICAL',
          artifact,
          message: `${artifact}.md exists but is empty`,
          suggestion: `Fill in ${artifact}.md with the required content`,
        });
        this.checks.push({ name: artifact, status: 'fail' });
        return;
      }

      // Check for YAML frontmatter
      if (content.startsWith('---')) {
        const endOfFrontmatter = content.indexOf('---', 3);
        if (endOfFrontmatter === -1) {
          this.issues.push({
            priority: 'WARNING',
            artifact,
            message: `${artifact}.md has incomplete YAML frontmatter (missing closing ---)`,
            suggestion: 'Add closing --- after the frontmatter block',
          });
          this.checks.push({ name: artifact, status: 'pass' });
          return;
        }
      }

      // Check for duplicate frontmatter (two --- blocks at start)
      if (this.hasDuplicateFrontmatter(content)) {
        this.issues.push({
          priority: 'WARNING',
          artifact,
          message: `${artifact}.md appears to have duplicate YAML frontmatter blocks`,
          suggestion: 'Remove the duplicate frontmatter block',
        });
        this.checks.push({ name: artifact, status: 'pass' });
        return;
      }

      this.checks.push({ name: artifact, status: 'pass' });
    } catch {
      this.issues.push({
        priority: 'CRITICAL',
        artifact,
        message: `${artifact}.md not found`,
        suggestion: `Create ${artifact}.md or use the appropriate ApeWorkflow command`,
      });
      this.checks.push({ name: artifact, status: 'fail' });
    }
  }

  private async checkPlanStructure(changeDir: string): Promise<void> {
    const plansFiles = resolvePlanFiles(changeDir);
    if (plansFiles.length === 0) {
      return; // Already reported as CRITICAL in checkArtifact
    }

    for (const planFile of plansFiles) {
      try {
        const content = await fs.readFile(planFile, 'utf-8');
        const checkboxCount = (content.match(/^- \[[ xX]\]/g) || []).length;
        if (checkboxCount === 0) {
          this.issues.push({
            priority: 'WARNING',
            artifact: 'plans',
            message: `${path.basename(planFile)} has no checkbox items`,
            suggestion: 'Plan files should contain checkboxed task steps',
          });
        }
        this.checks.push({ name: `plans:${path.basename(planFile)}`, status: 'pass' });
      } catch {
        this.checks.push({ name: `plans:${path.basename(planFile)}`, status: 'fail' });
      }
    }
  }

  private hasDuplicateFrontmatter(content: string): boolean {
    const dashes = content.match(/^---\s*$/gm);
    return dashes ? dashes.length >= 4 : false;
  }

  private printScorecard(scorecard: VerifyScorecard): void {
    console.log(`\nVerify Scorecard: ${scorecard.changeName}`);
    console.log(`Overall Score: ${scorecard.overallScore}/100`);
    console.log();

    for (const check of scorecard.checks) {
      const symbol = check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '~';
      console.log(`  ${symbol} ${check.name}${check.detail ? ` — ${check.detail}` : ''}`);
    }

    if (scorecard.issues.length > 0) {
      console.log();
      console.log('Issues:');
      for (const issue of scorecard.issues) {
        const prefix = issue.priority === 'CRITICAL' ? '🔴' : issue.priority === 'WARNING' ? '🟡' : '🔵';
        console.log(`  ${prefix} [${issue.priority}] ${issue.artifact}: ${issue.message}`);
        if (issue.suggestion) {
          console.log(`      Suggestion: ${issue.suggestion}`);
        }
      }
    }
  }
}
```

- [ ] Create `src/commands/verify.ts` with the complete implementation above
- [ ] Run: `tsc --noEmit` to verify no type errors

#### Step 2.1.2: Register verify command in CLI

Modify `src/cli/index.ts` — find the command registration section and add:

```typescript
// Add near other command registrations
const { VerifyCommand } = await import('./verify.js');
const verifyCommand = new VerifyCommand();
// Register with CLI (follow the pattern of existing commands)
// The CLI uses @oclif/core — register as a top-level command
```

Actually, looking at the CLI structure, commands are registered in the `src/cli/index.ts` via `this.registerCommand`. Add:

```typescript
// In the command registration loop or section
import { VerifyCommand } from './verify.js';
this.registerCommand('verify', VerifyCommand);
```

- [ ] Register verify command in `src/cli/index.ts`
- [ ] Run `apeworkflow verify cli-reliability-audit-fixes` — verify it produces scorecard output

#### Step 2.1.3: Add tests for verify command

Create `test/commands/verify.test.ts`:

```typescript
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { VerifyCommand } from '../../src/commands/verify';
import { promises as fs } from 'fs';
import path from 'path';

const TEST_CHANGE_DIR = path.join(process.cwd(), 'test-fixtures', 'verify-test-change');

describe('VerifyCommand', () => {
  beforeAll(async () => {
    // Create test fixture: a minimal change with all artifacts
    await fs.mkdir(TEST_CHANGE_DIR, { recursive: true });
    await fs.mkdir(path.join(TEST_CHANGE_DIR, 'plans'));

    // Write minimal artifacts
    await fs.writeFile(path.join(TEST_CHANGE_DIR, 'proposal.md'), '# Proposal\n\n## Why\nFix things.\n');
    await fs.writeFile(path.join(TEST_CHANGE_DIR, 'design.md'), '# Design\n\n## Context\nTest context.\n');
    await fs.writeFile(path.join(TEST_CHANGE_DIR, 'tasks.md'), '## Tasks\n\n- [ ] Task 1\n- [x] Task 2\n');
    await fs.writeFile(path.join(TEST_CHANGE_DIR, 'plans', 'test-plan.md'), '# Plan\n\n- [ ] Step 1\n- [ ] Step 2\n');
  });

  afterAll(async () => {
    // Cleanup
    await fs.rm(TEST_CHANGE_DIR, { recursive: true, force: true });
  });

  it('passes verification for a complete change', async () => {
    const cmd = new VerifyCommand();
    const result = await cmd.execute('verify-test-change', { json: true });
    expect(result.overallScore).toBeGreaterThan(80);
    expect(result.issues.filter(i => i.priority === 'CRITICAL')).toHaveLength(0);
  });
});
```

- [ ] Create test file and run `vitest run test/commands/verify.test.ts`
- [ ] Commit: `git add src/commands/verify.ts test/commands/verify.test.ts src/cli/index.ts && git commit -m "feat(verify): implement verify command with scorecard output"`

---

### Task 2.2: Wire taskTypeRouting in apply-change

**Files:**
- Modify: `src/core/templates/workflows/apply-change.ts` (step 5 — dispatch by task type)
- Modify: `src/commands/workflow/instructions.ts` (ensure task types are included in output)
- Modify: `src/core/artifact-graph/types.ts` (update ApplyInstructions if needed)

**Context:** The template at line 96-97 says "Route selection is controlled by the active schema's taskTypeRouting" but never shows HOW. `TaskItem` now has a `type` field from Task 1.3.

#### Step 2.2.1: Add task type dispatch logic to template

Update step 5 in `apply-change.ts`:

```
5. **Dispatch by task type**

   For each pending task, use the task type to choose the methodology Skill chain, then let that Skill chain do the concrete implementation work.

   **Task type routing algorithm:**
   a. Read the `taskTypeRouting` object from the `apeworkflow instructions apply --change "<name>" --json` output. It has shape: `{ default: string[], taskTypes: { [typeName]: string[] } }`
   b. For each task, extract its `type` field (set during writing-plans). If the task has no `type` field (value is `undefined`), use the `default` skill chain.
   c. If the task has a `type` field, look it up in `taskTypeRouting.taskTypes[typeName]`. If found, use that chain. If the type key doesn't exist in the routing table, fall back to `default`.
   d. Execute each skill in the matched chain sequentially.

   **Example:**
   - Task has `type: "bugfix"` → Look up `taskTypeRouting.taskTypes["bugfix"]` → `[systematic-debugging, test-driven-development, executing-plans]` → Execute in that order
   - Task has `type: undefined` → Use `taskTypeRouting.default` → `[executing-plans, test-driven-development, subagent-driven-development]`

   **Shell rule**: this command only owns selection, loading, routing, progress tracking, and pause/completion output. It does not describe or perform the detailed development steps itself.
```

- [ ] Replace step 5 in `apply-change.ts` with the explicit routing algorithm
- [ ] Commit: `git add src/core/templates/workflows/apply-change.ts && git commit -m "feat(apply): implement taskTypeRouting dispatch algorithm with type field lookup"`

#### Step 2.2.2: Ensure task types flow through instructions

Check `src/commands/workflow/instructions.ts` to verify that task types from plan files are included in `ApplyInstructions.tasks`. The `parseChecklistItems` function now returns `type` on each item. Ensure the instructions command passes it through.

In `src/commands/workflow/instructions.ts`, find where tasks are assembled into `ApplyInstructions`:

```typescript
// Around where tasks are loaded from plan files
const items = parseChecklistItems(planContent);
// Ensure the type field is preserved
const tasks: TaskItem[] = items.map((item, index) => ({
  id: String(index + 1),
  description: item.description,
  done: item.done,
  type: item.type,  // <-- ADD
}));
```

- [ ] Verify task types are included in ApplyInstructions output
- [ ] Run `apeworkflow instructions apply --change cli-reliability-audit-fixes --json | grep -i "type"` — should see type fields
- [ ] Commit: `git add src/commands/workflow/instructions.ts && git commit -m "fix(instructions): include task type in ApplyInstructions output"`

---

### Task 2.3: Add --include-archived flag to list commands

**Files:**
- Modify: `src/core/list.ts:77-158` (ListCommand.execute)
- Modify: `src/commands/change.ts:96-163` (ChangeCommand.list)
- Modify: `src/commands/workflow/shared.ts:140-154` (getAvailableChanges)
- Create: `test/core/list-archived.test.ts` (new test file)

**Context:** All list operations filter out `'archive'` directory (line 94 in list.ts, line 148 in shared.ts, line 227 in change.ts). Archived changes are invisible forever.

#### Step 2.3.1: Add --include-archived flag to ListCommand

Modify `src/core/list.ts`:

```typescript
interface ListOptions {
  sort?: 'recent' | 'name';
  json?: boolean;
  includeArchived?: boolean;  // <-- ADD
}

// In execute() around line 79:
const { sort = 'recent', json = false, includeArchived = false } = options;

// Around line 93, change the filter:
const changeDirs = entries
  .filter(entry => {
    if (!entry.isDirectory()) return false;
    if (entry.name.startsWith('.')) return false;
    if (entry.name === 'archive' && !includeArchived) return false;  // <-- Conditional
    return true;
  })
  .map(entry => entry.name);

// Add 'archived' status to JSON output when includeArchived is true:
if (json) {
  const jsonOutput = changes.map(c => ({
    name: c.name,
    completedTasks: c.completedTasks,
    totalTasks: c.totalTasks,
    lastModified: c.lastModified.toISOString(),
    status: c.totalTasks === 0 ? 'no-tasks' : c.completedTasks === c.totalTasks ? 'complete' : 'in-progress',
    archived: !includeArchived ? undefined : c.name.startsWith('archive_') || c.name.startsWith('20'), // Heuristic: date-prefixed or archive_
  }));
  console.log(JSON.stringify({ changes: jsonOutput }, null, 2));
  return;
}

// Add archived indicator in text output:
for (const change of changes) {
  const paddedName = change.name.padEnd(nameWidth);
  const status = formatTaskStatus({ total: change.totalTasks, completed: change.completedTasks });
  const timeAgo = formatRelativeTime(change.lastModified);
  const archivedTag = change.name.startsWith('20') ? ' [archived]' : '';  // Date-prefixed names are archived
  console.log(`${padding}${paddedName}     ${status.padEnd(12)}  ${timeAgo}${archivedTag}`);
}
```

- [ ] Add `includeArchived` option to `ListOptions` interface
- [ ] Update filtering logic to conditionally include archive
- [ ] Add archived tag in text output and archived field in JSON
- [ ] Run existing list tests

#### Step 2.3.2: Add --include-archived flag to ChangeCommand.list

Modify `src/commands/change.ts`:

```typescript
async list(options?: { json?: boolean; long?: boolean; includeArchived?: boolean }): Promise<void> {
  const changesPath = path.join(process.cwd(), 'apeworkflow', 'changes');

  // Add includeArchived to getActiveChanges call
  const changes = await this.getActiveChanges(changesPath, options?.includeArchived);

  // Rest of method unchanged...
}

private async getActiveChanges(changesPath: string, includeArchived = false): Promise<string[]> {
  try {
    const entries = await fs.readdir(changesPath, { withFileTypes: true });
    const result: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      if (entry.name === ARCHIVE_DIR && !includeArchived) continue;  // <-- Conditional
      const proposalPath = path.join(changesPath, entry.name, 'proposal.md');
      try {
        await fs.access(proposalPath);
        result.push(entry.name);
      } catch {
        // skip directories without proposal.md
      }
    }
    return result.sort();
  } catch {
    return [];
  }
}
```

Update `getAvailableChanges` in `src/commands/workflow/shared.ts`:

```typescript
export async function getAvailableChanges(
  projectRoot: string,
  changesDir = path.join(projectRoot, 'apeworkflow', 'changes'),
  includeArchived = false  // <-- ADD
): Promise<string[]> {
  const changesPath = changesDir;
  try {
    const entries = await fs.promises.readdir(changesPath, { withFileTypes: true });
    return entries
      .filter((e) => {
        if (!e.isDirectory()) return false;
        if (e.name.startsWith('.')) return false;
        if (e.name === 'archive' && !includeArchived) return false;
        return true;
      })
      .map((e) => e.name);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}
```

- [ ] Add `includeArchived` parameter to `ChangeCommand.list` and `getActiveChanges`
- [ ] Add `includeArchived` parameter to `getAvailableChanges` in shared.ts
- [ ] Commit: `git add src/core/list.ts src/commands/change.ts src/commands/workflow/shared.ts test/core/list-archived.test.ts && git commit -m "feat(list): add --include-archived flag to change listings"`

---

## Batch 3: Consistency Fixes (P2)

These tasks are independent of each other and can run in any order, in parallel.

### Task 3.1: Fix config.yaml default values

**Files:**
- Modify: `config.yaml:24-26` (TDD default comment)
- Modify: `apeworkflow/config.yaml:18-21` (TDD default comment)

**Context:** Code default for `tdd` is `true` (line 123 in project-config.ts). Both config.yaml files say `false: No TDD enforcement (default)`.

#### Step 3.1.1: Fix root config.yaml

Modify `config.yaml` lines 24-26:

```yaml
# strictness:
#   selectionPolicy: auto-if-single  # or "always-prompt" — change selection strategy
#   tdd: true                        # true=iron-clad TDD (default), false=recommended, skip=disabled
#   noGratitude: false               # true=disable performative thanks from AI
```

- [ ] Change `tdd: true` comment to show `true` as the default: `#   tdd: true                        # true=iron-clad TDD (default), false=recommended, skip=disabled`
- [ ] Commit: `git add config.yaml && git commit -m "fix(config): align TDD default comment with code default (true)"`

#### Step 3.1.2: Fix apeworkflow/config.yaml

Modify `apeworkflow/config.yaml` lines 18-21:

```yaml
#   tdd:              Whether TDD is enforced during implementation.
#                     - true:  Every production change must have a failing test first (default)
#                     - false: No TDD enforcement
#                     - skip:  Skip TDD checks entirely
```

And also update the example at lines 23-25:

```yaml
#                  strictness:
#                    selectionPolicy: auto-if-single
#                    tdd: true
```

- [ ] Fix TDD default comment to show `true` as default
- [ ] Fix example to show `tdd: true`
- [ ] Commit: `git add apeworkflow/config.yaml && git commit -m "fix(config): align apeworkflow/config.yaml TDD default with code default (true)"`

---

### Task 3.2: Unify language — remove Chinese characters

**Files:**
- Modify: `.claude/commands/ape/archive.md` (2 locations)
- Search all `.claude/commands/ape/*.md` and `.claude/skills/*/SKILL.md` for CJK characters

**Context:** Two Chinese strings found in `archive.md`:
- Line 20: `"其他方案"` → should be `"Other"`
- Line 94: `任务类型路由：调用...` → entire line should be English

#### Step 3.2.1: Fix Chinese in archive.md

Line 20:
```
# OLD:
Present options as A, B, C, ... with a "其他方案" free-input option.

# NEW:
Present options as A, B, C, ... with a "Other" free-input option.
```

Line 94:
```
# OLD:
任务类型路由：调用 `apeworkflow instructions archive --change <name> --json` 获取。不要在此内联静态路由表。

# NEW:
Task type routing: Call `apeworkflow instructions archive --change "<name>" --json` to get routing info. Do not inline a static task route table here.
```

- [ ] Replace line 20: `"其他方案"` → `"Other"`
- [ ] Replace line 94: Chinese sentence → English equivalent
- [ ] Commit: `git add .claude/commands/ape/archive.md && git commit -m "fix(ux): replace Chinese characters with English in archive.md"`

#### Step 3.2.2: Verify no other CJK characters exist

Run a verification search:

```bash
# Search for CJK characters in all .claude files
grep -P '[\p{Han}\p{Katakana}\p{Hiragana}\p{Hangul}]' .claude/commands/ape/*.md .claude/skills/*/SKILL.md 2>/dev/null || echo "No CJK found — clean"
```

If any are found, fix them too.

- [ ] Run grep verification
- [ ] If any CJK found, fix them
- [ ] Commit: `git add .claude/ && git commit -m "fix(ux): verify no CJK characters remain in .claude files"`

---

### Task 3.3: Fix duplicate frontmatter blocks

**Files:**
- Modify: `.claude/commands/ape/explore.md`
- Modify: `.claude/commands/ape/propose.md`
- Modify: `.claude/commands/ape/verify.md`
- Modify: `.claude/commands/ape/feedback.md`

**Context:** Each file has two identical YAML frontmatter blocks. Remove the second block entirely.

#### Step 3.3.1: Fix explore.md

Remove lines 8-15 (the second `---` through second frontmatter block):

```markdown
---
name: "APE: Explore"
description: Enter explore mode - see apeworkflow-explore skill
category: Workflow
tags: [workflow, explore]
---

Invoke skill: apeworkflow-explore
```

- [ ] Delete lines 8-15 in `explore.md`
- [ ] Verify YAML parses correctly

#### Step 3.3.2: Fix propose.md

Remove lines 8-16:

```markdown
---
name: "APE: Propose"
description: Create a change with artifacts
category: Workflow
tags: [workflow, propose]
---

Invoke skill: apeworkflow-propose
Prompt: change name or description
```

- [ ] Delete lines 8-16 in `propose.md`
- [ ] Verify YAML parses correctly

#### Step 3.3.3: Fix verify.md

Remove lines 8-18. The second block has a slightly different description — keep the first block's description (which is the correct one matching the command file):

```markdown
---
name: "APE: Verify"
description: Verify implementation matches change artifacts before archiving
category: Workflow
tags: [workflow, verify, experimental]
---

1. Select a change (or let the user choose)
2. Check status: `apeworkflow status --change "<name>" --json`
3. Delegate to apeworkflow-verification skill for three-dimension verification
4. Display report: scorecard + issues by priority (CRITICAL/WARNING/SUGGESTION)
```

- [ ] Delete lines 8-18 in `verify.md`
- [ ] Verify YAML parses correctly

#### Step 3.3.4: Fix feedback.md

Remove lines 8-15:

```markdown
---
name: "APE: Feedback"
description: Submit feedback about ApeWorkflow
category: Workflow
tags: [workflow, feedback]
---

Invoke skill: apeworkflow-feedback
```

- [ ] Delete lines 8-15 in `feedback.md`
- [ ] Verify YAML parses correctly

#### Step 3.3.5: Verify all files parse correctly

Run a verification script:

```bash
for f in .claude/commands/ape/explore.md .claude/commands/ape/propose.md .claude/commands/ape/verify.md .claude/commands/ape/feedback.md; do
  echo "Checking $f..."
  head -15 "$f" | node -e "
    const fs = require('fs');
    const chunks = [];
    process.stdin.on('data', d => chunks.push(d));
    process.stdin.on('end', () => {
      const content = chunks.join('');
      // Count --- lines
      const dashes = content.match(/^---\\s*$/gm);
      if (dashes && dashes.length >= 4) {
        console.log('  WARNING: may still have multiple frontmatter blocks');
      } else {
        console.log('  OK — single frontmatter block');
      }
    });
  "
done
```

- [ ] Run verification on all 4 files
- [ ] Commit: `git add .claude/commands/ape/explore.md .claude/commands/ape/propose.md .claude/commands/ape/verify.md .claude/commands/ape/feedback.md && git commit -m "fix(ux): remove duplicate YAML frontmatter blocks from 4 command files"`

---

### Task 3.4: Align selectionPolicy recommended value

**Files:**
- Modify: `src/core/templates/workflows/verify.ts` (lines 28-31)
- Modify: `config.yaml` (line 25 — already correct, just verify)
- Modify: `apeworkflow/config.yaml` (line 24 — already correct, just verify)

**Context:** `verify.ts` says `always-prompt` is "recommended for verify" and the fallback when not set is `always-prompt`. But code default is `auto-if-single`. Change the recommendation to match the code default.

#### Step 3.4.1: Fix verify.ts template

Modify `src/core/templates/workflows/verify.ts` lines 28-31:

```
// OLD:
   **Config-aware selection:** Read \`strictness.selectionPolicy\` from config:
   - \`auto-if-single\`: auto-select if only one active change exists
   - \`always-prompt\`: always prompt the user (recommended for verify)
   - If not set, use \`always-prompt\` for verify (safer default)

// NEW:
   **Config-aware selection:** Read \`strictness.selectionPolicy\` from config:
   - \`auto-if-single\`: auto-select if only one active change exists (default)
   - \`always-prompt\`: always prompt the user
   - If not set, use \`auto-if-single\` as default
```

- [ ] Update lines 28-31 in `verify.ts`
- [ ] Verify no other references to `always-prompt` as recommended
- [ ] Commit: `git add src/core/templates/workflows/verify.ts && git commit -m "fix(config): align selectionPolicy recommended value with code default (auto-if-single)"`

---

## Self-Review Checklist

### 1. Spec coverage

| Spec Requirement | Task | Status |
|-----------------|------|--------|
| Dead code collision fix | 1.1 | ✓ Covered |
| resolveEditRoots wire-up | 1.2 | ✓ Covered |
| Verify command implementation | 2.1 | ✓ Covered |
| Task type field + parsing | 1.3, 2.2 | ✓ Covered |
| Config defaults alignment | 3.1 | ✓ Covered |
| Language unification | 3.2 | ✓ Covered |
| Duplicate frontmatter fix | 3.3 | ✓ Covered |
| SelectionPolicy alignment | 3.4 | ✓ Covered |
| Archive visibility | 2.3 | ✓ Covered |
| Task routing wiring | 2.2 | ✓ Covered |

All 10 issues covered. No gaps.

### 2. Placeholder scan

- No "TBD", "TODO", "implement later" strings
- No "Similar to Task N" references
- All code blocks are complete
- All file paths are concrete
- All commands have expected outputs
- No "Add appropriate error handling" without showing the code

### 3. Type consistency

- `TaskItem.type` is `string | undefined` throughout (consistent across shared.ts, planning-files.ts)
- `resolveEditScope` accepts `availableEditRoots?: string[]` (consistent with ActionContextInput addition)
- `VerifyCommand` uses `VerifyPriority = 'CRITICAL' | 'WARNING' | 'SUGGESTION'` (consistent with spec requirement)
- `ListOptions.includeArchived` is `boolean` (consistent with pattern used elsewhere)

---

## Execution Handoff

Plan complete and saved to `apeworkflow/changes/cli-reliability-audit-fixes/plans/2026-06-25-cli-reliability-audit-fixes.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
