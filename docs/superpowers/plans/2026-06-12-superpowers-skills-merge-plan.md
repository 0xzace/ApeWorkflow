# Superpowers Skills Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge 14 superpowers-5.1.0 Markdown skills into ApeWorkflow's TypeScript template system as 15 global skills (14 + feedback), creating a dual-channel pipeline returning 26 total skills.

**Architecture:** A dual-channel skill pipeline where 11 workflow skills are profile-filtered and 15 global skills are always present. Skills are TypeScript template files in `src/core/templates/workflows/`. The pipeline is modified to merge both channels at `getSkillTemplates()`.

**Tech Stack:** TypeScript, Vitest, Node.js fs/path modules

---

## File Change Summary

### Modified Files (6)
| File | What Changes |
|------|-------------|
| `src/core/profiles.ts` | Add `ALL_GLOBAL_SKILLS`, fix `ALL_WORKFLOWS` (add propose) |
| `src/core/shared/skill-generation.ts` | WorkflowId type, globalEntries, dual-channel logic, helpers |
| `src/core/shared/tool-detection.ts` | SKILL_NAMES split into WORKFLOW + GLOBAL |
| `src/core/shared/index.ts` | Export new constants |
| `src/core/templates/skill-templates.ts` | Add 14 new exports |
| `src/core/workspace/skills.ts` | `getManagedWorkspaceSkillEntries()` filtering, attached files copy |

### New Files (14 + attached)
| File | Lines | Pattern |
|------|-------|---------|
| `src/core/templates/workflows/apeworkflow-brainstorming.ts` | ~164 | Inline |
| `src/core/templates/workflows/apeworkflow-dispatching-parallel-agents.ts` | ~182 | Inline |
| `src/core/templates/workflows/apeworkflow-executing-plans.ts` | ~70 | Inline |
| `src/core/templates/workflows/apeworkflow-finishing-a-development-branch.ts` | ~251 | Function |
| `src/core/templates/workflows/apeworkflow-receiving-code-review.ts` | ~213 | Function |
| `src/core/templates/workflows/apeworkflow-requesting-code-review.ts` | ~103 | Inline |
| `src/core/templates/workflows/apeworkflow-subagent-driven-development.ts` | ~279 | Function |
| `src/core/templates/workflows/apeworkflow-systematic-debugging.ts` | ~296 | Function |
| `src/core/templates/workflows/apeworkflow-test-driven-development.ts` | ~371 | Function |
| `src/core/templates/workflows/apeworkflow-using-git-worktrees.ts` | ~215 | Function |
| `src/core/templates/workflows/apeworkflow-using-skills.ts` | ~117 | Inline |
| `src/core/templates/workflows/apeworkflow-verification-before-completion.ts` | ~139 | Inline |
| `src/core/templates/workflows/apeworkflow-writing-plans.ts` | ~152 | Inline |
| `src/core/templates/workflows/apeworkflow-writing-skills.ts` | ~655 | Function |

### Attached File Directories (created with templates)
- `src/core/templates/workflows/apeworkflow-brainstorming/` — `brainstorming/visual-companion.md`, `scripts/plan-document-reviewer-prompt.md`, `spec-document-reviewer-prompt.md`
- `src/core/templates/workflows/apeworkflow-requesting-code-review/code-reviewer.md`
- `src/core/templates/workflows/apeworkflow-subagent-driven-development/implementer-prompt.md`, `spec-reviewer-prompt.md`, `code-quality-reviewer-prompt.md`
- `src/core/templates/workflows/apeworkflow-systematic-debugging/` — 10 files (root-cause-tracing.md, defense-in-depth.md, condition-based-waiting.md, test-debug-verify.ts, test-invariant-debug.sh, etc.)
- `src/core/templates/workflows/apeworkflow-test-driven-development/testing-anti-patterns.md`
- `src/core/templates/workflows/apeworkflow-writing-plans/plan-document-reviewer-prompt.md`
- `src/core/templates/workflows/apeworkflow-writing-skills/` — anthropic-best-practices.md, examples/, graphviz-conventions.dot, persuasion-principles.md, render-graphs.js, testing-skills-with-subagents.md
- `src/core/templates/workflows/apeworkflow-using-skills/references/copilot-tools.md`, codex-tools.md, gemini-tools.md

### Deleted Files (0)
- `src/core/templates/workflows/feedback.ts` — KEEP, now registered as global skill

---

## Phase 1: Infrastructure (Empty Global Skills, Compile Through)

### Task 1.1: Fix ALL_WORKFLOWS and add ALL_GLOBAL_SKILLS in profiles.ts

**Files:**
- Modify: `src/core/profiles.ts`

- [ ] **Step 1: Add 'propose' to ALL_WORKFLOWS and add ALL_GLOBAL_SKILLS**

Edit `src/core/profiles.ts`. Replace the existing `ALL_WORKFLOWS` array to include `'propose'` (which was already in skill-generation.ts and COMMAND_IDS) and add `ALL_GLOBAL_SKILLS`:

```typescript
// Replace the existing ALL_WORKFLOWS (missing 'propose') with:
export const ALL_WORKFLOWS = [
  'propose',
  'explore',
  'new',
  'continue',
  'apply',
  'ff',
  'sync',
  'archive',
  'bulk-archive',
  'verify',
  'onboard',
] as const;
// Now 11 entries. WorkflowId type auto-resolves to these 11.

// Add after ALL_WORKFLOWS and above the type aliases:
export const ALL_GLOBAL_SKILLS = [
  'apeworkflow-brainstorming',
  'apeworkflow-dispatching-parallel-agents',
  'apeworkflow-executing-plans',
  'apeworkflow-finishing-a-development-branch',
  'apeworkflow-receiving-code-review',
  'apeworkflow-requesting-code-review',
  'apeworkflow-subagent-driven-development',
  'apeworkflow-systematic-debugging',
  'apeworkflow-test-driven-development',
  'apeworkflow-using-git-worktrees',
  'apeworkflow-using-skills',
  'apeworkflow-verification-before-completion',
  'apeworkflow-writing-plans',
  'apeworkflow-writing-skills',
  'apeworkflow-feedback',
] as const;
```

After these edits, the file should be:

```typescript
/**
 * Profile System
 *
 * Defines workflow profiles that control which workflows are installed.
 * Profiles determine WHICH workflows; delivery (in global config) determines HOW.
 */

import type { Profile } from './global-config.js';

/**
 * Core workflows included in the 'core' profile.
 * These provide the streamlined experience for new users.
 */
export const CORE_WORKFLOWS = ['propose', 'explore', 'apply', 'sync', 'archive'] as const;

/**
 * All available workflows in the system.
 */
export const ALL_WORKFLOWS = [
  'propose',
  'explore',
  'new',
  'continue',
  'apply',
  'ff',
  'sync',
  'archive',
  'bulk-archive',
  'verify',
  'onboard',
] as const;

/**
 * Global (methodology) skills that are always present, independent of profile.
 */
export const ALL_GLOBAL_SKILLS = [
  'apeworkflow-brainstorming',
  'apeworkflow-dispatching-parallel-agents',
  'apeworkflow-executing-plans',
  'apeworkflow-finishing-a-development-branch',
  'apeworkflow-receiving-code-review',
  'apeworkflow-requesting-code-review',
  'apeworkflow-subagent-driven-development',
  'apeworkflow-systematic-debugging',
  'apeworkflow-test-driven-development',
  'apeworkflow-using-git-worktrees',
  'apeworkflow-using-skills',
  'apeworkflow-verification-before-completion',
  'apeworkflow-writing-plans',
  'apeworkflow-writing-skills',
  'apeworkflow-feedback',
] as const;

export type WorkflowId = (typeof ALL_WORKFLOWS)[number];
export type CoreWorkflowId = (typeof CORE_WORKFLOWS)[number];
```

- [ ] **Step 2: Verify file is syntactically correct**

Run:
```bash
cd /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow
npx tsc --noEmit src/core/profiles.ts 2>&1 | head -20
```
Expected: No errors (profiles.ts has no imports other than global-config.js which should resolve fine).

- [ ] **Step 3: Commit**

```bash
git add src/core/profiles.ts
git commit -m "chore(profiles): fix ALL_WORKFLOWS missing propose, add ALL_GLOBAL_SKILLS"
```

### Task 1.2: Modify skill-generation.ts with dual-channel logic

**Files:**
- Modify: `src/core/shared/skill-generation.ts`

- [ ] **Step 1: Add WorkflowId import and modify SkillTemplateEntry**

Replace the `import` section to add `WorkflowId` from profiles. Replace the `SkillTemplateEntry` interface. Replace `getSkillTemplates()`. Replace `getManagedWorkspaceSkillEntries()`.

```typescript
/**
 * Skill Generation Utilities
 *
 * Shared utilities for generating skill and command files.
 */

import {
  getExploreSkillTemplate,
  getNewChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getApplyChangeSkillTemplate,
  getFfChangeSkillTemplate,
  getSyncSpecsSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getVerifyChangeSkillTemplate,
  getOnboardSkillTemplate,
  getApeProposeSkillTemplate,
  getFeedbackSkillTemplate,
  getApeExploreCommandTemplate,
  getApeNewCommandTemplate,
  getApeContinueCommandTemplate,
  getApeApplyCommandTemplate,
  getApeFfCommandTemplate,
  getApeSyncCommandTemplate,
  getApeArchiveCommandTemplate,
  getApeBulkArchiveCommandTemplate,
  getApeVerifyCommandTemplate,
  getApeOnboardCommandTemplate,
  getApeProposeCommandTemplate,
  type SkillTemplate,
} from '../templates/skill-templates.js';
import type { CommandContent } from '../command-generation/index.js';
import type { WorkflowId } from '../profiles.js';

/**
 * Skill template with directory name and workflow ID mapping.
 * Global skills (methodology) have no workflowId; workflow skills have one.
 */
export interface SkillTemplateEntry {
  template: SkillTemplate;
  dirName: string;
  workflowId?: WorkflowId;
}

/**
 * Determines if a skill template entry is a workflow skill (has a workflow ID).
 */
export function isWorkflowEntry(e: SkillTemplateEntry): boolean {
  return e.workflowId !== undefined;
}

/**
 * Determines if a skill template entry is a global skill (no workflow ID).
 */
export function isGlobalEntry(e: SkillTemplateEntry): boolean {
  return e.workflowId === undefined;
}

/**
 * Gets skill templates with their directory names, optionally filtered by workflow IDs.
 *
 * Returns workflow-scoped entries (filtered by workflowFilter if provided)
 * merged with all global-scoped entries (always included).
 *
 * @param workflowFilter - If provided, only return workflow entries whose workflowId is in this array
 */
export function getSkillTemplates(workflowFilter?: readonly string[]): SkillTemplateEntry[] {
  const workflowEntries: SkillTemplateEntry[] = [
    { template: getExploreSkillTemplate(), dirName: 'apeworkflow-explore', workflowId: 'explore' },
    { template: getNewChangeSkillTemplate(), dirName: 'apeworkflow-new-change', workflowId: 'new' },
    { template: getContinueChangeSkillTemplate(), dirName: 'apeworkflow-continue-change', workflowId: 'continue' },
    { template: getApplyChangeSkillTemplate(), dirName: 'apeworkflow-apply-change', workflowId: 'apply' },
    { template: getFfChangeSkillTemplate(), dirName: 'apeworkflow-ff-change', workflowId: 'ff' },
    { template: getSyncSpecsSkillTemplate(), dirName: 'apeworkflow-sync-specs', workflowId: 'sync' },
    { template: getArchiveChangeSkillTemplate(), dirName: 'apeworkflow-archive-change', workflowId: 'archive' },
    { template: getBulkArchiveChangeSkillTemplate(), dirName: 'apeworkflow-bulk-archive-change', workflowId: 'bulk-archive' },
    { template: getVerifyChangeSkillTemplate(), dirName: 'apeworkflow-verify-change', workflowId: 'verify' },
    { template: getOnboardSkillTemplate(), dirName: 'apeworkflow-onboard', workflowId: 'onboard' },
    { template: getApeProposeSkillTemplate(), dirName: 'apeworkflow-propose', workflowId: 'propose' },
  ];

  // Global skills (methodology) — empty for now, filled in Phase 2
  const globalEntries: SkillTemplateEntry[] = [
    { template: getFeedbackSkillTemplate(), dirName: 'apeworkflow-feedback' },
  ];

  const all: SkillTemplateEntry[] = [...workflowEntries, ...globalEntries];

  if (!workflowFilter) return all;

  const filterSet = new Set(workflowFilter);
  return all.filter(
    entry => isGlobalEntry(entry) || filterSet.has(entry.workflowId!)
  );
}
```

Keep `getCommandTemplates`, `getCommandContents`, and `generateSkillContent` unchanged. The only change to the rest of the file is the import and type.

- [ ] **Step 2: Build and verify**

Run:
```bash
cd /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow
pnpm run build 2>&1
```
Expected: Build succeeds, 12 entries returned (11 workflow + 1 feedback).

- [ ] **Step 3: Commit**

```bash
git add src/core/shared/skill-generation.ts
git commit -m "feat(skill-generation): add dual-channel pipeline, WorkflowId type, feedback global skill"
```

### Task 1.3: Split SKILL_NAMES in tool-detection.ts

**Files:**
- Modify: `src/core/shared/tool-detection.ts`

- [ ] **Step 1: Replace SKILL_NAMES with WORKFLOW_SKILL_NAMES + GLOBAL_SKILL_NAMES**

Replace the existing `SKILL_NAMES` export block:

```typescript
/**
 * Names of workflow skill directories created by apeworkflow init.
 */
export const WORKFLOW_SKILL_NAMES = [
  'apeworkflow-explore',
  'apeworkflow-new-change',
  'apeworkflow-continue-change',
  'apeworkflow-apply-change',
  'apeworkflow-ff-change',
  'apeworkflow-sync-specs',
  'apeworkflow-archive-change',
  'apeworkflow-bulk-archive-change',
  'apeworkflow-verify-change',
  'apeworkflow-onboard',
  'apeworkflow-propose',
] as const;

/**
 * Names of global (methodology) skill directories — always present, not profile-controlled.
 */
export const GLOBAL_SKILL_NAMES = [
  'apeworkflow-brainstorming',
  'apeworkflow-dispatching-parallel-agents',
  'apeworkflow-executing-plans',
  'apeworkflow-finishing-a-development-branch',
  'apeworkflow-receiving-code-review',
  'apeworkflow-requesting-code-review',
  'apeworkflow-subagent-driven-development',
  'apeworkflow-systematic-debugging',
  'apeworkflow-test-driven-development',
  'apeworkflow-using-git-worktrees',
  'apeworkflow-using-skills',
  'apeworkflow-verification-before-completion',
  'apeworkflow-writing-plans',
  'apeworkflow-writing-skills',
  'apeworkflow-feedback',
] as const;

/**
 * All skill directory names (workflow + global). Backward compatible.
 */
export const SKILL_NAMES = [...WORKFLOW_SKILL_NAMES, ...GLOBAL_SKILL_NAMES] as const;

export type SkillName = (typeof SKILL_NAMES)[number];
```

- [ ] **Step 2: Build and verify**

Run:
```bash
cd /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow
pnpm run build 2>&1
```
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/core/shared/tool-detection.ts
git commit -m "feat(tool-detection): split SKILL_NAMES into WORKFLOW + GLOBAL, add 15 global skills"
```

### Task 1.4: Update shared/index.ts exports

**Files:**
- Modify: `src/core/shared/index.ts`

- [ ] **Step 1: Add new exports**

Replace the `tool-detection.js` export block:

```typescript
export {
  SKILL_NAMES,
  type SkillName,
  WORKFLOW_SKILL_NAMES,
  GLOBAL_SKILL_NAMES,
  COMMAND_IDS,
  type CommandId,
  type ToolSkillStatus,
  type ToolVersionStatus,
  getToolsWithSkillsDir,
  getToolSkillStatus,
  getToolStates,
  extractGeneratedByVersion,
  getToolVersionStatus,
  getConfiguredTools,
  getAllToolVersionStatus,
} from './tool-detection.js';
```

- [ ] **Step 2: Build and verify**

Run:
```bash
cd /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow
pnpm run build 2>&1
```
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/core/shared/index.ts
git commit -m "feat(shared): export WORKFLOW_SKILL_NAMES and GLOBAL_SKILL_NAMES"
```

### Task 1.5: Update skills.ts to use isGlobalEntry filter

**Files:**
- Modify: `src/core/workspace/skills.ts`

- [ ] **Step 1: Add isGlobalEntry import and modify getManagedWorkspaceSkillEntries**

Add import at the top (after the existing `getSkillTemplates` import line):

```typescript
import {
  generateSkillContent,
  getSkillTemplates,
  isGlobalEntry,
  isWorkflowEntry,
  getToolSkillStatus,
  getToolsWithSkillsDir,
  extractGeneratedByVersion,
} from '../shared/index.js';
```

Modify the `getManagedWorkspaceSkillEntries` function:

```typescript
function getManagedWorkspaceSkillEntries(): Array<{ workflowId: string; dirName: string }> {
  return getSkillTemplates()
    .filter(isWorkflowEntry)  // Only workflow skills can be removed by profile change
    .map(({ workflowId, dirName }) => ({ workflowId, dirName }));
}
```

- [ ] **Step 2: Build and verify**

Run:
```bash
cd /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow
pnpm run build 2>&1
```
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/core/workspace/skills.ts
git commit -m "feat(workspace/skills): filter managed entries to workflow skills only, protect global skills from cleanup"
```

### Task 1.6: Run full build and tests (Phase 1 checkpoint)

- [ ] **Step 1: Build**

```bash
cd /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow
pnpm run build 2>&1
```
Expected: Build succeeds with no errors.

- [ ] **Step 2: Run tests**

```bash
cd /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow
pnpm test 2>&1
```

Expected: Tests may need updates. Specifically:
- `skill-generation.test.ts:11` expects 11 templates — currently will get 12 (11+feedback). Update to 12.
- `skill-generation.test.ts:48` checks `workflowId` is truthy — global skill (feedback) has no workflowId. Need to fix.
- `tool-detection.test.ts:31` expects 11 SKILL_NAMES — currently will get 15+11=26. Needs update.

- [ ] **Step 3: Commit any fixes from test failures**

```bash
git add -A
git commit -m "fix: Phase 1 test compatibility adjustments"
```

---

## Phase 2: Create 14 Skill Templates

**Strategy:** Each skill is an independent task. The content comes from the original SKILL.md files in `/Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/`.

For each skill:
1. Parse the original SKILL.md — extract frontmatter (name, description) and body
2. Apply replacements (superpowers→apeworkflow, paths, text)
3. Escape template literal characters (`` ` `` → `` \` ``, `${` → `$\{` )
4. Write the TS file (inline if ≤200 lines, function-based if >200 lines)
5. Add export to `skill-templates.ts`
6. Add entry to `globalEntries` in `skill-generation.ts`
7. Create attached files directory if needed

### Task 2.1: Create apeworkflow-brainstorming.ts

**Files:**
- Create: `src/core/templates/workflows/apeworkflow-brainstorming.ts`
- Create: `src/core/templates/workflows/apeworkflow-brainstorming/brainstorming/visual-companion.md`
- Create: `src/core/templates/workflows/apeworkflow-brainstorming/scripts/plan-document-reviewer-prompt.md`
- Create: `src/core/templates/workflows/apeworkflow-brainstorming/spec-document-reviewer-prompt.md`
- Modify: `src/core/templates/skill-templates.ts` (add export)
- Modify: `src/core/shared/skill-generation.ts` (add to globalEntries)

- [ ] **Step 1: Create the TS file**

Read the original file at `/Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/brainstorming/SKILL.md`.

Frontmatter:
```yaml
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
```

Body: Markdown content starting from `# Brainstorming Ideas Into Designs`.

Apply replacements:
- `docs/superpowers/specs/` → `apeworkflow/specs/` (2 occurrences)
- `elements-of-style:writing-clearly` → delete (add comment `<!-- elements-of-style skill not available in apeworkflow -->`)
- `skills/brainstorming/visual-companion.md` → `brainstorming/visual-companion.md`

Escape all `` ` `` → `` \` `` and all `${` → `$\{` in the instructions string.

Generate TS file:

```typescript
/**
 * Skill Template: apeworkflow-brainstorming
 *
 * Converted from superpowers brainstorming skill.
 * Brainstorming guides collaborative design through structured dialogue.
 */
import type { SkillTemplate } from '../types.js';

export function getBrainstormingSkillTemplate(): SkillTemplate {
  return {
    name: 'apeworkflow-brainstorming',
    description: 'You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation.',
    instructions: `# Brainstorming Ideas Into Designs

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design and get user approval.

<HARD-GATE>
Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it. This applies to EVERY project regardless of perceived simplicity.
</HARD-GATE>
...
`,  // Full instructions with all replacements applied and `` ` `` escaped
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}
```

**Important:** The instructions string must have ALL backticks escaped as `` \` `` and all `${` escaped as `$\{`. There are approximately 160+ lines of markdown content. This is the largest source of potential bugs — double-check every escape.

- [ ] **Step 2: Create attached files directory and copy files**

```bash
mkdir -p /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/templates/workflows/apeworkflow-brainstorming/brainstorming
mkdir -p /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/templates/workflows/apeworkflow-brainstorming/scripts

cp /Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/brainstorming/scripts/visual-companion.md \
  /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/templates/workflows/apeworkflow-brainstorming/brainstorming/visual-companion.md

cp /Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/brainstorming/scripts/plan-document-reviewer-prompt.md \
  /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/templates/workflows/apeworkflow-brainstorming/scripts/plan-document-reviewer-prompt.md

cp /Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/brainstorming/spec-document-reviewer-prompt.md \
  /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/templates/workflows/apeworkflow-brainstorming/spec-document-reviewer-prompt.md
```

- [ ] **Step 3: Add export to skill-templates.ts**

Add after the existing feedback export:

```typescript
export { getBrainstormingSkillTemplate } from './workflows/apeworkflow-brainstorming.js';
```

- [ ] **Step 4: Add to globalEntries in skill-generation.ts**

Replace the existing `globalEntries` in `getSkillTemplates()`:

```typescript
const globalEntries: SkillTemplateEntry[] = [
  { template: getFeedbackSkillTemplate(), dirName: 'apeworkflow-feedback' },
  { template: getBrainstormingSkillTemplate(), dirName: 'apeworkflow-brainstorming' },
];
```

- [ ] **Step 5: Import new function**

Add to the import block in skill-generation.ts:

```typescript
import {
  ...
  getFeedbackSkillTemplate,
  getBrainstormingSkillTemplate,
  ...
} from '../templates/skill-templates.js';
```

- [ ] **Step 6: Build and verify**

```bash
cd /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow
pnpm run build 2>&1
```
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/core/templates/workflows/apeworkflow-brainstorming.ts
git add src/core/templates/workflows/apeworkflow-brainstorming/
git add src/core/templates/skill-templates.ts
git add src/core/shared/skill-generation.ts
git commit -m "feat(skills): add apeworkflow-brainstorming as global skill"
```

### Task 2.2: Create apeworkflow-dispatching-parallel-agents.ts

**Files:**
- Create: `src/core/templates/workflows/apeworkflow-dispatching-parallel-agents.ts`
- Modify: `src/core/templates/skill-templates.ts`
- Modify: `src/core/shared/skill-generation.ts`

- [ ] **Step 1: Create the TS file**

Read from `/Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/dispatching-parallel-agents/SKILL.md`.

Frontmatter:
```yaml
name: dispatching-parallel-agents
description: Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies
```

Replacements: none needed (no superpowers references).

Pattern: Inline (182 lines, ≤200).

```typescript
/**
 * Skill Template: apeworkflow-dispatching-parallel-agents
 */
import type { SkillTemplate } from '../types.js';

export function getDispatchingParallelAgentsSkillTemplate(): SkillTemplate {
  return {
    name: 'apeworkflow-dispatching-parallel-agents',
    description: 'Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies',
    instructions: `# Dispatching Parallel Agents
...
`,  // Full instructions with `` ` `` and `${` escaped
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}
```

- [ ] **Step 2-6:** Same pattern as Task 2.1 (export, globalEntries, import, build, commit). Export name: `getDispatchingParallelAgentsSkillTemplate`.

- [ ] **Step 7: Commit**

```bash
git add src/core/templates/workflows/apeworkflow-dispatching-parallel-agents.ts
git add src/core/templates/skill-templates.ts
git add src/core/shared/skill-generation.ts
git commit -m "feat(skills): add apeworkflow-dispatching-parallel-agents as global skill"
```

### Task 2.3: Create apeworkflow-executing-plans.ts

**Files:**
- Create: `src/core/templates/workflows/apeworkflow-executing-plans.ts`
- Modify: `src/core/templates/skill-templates.ts`
- Modify: `src/core/shared/skill-generation.ts`

- [ ] **Step 1: Create the TS file**

Read from `/Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/executing-plans/SKILL.md`.

Frontmatter:
```yaml
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
```

Replacements (Dimension A, C, D):
- `"Superpowers works much better with subagent support"` → `"This works much better with subagent support"`
- `superpowers:subagent-driven-development` → `apeworkflow-subagent-driven-development`
- `superpowers:finishing-a-development-branch` → `apeworkflow-finishing-a-development-branch`
- `superpowers:using-git-worktrees` → `apeworkflow-using-git-worktrees`
- `superpowers:writing-plans` → `apeworkflow-writing-plans`
- `superpowers:test-driven-development` → `apeworkflow-test-driven-development`
- `superpowers:verification-before-completion` → `apeworkflow-verification-before-completion`

Pattern: Inline (70 lines).

Export name: `getExecutingPlansSkillTemplate`.

- [ ] **Step 2-7:** Same pattern as Task 2.1 (export, globalEntries, import, build, commit).

- [ ] **Step 8: Commit**

```bash
git commit -m "feat(skills): add apeworkflow-executing-plans as global skill"
```

### Task 2.4: Create apeworkflow-finishing-a-development-branch.ts

**Files:**
- Create: `src/core/templates/workflows/apeworkflow-finishing-a-development-branch.ts`
- Modify: `src/core/templates/skill-templates.ts`
- Modify: `src/core/shared/skill-generation.ts`

- [ ] **Step 1: Create the TS file**

Read from `/Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/finishing-a-development-branch/SKILL.md`.

Frontmatter:
```yaml
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
```

Replacements:
- `"Superpowers created this worktree — we own cleanup"` → `"This worktree was created by the skill — clean it up"`
- `~/.config/superpowers/worktrees/` → Delete the lines mentioning this path (lines about checking worktree path under this directory). Replace with generic description: `a worktree managed by the skill (under .worktrees/ or worktrees/ directory)`.

Pattern: Function-based (251 lines, >200).

```typescript
export function getFinishingADevelopmentBranchSkillTemplate(): SkillTemplate {
  return {
    name: 'apeworkflow-finishing-a-development-branch',
    description: 'Use when implementation is complete, all tests pass, and you need to decide how to integrate the work...',
    instructions: getFinishingADevelopmentBranchInstructions(),
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}

function getFinishingADevelopmentBranchInstructions(): string {
  return `# Finishing a Development Branch
...
`;
}
```

Export name: `getFinishingADevelopmentBranchSkillTemplate`.

- [ ] **Step 2-7:** Same pattern (export, globalEntries, import, build, commit).

- [ ] **Step 8: Commit**

```bash
git commit -m "feat(skills): add apeworkflow-finishing-a-development-branch as global skill"
```

### Task 2.5: Create apeworkflow-receiving-code-review.ts

**Files:**
- Create: `src/core/templates/workflows/apeworkflow-receiving-code-review.ts`
- Modify: `src/core/templates/skill-templates.ts`
- Modify: `src/core/shared/skill-generation.ts`

Read from `/Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/receiving-code-review/SKILL.md`.

Frontmatter:
```yaml
name: receiving-code-review
description: Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation
```

Replacements: none (no superpowers references).

Pattern: Function-based (213 lines).

Export name: `getReceivingCodeReviewSkillTemplate`.

- [ ] **Step 2-8:** Same pattern as Task 2.4 (function-based template, build, commit).

- [ ] **Step 9: Commit**

```bash
git commit -m "feat(skills): add apeworkflow-receiving-code-review as global skill"
```

### Task 2.6: Create apeworkflow-requesting-code-review.ts

**Files:**
- Create: `src/core/templates/workflows/apeworkflow-requesting-code-review.ts`
- Create: `src/core/templates/workflows/apeworkflow-requesting-code-review/code-reviewer.md`
- Modify: `src/core/templates/skill-templates.ts`
- Modify: `src/core/shared/skill-generation.ts`

Read from `/Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/requesting-code-review/SKILL.md`.

Frontmatter:
```yaml
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
```

Replacements:
- `docs/superpowers/plans/<filename>.md` → `apeworkflow/changes/<name>/plans/[序号]<filename>.md`
- `requesting-code-review/code-reviewer.md` → `apeworkflow-requesting-code-review/code-reviewer.md`

Pattern: Inline (103 lines).

Attached file: Copy `code-reviewer.md`:
```bash
cp /Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/requesting-code-review/code-reviewer.md \
  /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/templates/workflows/apeworkflow-requesting-code-review/code-reviewer.md
```

Export name: `getRequestingCodeReviewSkillTemplate`.

- [ ] **Step 2-7:** Create TS + attached files + export + globalEntries + import + build + commit.

- [ ] **Step 8: Commit**

```bash
git commit -m "feat(skills): add apeworkflow-requesting-code-review as global skill"
```

### Task 2.7: Create apeworkflow-subagent-driven-development.ts

**Files:**
- Create: `src/core/templates/workflows/apeworkflow-subagent-driven-development.ts`
- Create: `src/core/templates/workflows/apeworkflow-subagent-driven-development/implementer-prompt.md`
- Create: `src/core/templates/workflows/apeworkflow-subagent-driven-development/spec-reviewer-prompt.md`
- Create: `src/core/templates/workflows/apeworkflow-subagent-driven-development/code-quality-reviewer-prompt.md`
- Modify: `src/core/templates/skill-templates.ts`
- Modify: `src/core/shared/skill-generation.ts`

Read from `/Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/subagent-driven-development/SKILL.md`.

Replacements:
- `superpowers:finishing-a-development-branch` → `apeworkflow-finishing-a-development-branch` (2 places including dot graph)
- `docs/superpowers/plans/` → `apeworkflow/changes/<name>/plans/[序号]/`
- `~/.config/superpowers/hooks/` → Delete (add comment or remove the line)
- `superpowers:using-git-worktrees` → `apeworkflow-using-git-worktrees`
- `superpowers:writing-plans` → `apeworkflow-writing-plans`
- `superpowers:requesting-code-review` → `apeworkflow-requesting-code-review`
- `superpowers:test-driven-development` → `apeworkflow-test-driven-development`
- `superpowers:executing-plans` → `apeworkflow-executing-plans`
- `./implementer-prompt.md` → `apeworkflow-subagent-driven-development/implementer-prompt.md`

Pattern: Function-based (279 lines).

Attached files: Copy 3 prompt files:
```bash
for f in implementer-prompt.md spec-reviewer-prompt.md code-quality-reviewer-prompt.md; do
  cp "/Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/subagent-driven-development/$f" \
    /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/templates/workflows/apeworkflow-subagent-driven-development/$f
done
```

Export name: `getSubagentDrivenDevelopmentSkillTemplate`.

- [ ] **Step 2-8:** Same pattern (function template + 3 attached files + export + globalEntries + import + build + commit).

- [ ] **Step 9: Commit**

```bash
git commit -m "feat(skills): add apeworkflow-subagent-driven-development as global skill"
```

### Task 2.8: Create apeworkflow-systematic-debugging.ts

**Files:**
- Create: `src/core/templates/workflows/apeworkflow-systematic-debugging.ts`
- Create: `src/core/templates/workflows/apeworkflow-systematic-debugging/` (10 files)
- Modify: `src/core/templates/skill-templates.ts`
- Modify: `src/core/shared/skill-generation.ts`

Read from `/Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/systematic-debugging/SKILL.md`.

Replacements:
- `superpowers:test-driven-development` → `apeworkflow-test-driven-development` (2 places)
- `superpowers:verification-before-completion` → `apeworkflow-verification-before-completion` (1 place)

Pattern: Function-based (296 lines).

Attached files (10 files):
```bash
mkdir -p /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/templates/workflows/apeworkflow-systematic-debugging
for f in root-cause-tracing.md defense-in-depth.md condition-based-waiting.md test-debug-verify.ts test-invariant-debug.sh root-cause-tracing.ts debug-helpers.ts log-analysis.md error-patterns.md; do
  cp "/Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/systematic-debugging/$f" \
    /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/templates/workflows/apeworkflow-systematic-debugging/$f 2>/dev/null || true
done
```

(Note: verify exact file names by listing the original directory. The plan uses likely names; the actual filenames from the source SKILL.md should be used.)

Export name: `getSystematicDebuggingSkillTemplate`.

- [ ] **Step 2-8:** Same pattern + 10 attached files + build + commit.

- [ ] **Step 9: Commit**

```bash
git commit -m "feat(skills): add apeworkflow-systematic-debugging as global skill"
```

### Task 2.9: Create apeworkflow-test-driven-development.ts

**Files:**
- Create: `src/core/templates/workflows/apeworkflow-test-driven-development.ts`
- Create: `src/core/templates/workflows/apeworkflow-test-driven-development/testing-anti-patterns.md`
- Modify: `src/core/templates/skill-templates.ts`
- Modify: `src/core/shared/skill-generation.ts`

Read from `/Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/test-driven-development/SKILL.md`.

Replacements: none.

Pattern: Function-based (371 lines).

Attached file:
```bash
cp /Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/test-driven-development/testing-anti-patterns.md \
  /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/templates/workflows/apeworkflow-test-driven-development/testing-anti-patterns.md
```

Export name: `getTestDrivenDevelopmentSkillTemplate`.

- [ ] **Step 2-8:** Same pattern + build + commit.

- [ ] **Step 9: Commit**

```bash
git commit -m "feat(skills): add apeworkflow-test-driven-development as global skill"
```

### Task 2.10: Create apeworkflow-using-git-worktrees.ts

**Files:**
- Create: `src/core/templates/workflows/apeworkflow-using-git-worktrees.ts`
- Modify: `src/core/templates/skill-templates.ts`
- Modify: `src/core/shared/skill-generation.ts`

Read from `/Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/using-git-worktrees/SKILL.md`.

Replacements:
- `~/.config/superpowers/worktrees/` → Replace with generic description: `a worktree managed by the skill (under .worktrees/ or worktrees/ directory)`
  - Lines 79, 81, 97, 106 in the original SKILL.md reference this path

Pattern: Function-based (215 lines).

Export name: `getUsingGitWorktreesSkillTemplate`.

- [ ] **Step 2-7:** Same pattern + build + commit.

- [ ] **Step 8: Commit**

```bash
git commit -m "feat(skills): add apeworkflow-using-git-worktrees as global skill"
```

### Task 2.11: Create apeworkflow-using-skills.ts

**Files:**
- Create: `src/core/templates/workflows/apeworkflow-using-skills.ts`
- Create: `src/core/templates/workflows/apeworkflow-using-skills/references/copilot-tools.md`
- Create: `src/core/templates/workflows/apeworkflow-using-skills/references/codex-tools.md`
- Create: `src/core/templates/workflows/apeworkflow-using-skills/references/gemini-tools.md`
- Modify: `src/core/templates/skill-templates.ts`
- Modify: `src/core/shared/skill-generation.ts`

Read from `/Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/using-superpowers/SKILL.md`.

Replacements:
- `name: using-superpowers` → `name: apeworkflow-using-skills` (in frontmatter → in TS name field)
- `Superpowers skills override` → `Apeworkflow skills override` (Dimension D)
- `~/.config/superpowers/` → generic description
- `using-superpowers:` → `apeworkflow-using-skills:` (skill reference in skill flow diagram)

Pattern: Inline (117 lines).

Attached files:
```bash
mkdir -p /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/templates/workflows/apeworkflow-using-skills/references
for f in copilot-tools.md codex-tools.md gemini-tools.md; do
  cp "/Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/using-superpowers/references/$f" \
    /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/templates/workflows/apeworkflow-using-skills/references/$f
done
```

Export name: `getUsingSkillsSkillTemplate`.

- [ ] **Step 2-7:** Same pattern + build + commit.

- [ ] **Step 8: Commit**

```bash
git commit -m "feat(skills): add apeworkflow-using-skills as global skill (formerly using-superpowers)"
```

### Task 2.12: Create apeworkflow-verification-before-completion.ts

**Files:**
- Create: `src/core/templates/workflows/apeworkflow-verification-before-completion.ts`
- Modify: `src/core/templates/skill-templates.ts`
- Modify: `src/core/shared/skill-generation.ts`

Read from `/Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/verification-before-completion/SKILL.md`.

Replacements: none.

Pattern: Inline (139 lines).

Export name: `getVerificationBeforeCompletionSkillTemplate`.

- [ ] **Step 2-7:** Same pattern + build + commit.

- [ ] **Step 8: Commit**

```bash
git commit -m "feat(skills): add apeworkflow-verification-before-completion as global skill"
```

### Task 2.13: Create apeworkflow-writing-plans.ts

**Files:**
- Create: `src/core/templates/workflows/apeworkflow-writing-plans.ts`
- Create: `src/core/templates/workflows/apeworkflow-writing-plans/plan-document-reviewer-prompt.md`
- Modify: `src/core/templates/skill-templates.ts`
- Modify: `src/core/shared/skill-generation.ts`

Read from `/Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/writing-plans/SKILL.md`.

Replacements:
- `superpowers:using-git-worktrees` → `apeworkflow-using-git-worktrees`
- `docs/superpowers/plans/` → `apeworkflow/changes/<name>/plans/[序号]/` (3 places)
- `superpowers:subagent-driven-development` → `apeworkflow-subagent-driven-development` (2 places)
- `superpowers:executing-plans` → `apeworkflow-executing-plans`

Pattern: Inline (152 lines).

Attached file:
```bash
cp /Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/writing-plans/plan-document-reviewer-prompt.md \
  /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/templates/workflows/apeworkflow-writing-plans/plan-document-reviewer-prompt.md
```

Export name: `getWritingPlansSkillTemplate`.

- [ ] **Step 2-7:** Same pattern + build + commit.

- [ ] **Step 8: Commit**

```bash
git commit -m "feat(skills): add apeworkflow-writing-plans as global skill"
```

### Task 2.14: Create apeworkflow-writing-skills.ts

**Files:**
- Create: `src/core/templates/workflows/apeworkflow-writing-skills.ts`
- Create: `src/core/templates/workflows/apeworkflow-writing-skills/` (6+ files)
- Modify: `src/core/templates/skill-templates.ts`
- Modify: `src/core/shared/skill-generation.ts`

Read from `/Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/writing-skills/SKILL.md`.

Replacements:
- `superpowers:test-driven-development` → `apeworkflow-test-driven-development` (2 places)
- `superpowers:systematic-debugging` → `apeworkflow-systematic-debugging` (1 place)

Pattern: Function-based (655 lines).

Attached files:
```bash
mkdir -p /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/templates/workflows/apeworkflow-writing-skills/examples
for f in anthropic-best-practices.md graphviz-conventions.dot persuasion-principles.md render-graphs.js testing-skills-with-subagents.md; do
  cp "/Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/writing-skills/$f" \
    /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/templates/workflows/apeworkflow-writing-skills/$f
done
cp -r "/Users/acez/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/writing-skills/examples/"* \
  /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/templates/workflows/apeworkflow-writing-skills/examples/
```

Export name: `getWritingSkillsSkillTemplate`.

- [ ] **Step 2-8:** Same pattern + build + commit.

- [ ] **Step 9: Commit**

```bash
git commit -m "feat(skills): add apeworkflow-writing-skills as global skill"
```

---

## Phase 3: Attached Files Integration

### Task 3.1: Update skills.ts attached file copy logic

**Files:**
- Modify: `src/core/workspace/skills.ts`

- [ ] **Step 1: Add attached file copy after SKILL.md generation**

In both `generateWorkspaceAgentSkills()` and `updateWorkspaceAgentSkills()`, after the loop that writes SKILL.md files, add attached file copying logic:

```typescript
// After writing each skill's SKILL.md, copy attached files (non-.ts files from the same workflows directory)
import * as nodeFs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));  // if needed

async function copyAttachedFiles(skillsDir: string, dirName: string): Promise<void> {
  // The attached files live alongside the template in dist/core/templates/workflows/
  // After build, the template directory is at: dist/core/templates/workflows/<dirName>/
  // We need to copy non-.ts files to skillsDir/<dirName>/
  const workflowsDir = path.join(__dirname, '../../templates/workflows');
  const sourceDir = path.join(workflowsDir, dirName);

  try {
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.endsWith('.ts')) continue; // Skip TS template files
      const src = path.join(sourceDir, entry.name);
      const dst = path.join(skillsDir, dirName, entry.name);

      if (entry.isDirectory()) {
        await fs.mkdir(dst, { recursive: true });
        await copyDir(src, dst);
      } else {
        await fs.copyFile(src, dst);
      }
    }
  } catch {
    // Source directory doesn't exist or is empty — no attached files
    // This is fine for skills without attached files
  }
}

async function copyDir(src: string, dst: string): Promise<void> {
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      await fs.mkdir(dstPath, { recursive: true });
      await copyDir(srcPath, dstPath);
    } else {
      await fs.copyFile(srcPath, dstPath);
    }
  }
}
```

Call `copyAttachedFiles(skillsDir, dirName)` inside the skill template loop, right after `writeFile(skillFile, skillContent)`.

- [ ] **Step 2: Build and verify**

```bash
cd /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow
pnpm run build 2>&1
```
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/core/workspace/skills.ts
git commit -m "feat(workspace/skills): add attached file copy logic for global skills"
```

---

## Phase 4: Test Updates

### Task 4.1: Update skill-generation.test.ts for 26 skills

**Files:**
- Modify: `test/core/shared/skill-generation.test.ts`

- [ ] **Step 1: Update the "should return all 11 skill templates" test**

Replace:
```typescript
it('should return all 11 skill templates', () => {
  const templates = getSkillTemplates();
  expect(templates).toHaveLength(26);
});
```

- [ ] **Step 2: Fix the "should have valid template structure" test**

The test checks `workflowId` is truthy for all templates, but global skills have no workflowId. Fix:

```typescript
it('should have valid template structure', () => {
  const templates = getSkillTemplates();

  for (const { template, dirName } of templates) {
    expect(template.name).toBeTruthy();
    expect(template.description).toBeTruthy();
    expect(template.instructions).toBeTruthy();
    expect(dirName).toBeTruthy();
  }
  // workflowId is optional — present for workflow skills, absent for global skills
});
```

- [ ] **Step 3: Fix the "should have unique workflow IDs" test**

This test maps all templates to workflowId, but global skills have undefined. Fix:

```typescript
it('should have unique workflow IDs among workflow skills', () => {
  const templates = getSkillTemplates();
  const workflowEntries = templates.filter(t => t.workflowId !== undefined);
  const ids = workflowEntries.map(t => t.workflowId!);
  const uniqueIds = new Set(ids);
  expect(uniqueIds.size).toBe(workflowEntries.length);
});
```

- [ ] **Step 4: Fix the "should filter by workflow IDs" test**

The filter test currently expects 0 results for a nonexistent filter. With global skills, it now returns 15 (all global). Fix:

```typescript
it('should return empty array when filter matches nothing (workflow skills only)', () => {
  const templates = getSkillTemplates();
  const workflowOnly = templates.filter(t => t.workflowId !== undefined);
  const filtered = workflowOnly.filter(t => t.workflowId === 'nonexistent');
  expect(filtered).toHaveLength(0);
});
```

Or alternatively, test that a non-matching filter returns only global skills:

```typescript
it('should return global skills when filter matches nothing', () => {
  const filtered = getSkillTemplates(['nonexistent']);
  // Returns all global skills (15) since filter doesn't match any workflow skills
  expect(filtered.every(t => t.workflowId === undefined)).toBe(true);
});
```

- [ ] **Step 5: Fix the single template filter test**

```typescript
it('should return single template when filter has one workflow', () => {
  const filtered = getSkillTemplates(['propose']);
  // Should get: 1 matching workflow skill + 15 global skills = 16
  expect(filtered).toHaveLength(16);
  const workflowFiltered = filtered.find(t => t.workflowId === 'propose');
  expect(workflowFiltered).toBeTruthy();
  expect(workflowFiltered!.dirName).toBe('apeworkflow-propose');
});
```

- [ ] **Step 6: Build and run tests**

```bash
cd /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow
pnpm test test/core/shared/skill-generation.test.ts 2>&1
```
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add test/core/shared/skill-generation.test.ts
git commit -m "test(skill-generation): update tests for dual-channel pipeline (26 skills)"
```

### Task 4.2: Update tool-detection.test.ts for 26 skills

**Files:**
- Modify: `test/core/shared/tool-detection.test.ts`

- [ ] **Step 1: Update SKILL_NAMES test**

Replace:
```typescript
it('should contain all skill names matching COMMAND_IDS', () => {
  expect(SKILL_NAMES).toHaveLength(26);
  expect(SKILL_NAMES).toContain('apeworkflow-explore');
  expect(SKILL_NAMES).toContain('apeworkflow-new-change');
  expect(SKILL_NAMES).toContain('apeworkflow-continue-change');
  expect(SKILL_NAMES).toContain('apeworkflow-apply-change');
  expect(SKILL_NAMES).toContain('apeworkflow-ff-change');
  expect(SKILL_NAMES).toContain('apeworkflow-sync-specs');
  expect(SKILL_NAMES).toContain('apeworkflow-archive-change');
  expect(SKILL_NAMES).toContain('apeworkflow-bulk-archive-change');
  expect(SKILL_NAMES).toContain('apeworkflow-verify-change');
  expect(SKILL_NAMES).toContain('apeworkflow-onboard');
  expect(SKILL_NAMES).toContain('apeworkflow-propose');
  // Global skills
  expect(SKILL_NAMES).toContain('apeworkflow-brainstorming');
  expect(SKILL_NAMES).toContain('apeworkflow-dispatching-parallel-agents');
  expect(SKILL_NAMES).toContain('apeworkflow-executing-plans');
  expect(SKILL_NAMES).toContain('apeworkflow-finishing-a-development-branch');
  expect(SKILL_NAMES).toContain('apeworkflow-receiving-code-review');
  expect(SKILL_NAMES).toContain('apeworkflow-requesting-code-review');
  expect(SKILL_NAMES).toContain('apeworkflow-subagent-driven-development');
  expect(SKILL_NAMES).toContain('apeworkflow-systematic-debugging');
  expect(SKILL_NAMES).toContain('apeworkflow-test-driven-development');
  expect(SKILL_NAMES).toContain('apeworkflow-using-git-worktrees');
  expect(SKILL_NAMES).toContain('apeworkflow-using-skills');
  expect(SKILL_NAMES).toContain('apeworkflow-verification-before-completion');
  expect(SKILL_NAMES).toContain('apeworkflow-writing-plans');
  expect(SKILL_NAMES).toContain('apeworkflow-writing-skills');
  expect(SKILL_NAMES).toContain('apeworkflow-feedback');
});
```

- [ ] **Step 2: Build and run tests**

```bash
cd /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow
pnpm test test/core/shared/tool-detection.test.ts 2>&1
```
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add test/core/shared/tool-detection.test.ts
git commit -m "test(tool-detection): update tests for 26 total skills"
```

---

## Phase 5: Final Verification

### Task 5.1: Full build and test suite

- [ ] **Step 1: Full build**

```bash
cd /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow
pnpm run build 2>&1
```
Expected: Build succeeds with no errors.

- [ ] **Step 2: Full test suite**

```bash
cd /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow
pnpm test 2>&1
```
Expected: All tests pass.

- [ ] **Step 3: Verify no superpowers references in new files**

```bash
cd /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow
grep -r "superpowers" src/core/templates/workflows/apeworkflow-*.ts | wc -l
```
Expected: `0`

- [ ] **Step 4: Verify all 26 skills have apeworkflow- prefix**

```bash
grep -r "name: 'apeworkflow-" src/core/templates/workflows/apeworkflow-*.ts src/core/templates/workflows/feedback.ts | wc -l
```
Expected: `26`

- [ ] **Step 5: Verify SKILL_NAMES length**

```bash
cd /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow
node -e "import('./dist/core/shared/tool-detection.js').then(m => console.log('SKILL_NAMES:', m.SKILL_NAMES.length))"
```
Expected: `26`

- [ ] **Step 6: Verify getSkillTemplates returns 26**

```bash
cd /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow
node -e "import('./dist/core/shared/skill-generation.js').then(m => console.log('getSkillTemplates():', m.getSkillTemplates().length))"
```
Expected: `26`

- [ ] **Step 7: Verify workflow skills count**

```bash
cd /Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow
node -e "import('./dist/core/shared/skill-generation.js').then(m => console.log('workflow entries:', m.getSkillTemplates().filter(m.isWorkflowEntry).length))"
```
Expected: `11`

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: final verification — build, tests, no superpowers references"
```

---

## Spec Coverage Checklist

| Spec Requirement | Task |
|-----------------|------|
| AC1: ALL_WORKFLOWS 11 (含 propose) | Task 1.1 |
| AC1: ALL_GLOBAL_SKILLS 15 | Task 1.1 |
| AC1: SKILL_NAMES 26 | Task 1.3 |
| AC1: WORKFLOW_TO_SKILL_DIR 11 keys | No change needed |
| AC2: WorkflowId 字面量类型 | Task 1.2 (type derived from ALL_WORKFLOWS) |
| AC2: isWorkflowEntry/isGlobalEntry | Task 1.2 |
| AC3: No filter returns 26 | Task 2.1-2.14 (all registered) |
| AC3: With filter returns match+15 | Task 1.2 (dual-channel logic) |
| AC4: All 26 SKILL.md generated | Phase 2 (14 new + 1 existing + 1 feedback) |
| AC4: apeworkflow- prefix | Phase 2 (all names prefixed) |
| AC4: No superpowers references | Task 5.1 step 3 |
| AC5: Global skills not cleaned up | Task 1.5 (isWorkflowEntry filter) |
| AC6: Profile UI not expanded | No change needed (WORKFLOW_TO_SKILL_DIR unchanged) |
| AC7: Attached files copied | Task 3.1 |
| AC8: Build passes | Task 5.1 step 1 |
| AC8: Tests pass | Task 5.1 step 2 |

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Backtick escaping errors in TS template literals | Careful manual review after each skill generation; build catches syntax errors immediately |
| Missing attached file copies | Each skill task includes explicit copy commands; verify in Phase 5 |
| Test count mismatches | Tests updated alongside implementation (Phase 4 runs after all skills registered) |
| superpowers reference leaks | Each skill task has specific replacement checklist; Phase 5 verifies 0 leaks |
| Type errors from WorkflowId changes | WorkflowId is derived from ALL_WORKFLOWS by TypeScript; adding 'propose' is the only change, type auto-updates |
