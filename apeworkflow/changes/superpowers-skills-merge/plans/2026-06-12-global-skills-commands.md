# Global Skills CLI Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use apeworkflow-subagent-driven-development (recommended) or apeworkflow-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add independent `/ape:*` commands to all 14 global methodology skills, following the same command template pattern as the existing 11 workflow commands.

**Architecture:** Split `COMMAND_IDS` into `WORKFLOW_COMMAND_IDS` (11) + `GLOBAL_COMMAND_IDS` (14). Each global skill gets a `getApeXxxCommandTemplate()` function that reuses the skill's `instructions` content. `getCommandTemplates()` becomes a dual-channel system: workflow commands (profile-filtered) + global commands (unconditional).

**Tech Stack:** TypeScript, Vitest

---

## File Change Map

| File | Change |
|------|--------|
| `src/core/shared/tool-detection.ts` | Split `COMMAND_IDS` → `WORKFLOW_COMMAND_IDS` + `GLOBAL_COMMAND_IDS` |
| `src/core/shared/index.ts` | Export new constants and types |
| `src/core/templates/workflows/apeworkflow-*.ts` (14 files) | Append `getApeXxxCommandTemplate()` function |
| `src/core/templates/skill-templates.ts` | Export 14 new `getApeXxxCommandTemplate()` functions |
| `src/core/shared/skill-generation.ts` | New imports, `CommandTemplateEntry.scope`, dual-channel `getCommandTemplates()` |
| `test/core/shared/tool-detection.test.ts` | Tests for `WORKFLOW_COMMAND_IDS` and `GLOBAL_COMMAND_IDS` |
| `test/core/shared/skill-generation.test.ts` | Updated counts + new global command template tests |

### Global Commands Reference

| # | Skill File | Command ID | Display Name | Category | Tags |
|---|-----------|------------|--------------|----------|------|
| 1 | apeworkflow-brainstorming.ts | brainstorming | APE: Brainstorming | Methodology | methodology, brainstorming, design |
| 2 | apeworkflow-dispatching-parallel-agents.ts | dispatching-parallel-agents | APE: Dispatching Parallel Agents | Methodology | methodology, parallel-agents, dispatch |
| 3 | apeworkflow-executing-plans.ts | executing-plans | APE: Executing Plans | Methodology | methodology, plans, execution |
| 4 | apeworkflow-finishing-a-development-branch.ts | finishing-a-development-branch | APE: Finishing a Development Branch | Methodology | methodology, branch, finishing |
| 5 | apeworkflow-receiving-code-review.ts | receiving-code-review | APE: Receiving Code Review | Methodology | methodology, code-review, receiving |
| 6 | apeworkflow-requesting-code-review.ts | requesting-code-review | APE: Requesting Code Review | Methodology | methodology, code-review, requesting |
| 7 | apeworkflow-subagent-driven-development.ts | subagent-driven-development | APE: Subagent-Driven Development | Methodology | methodology, subagent, development |
| 8 | apeworkflow-systematic-debugging.ts | systematic-debugging | APE: Systematic Debugging | Methodology | methodology, debugging, systematic |
| 9 | apeworkflow-test-driven-development.ts | test-driven-development | APE: Test-Driven Development | Methodology | methodology, test-driven-development, tdd |
| 10 | apeworkflow-using-git-worktrees.ts | using-git-worktrees | APE: Using Git Worktrees | Methodology | methodology, git, worktrees |
| 11 | apeworkflow-using-skills.ts | using-skills | APE: Using Skills | Methodology | methodology, skills |
| 12 | apeworkflow-verification-before-completion.ts | verification-before-completion | APE: Verification Before Completion | Methodology | methodology, verification, completion |
| 13 | apeworkflow-writing-plans.ts | writing-plans | APE: Writing Plans | Methodology | methodology, planning, writing |
| 14 | apeworkflow-writing-skills.ts | writing-skills | APE: Writing Skills | Methodology | methodology, skills, writing |

---

## Task 1: Split COMMAND_IDS in tool-detection.ts

**Files:**
- Modify: `src/core/shared/tool-detection.ts:57-73`

### Step 1: Replace COMMAND_IDS with two constant arrays

Edit `src/core/shared/tool-detection.ts` lines 57-73.

Replace:
```typescript
/**
 * IDs of command templates created by apeworkflow init.
 */
export const COMMAND_IDS = [
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
  'propose',
] as const;

export type CommandId = (typeof COMMAND_IDS)[number];
```

With:
```typescript
/**
 * IDs of workflow command templates (profile-filtered).
 */
export const WORKFLOW_COMMAND_IDS = [
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
  'propose',
] as const;

/**
 * IDs of global (methodology) command templates — always available, not profile-controlled.
 */
export const GLOBAL_COMMAND_IDS = [
  'brainstorming',
  'dispatching-parallel-agents',
  'executing-plans',
  'finishing-a-development-branch',
  'receiving-code-review',
  'requesting-code-review',
  'subagent-driven-development',
  'systematic-debugging',
  'test-driven-development',
  'using-git-worktrees',
  'using-skills',
  'verification-before-completion',
  'writing-plans',
  'writing-skills',
] as const;

/**
 * All command IDs (workflow + global). Backward compatible.
 */
export const COMMAND_IDS = [...WORKFLOW_COMMAND_IDS, ...GLOBAL_COMMAND_IDS] as const;

export type WorkflowCommandId = (typeof WORKFLOW_COMMAND_IDS)[number];
export type GlobalCommandId = (typeof GLOBAL_COMMAND_IDS)[number];
export type CommandId = (typeof COMMAND_IDS)[number];
```

### Step 2: Run TypeScript check

```bash
npx tsc --noEmit 2>&1 | head -30
```

**Expected:** No errors related to tool-detection.ts (skill-templates.ts and skill-generation.ts may have errors from later tasks — that's OK).

---

## Task 2: Update barrel exports in index.ts

**Files:**
- Modify: `src/core/shared/index.ts:1-23`

### Step 1: Add new exports to the tool-detection export block

Edit `src/core/shared/index.ts`, lines 7-23. Replace the first `export { ... }` block:

Replace:
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

With:
```typescript
export {
  SKILL_NAMES,
  type SkillName,
  WORKFLOW_SKILL_NAMES,
  GLOBAL_SKILL_NAMES,
  WORKFLOW_COMMAND_IDS,
  GLOBAL_COMMAND_IDS,
  COMMAND_IDS,
  type WorkflowCommandId,
  type GlobalCommandId,
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

### Step 2: Run TypeScript check

```bash
npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0 errors"
```

**Expected:** 0 errors (all imports/exports are consistent).

---

## Task 3: Add getApeXxxCommandTemplate() to 6 small skill files

**Files:**
- Modify: `src/core/templates/workflows/apeworkflow-brainstorming.ts`
- Modify: `src/core/templates/workflows/apeworkflow-dispatching-parallel-agents.ts`
- Modify: `src/core/templates/workflows/apeworkflow-executing-plans.ts`
- Modify: `src/core/templates/workflows/apeworkflow-requesting-code-review.ts`
- Modify: `src/core/templates/workflows/apeworkflow-using-skills.ts`
- Modify: `src/core/templates/workflows/apeworkflow-verification-before-completion.ts`

For each file, append a `getApeXxxCommandTemplate()` function at the **very end** of the file. These are small files (≤200 lines) — reuse `getSkillTemplate().instructions` directly.

### Step 1: apeworkflow-brainstorming.ts

Append at end of `src/core/templates/workflows/apeworkflow-brainstorming.ts`:

```typescript

export function getApeBrainstormingCommandTemplate(): CommandTemplate {
  return {
    name: 'APE: Brainstorming',
    description: 'Start brainstorming — explore ideas and design collaboratively',
    category: 'Methodology',
    tags: ['methodology', 'brainstorming', 'design'],
    content: getBrainstormingSkillTemplate().instructions,
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}
```

Also add `CommandTemplate` import at the top. Currently the file has:
```typescript
import type { SkillTemplate } from '../types.js';
```
Change to:
```typescript
import type { SkillTemplate, CommandTemplate } from '../types.js';
```

### Step 2: apeworkflow-dispatching-parallel-agents.ts

Append at end of `src/core/templates/workflows/apeworkflow-dispatching-parallel-agents.ts`:

```typescript

export function getApeDispatchingParallelAgentsCommandTemplate(): CommandTemplate {
  return {
    name: 'APE: Dispatching Parallel Agents',
    description: 'Delegate independent tasks to specialized agents with isolated context',
    category: 'Methodology',
    tags: ['methodology', 'parallel-agents', 'dispatch'],
    content: getDispatchingParallelAgentsSkillTemplate().instructions,
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}
```

Add `CommandTemplate` to the existing import.

### Step 3: apeworkflow-executing-plans.ts

Append at end of `src/core/templates/workflows/apeworkflow-executing-plans.ts`:

```typescript

export function getApeExecutingPlansCommandTemplate(): CommandTemplate {
  return {
    name: 'APE: Executing Plans',
    description: 'Execute a written implementation plan task by task with review checkpoints',
    category: 'Methodology',
    tags: ['methodology', 'plans', 'execution'],
    content: getExecutingPlansSkillTemplate().instructions,
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}
```

Add `CommandTemplate` to the existing import.

### Step 4: apeworkflow-requesting-code-review.ts

Append at end of `src/core/templates/workflows/apeworkflow-requesting-code-review.ts`:

```typescript

export function getApeRequestingCodeReviewCommandTemplate(): CommandTemplate {
  return {
    name: 'APE: Requesting Code Review',
    description: 'Dispatch a code reviewer subagent to catch issues before they cascade',
    category: 'Methodology',
    tags: ['methodology', 'code-review', 'requesting'],
    content: getRequestingCodeReviewSkillTemplate().instructions,
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}
```

Add `CommandTemplate` to the existing import.

### Step 5: apeworkflow-using-skills.ts

Append at end of `src/core/templates/workflows/apeworkflow-using-skills.ts`:

```typescript

export function getApeUsingSkillsCommandTemplate(): CommandTemplate {
  return {
    name: 'APE: Using Skills',
    description: 'Find and apply skills to enhance your workflow capabilities',
    category: 'Methodology',
    tags: ['methodology', 'skills'],
    content: getUsingSkillsSkillTemplate().instructions,
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}
```

Add `CommandTemplate` to the existing import.

### Step 6: apeworkflow-verification-before-completion.ts

Append at end of `src/core/templates/workflows/apeworkflow-verification-before-completion.ts`:

```typescript

export function getApeVerificationBeforeCompletionCommandTemplate(): CommandTemplate {
  return {
    name: 'APE: Verification Before Completion',
    description: 'Run verification commands and confirm output before making success claims',
    category: 'Methodology',
    tags: ['methodology', 'verification', 'completion'],
    content: getVerificationBeforeCompletionSkillTemplate().instructions,
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}
```

Add `CommandTemplate` to the existing import.

### Step 7: Verify imports compile

```bash
npx tsc --noEmit 2>&1 | grep "error TS" || echo "No errors in skill files"
```

**Expected:** No errors related to these 6 files.

---

## Task 4: Add getApeXxxCommandTemplate() to 8 large skill files

**Files:**
- Modify: `src/core/templates/workflows/apeworkflow-finishing-a-development-branch.ts`
- Modify: `src/core/templates/workflows/apeworkflow-receiving-code-review.ts`
- Modify: `src/core/templates/workflows/apeworkflow-subagent-driven-development.ts`
- Modify: `src/core/templates/workflows/apeworkflow-systematic-debugging.ts`
- Modify: `src/core/templates/workflows/apeworkflow-test-driven-development.ts`
- Modify: `src/core/templates/workflows/apeworkflow-using-git-worktrees.ts`
- Modify: `src/core/templates/workflows/apeworkflow-writing-plans.ts`
- Modify: `src/core/templates/workflows/apeworkflow-writing-skills.ts`

For each file, append a `getApeXxxCommandTemplate()` function at the **very end** of the file. These are large files (>200 lines) — reuse the existing `getInstructions()` function pattern.

**Note:** 7 of these 8 files already have a `getInstructions()` helper function. `apeworkflow-writing-plans.ts` and `apeworkflow-writing-skills.ts` have the instructions inlined — they already export `getWritingPlansInstructions()` and `getWritingSkillsInstructions()` as **private** functions (no `export`). The command template will call them directly since they're in the same file.

### Step 1: apeworkflow-finishing-a-development-branch.ts

Append at end of `src/core/templates/workflows/apeworkflow-finishing-a-development-branch.ts`:

```typescript

export function getApeFinishingADevelopmentBranchCommandTemplate(): CommandTemplate {
  return {
    name: 'APE: Finishing a Development Branch',
    description: 'Complete development work by choosing the right integration path — merge, PR, or cleanup',
    category: 'Methodology',
    tags: ['methodology', 'branch', 'finishing'],
    content: getFinishingADevelopmentBranchInstructions(),
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}
```

Add `CommandTemplate` to the existing import:
```typescript
import type { SkillTemplate, CommandTemplate } from '../types.js';
```

### Step 2: apeworkflow-receiving-code-review.ts

Append at end of `src/core/templates/workflows/apeworkflow-receiving-code-review.ts`:

```typescript

export function getApeReceivingCodeReviewCommandTemplate(): CommandTemplate {
  return {
    name: 'APE: Receiving Code Review',
    description: 'Evaluate code review feedback with technical rigor before implementing suggestions',
    category: 'Methodology',
    tags: ['methodology', 'code-review', 'receiving'],
    content: getReceivingCodeReviewInstructions(),
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}
```

Add `CommandTemplate` to the existing import.

### Step 3: apeworkflow-subagent-driven-development.ts

Append at end of `src/core/templates/workflows/apeworkflow-subagent-driven-development.ts`:

```typescript

export function getApeSubagentDrivenDevelopmentCommandTemplate(): CommandTemplate {
  return {
    name: 'APE: Subagent-Driven Development',
    description: 'Execute implementation plans with fresh subagents per task and two-stage review',
    category: 'Methodology',
    tags: ['methodology', 'subagent', 'development'],
    content: getSubagentDrivenDevelopmentInstructions(),
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}
```

Add `CommandTemplate` to the existing import.

### Step 4: apeworkflow-systematic-debugging.ts

Append at end of `src/core/templates/workflows/apeworkflow-systematic-debugging.ts`:

```typescript

export function getApeSystematicDebuggingCommandTemplate(): CommandTemplate {
  return {
    name: 'APE: Systematic Debugging',
    description: 'Find root cause before attempting fixes using a structured four-phase approach',
    category: 'Methodology',
    tags: ['methodology', 'debugging', 'systematic'],
    content: getSystematicDebuggingInstructions(),
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}
```

Add `CommandTemplate` to the existing import.

### Step 5: apeworkflow-test-driven-development.ts

Append at end of `src/core/templates/workflows/apeworkflow-test-driven-development.ts`:

```typescript

export function getApeTestDrivenDevelopmentCommandTemplate(): CommandTemplate {
  return {
    name: 'APE: Test-Driven Development',
    description: 'Write test first, watch it fail, write minimal code to pass — red-green-refactor cycle',
    category: 'Methodology',
    tags: ['methodology', 'test-driven-development', 'tdd'],
    content: getTestDrivenDevelopmentInstructions(),
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}
```

Add `CommandTemplate` to the existing import.

### Step 6: apeworkflow-using-git-worktrees.ts

Append at end of `src/core/templates/workflows/apeworkflow-using-git-worktrees.ts`:

```typescript

export function getApeUsingGitWorktreesCommandTemplate(): CommandTemplate {
  return {
    name: 'APE: Using Git Worktrees',
    description: 'Ensure an isolated workspace exists for feature work or implementation plans',
    category: 'Methodology',
    tags: ['methodology', 'git', 'worktrees'],
    content: getUsingGitWorktreesInstructions(),
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}
```

Add `CommandTemplate` to the existing import.

### Step 7: apeworkflow-writing-plans.ts

Append at end of `src/core/templates/workflows/apeworkflow-writing-plans.ts`:

```typescript

export function getApeWritingPlansCommandTemplate(): CommandTemplate {
  return {
    name: 'APE: Writing Plans',
    description: 'Create a detailed, actionable implementation plan before touching code',
    category: 'Methodology',
    tags: ['methodology', 'planning', 'writing'],
    content: getWritingPlansInstructions(),
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}
```

Add `CommandTemplate` to the existing import.

### Step 8: apeworkflow-writing-skills.ts

Append at end of `src/core/templates/workflows/apeworkflow-writing-skills.ts`:

```typescript

export function getApeWritingSkillsCommandTemplate(): CommandTemplate {
  return {
    name: 'APE: Writing Skills',
    description: 'Create, edit, or verify skills before deployment',
    category: 'Methodology',
    tags: ['methodology', 'skills', 'writing'],
    content: getWritingSkillsInstructions(),
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}
```

Add `CommandTemplate` to the existing import.

### Step 9: Verify all 15 command template files compile

```bash
npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0 errors"
```

**Expected:** 0 errors.

---

## Task 5: Add 15 exports to skill-templates.ts

**Files:**
- Modify: `src/core/templates/skill-templates.ts`

### Step 1: Add 15 new export lines

Append at the end of `src/core/templates/skill-templates.ts` (after the existing 22 export lines):

```typescript
export { getApeBrainstormingCommandTemplate } from './workflows/apeworkflow-brainstorming.js';
export { getApeDispatchingParallelAgentsCommandTemplate } from './workflows/apeworkflow-dispatching-parallel-agents.js';
export { getApeExecutingPlansCommandTemplate } from './workflows/apeworkflow-executing-plans.js';
export { getApeFinishingADevelopmentBranchCommandTemplate } from './workflows/apeworkflow-finishing-a-development-branch.js';
export { getApeReceivingCodeReviewCommandTemplate } from './workflows/apeworkflow-receiving-code-review.js';
export { getApeRequestingCodeReviewCommandTemplate } from './workflows/apeworkflow-requesting-code-review.js';
export { getApeSubagentDrivenDevelopmentCommandTemplate } from './workflows/apeworkflow-subagent-driven-development.js';
export { getApeSystematicDebuggingCommandTemplate } from './workflows/apeworkflow-systematic-debugging.js';
export { getApeTestDrivenDevelopmentCommandTemplate } from './workflows/apeworkflow-test-driven-development.js';
export { getApeUsingGitWorktreesCommandTemplate } from './workflows/apeworkflow-using-git-worktrees.js';
export { getApeUsingSkillsCommandTemplate } from './workflows/apeworkflow-using-skills.js';
export { getApeVerificationBeforeCompletionCommandTemplate } from './workflows/apeworkflow-verification-before-completion.js';
export { getApeWritingPlansCommandTemplate } from './workflows/apeworkflow-writing-plans.js';
export { getApeWritingSkillsCommandTemplate } from './workflows/apeworkflow-writing-skills.js';
```

### Step 2: Verify imports resolve

```bash
npx tsc --noEmit 2>&1 | grep "error TS" || echo "No errors"
```

**Expected:** No errors.

---

## Task 6: Refactor skill-generation.ts for dual-channel command templates

**Files:**
- Modify: `src/core/shared/skill-generation.ts`

### Step 1: Update imports

Replace the entire import block (lines 7-48):

Current:
```typescript
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
  getBrainstormingSkillTemplate,
  getDispatchingParallelAgentsSkillTemplate,
  getExecutingPlansSkillTemplate,
  getFinishingADevelopmentBranchSkillTemplate,
  getReceivingCodeReviewSkillTemplate,
  getRequestingCodeReviewSkillTemplate,
  getSubagentDrivenDevelopmentSkillTemplate,
  getWritingPlansSkillTemplate,
  getWritingSkillsSkillTemplate,
  getSystematicDebuggingSkillTemplate,
  getTestDrivenDevelopmentSkillTemplate,
  getUsingGitWorktreesSkillTemplate,
  getUsingSkillsSkillTemplate,
  getVerificationBeforeCompletionSkillTemplate,
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
import type { WorkflowId } from '../profiles.js';
import type { CommandContent } from '../command-generation/index.js';
```

Replace with:
```typescript
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
  getBrainstormingSkillTemplate,
  getDispatchingParallelAgentsSkillTemplate,
  getExecutingPlansSkillTemplate,
  getFinishingADevelopmentBranchSkillTemplate,
  getReceivingCodeReviewSkillTemplate,
  getRequestingCodeReviewSkillTemplate,
  getSubagentDrivenDevelopmentSkillTemplate,
  getWritingPlansSkillTemplate,
  getWritingSkillsSkillTemplate,
  getSystematicDebuggingSkillTemplate,
  getTestDrivenDevelopmentSkillTemplate,
  getUsingGitWorktreesSkillTemplate,
  getUsingSkillsSkillTemplate,
  getVerificationBeforeCompletionSkillTemplate,
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
  getApeBrainstormingCommandTemplate,
  getApeDispatchingParallelAgentsCommandTemplate,
  getApeExecutingPlansCommandTemplate,
  getApeFinishingADevelopmentBranchCommandTemplate,
  getApeReceivingCodeReviewCommandTemplate,
  getApeRequestingCodeReviewCommandTemplate,
  getApeSubagentDrivenDevelopmentCommandTemplate,
  getApeSystematicDebuggingCommandTemplate,
  getApeTestDrivenDevelopmentCommandTemplate,
  getApeUsingGitWorktreesCommandTemplate,
  getApeUsingSkillsCommandTemplate,
  getApeVerificationBeforeCompletionCommandTemplate,
  getApeWritingPlansCommandTemplate,
  getApeWritingSkillsCommandTemplate,
  type SkillTemplate,
  type CommandTemplate,
} from '../templates/skill-templates.js';
import type { WorkflowId } from '../profiles.js';
import type { CommandContent } from '../command-generation/index.js';
```

### Step 2: Update CommandTemplateEntry interface

Replace lines 76-80:

Current:
```typescript
export interface CommandTemplateEntry {
  template: ReturnType<typeof getApeExploreCommandTemplate>;
  id: string;
}
```

Replace with:
```typescript
export interface CommandTemplateEntry {
  template: ReturnType<typeof getApeExploreCommandTemplate>;
  id: string;
  scope?: 'workflow' | 'global';
}
```

### Step 3: Refactor getCommandTemplates() for dual-channel

Replace the entire function (lines 139-158):

Current:
```typescript
export function getCommandTemplates(workflowFilter?: readonly string[]): CommandTemplateEntry[] {
  const all: CommandTemplateEntry[] = [
    { template: getApeExploreCommandTemplate(), id: 'explore' },
    { template: getApeNewCommandTemplate(), id: 'new' },
    { template: getApeContinueCommandTemplate(), id: 'continue' },
    { template: getApeApplyCommandTemplate(), id: 'apply' },
    { template: getApeFfCommandTemplate(), id: 'ff' },
    { template: getApeSyncCommandTemplate(), id: 'sync' },
    { template: getApeArchiveCommandTemplate(), id: 'archive' },
    { template: getApeBulkArchiveCommandTemplate(), id: 'bulk-archive' },
    { template: getApeVerifyCommandTemplate(), id: 'verify' },
    { template: getApeOnboardCommandTemplate(), id: 'onboard' },
    { template: getApeProposeCommandTemplate(), id: 'propose' },
  ];

  if (!workflowFilter) return all;

  const filterSet = new Set(workflowFilter);
  return all.filter(entry => filterSet.has(entry.id));
}
```

Replace with:
```typescript
export function getCommandTemplates(workflowFilter?: readonly string[]): CommandTemplateEntry[] {
  // Workflow commands (subject to profile filtering)
  const workflowCommands: CommandTemplateEntry[] = [
    { template: getApeExploreCommandTemplate(), id: 'explore', scope: 'workflow' },
    { template: getApeNewCommandTemplate(), id: 'new', scope: 'workflow' },
    { template: getApeContinueCommandTemplate(), id: 'continue', scope: 'workflow' },
    { template: getApeApplyCommandTemplate(), id: 'apply', scope: 'workflow' },
    { template: getApeFfCommandTemplate(), id: 'ff', scope: 'workflow' },
    { template: getApeSyncCommandTemplate(), id: 'sync', scope: 'workflow' },
    { template: getApeArchiveCommandTemplate(), id: 'archive', scope: 'workflow' },
    { template: getApeBulkArchiveCommandTemplate(), id: 'bulk-archive', scope: 'workflow' },
    { template: getApeVerifyCommandTemplate(), id: 'verify', scope: 'workflow' },
    { template: getApeOnboardCommandTemplate(), id: 'onboard', scope: 'workflow' },
    { template: getApeProposeCommandTemplate(), id: 'propose', scope: 'workflow' },
  ];

  // Global commands (always available, not profile-controlled)
  const globalCommands: CommandTemplateEntry[] = [
    { template: getApeBrainstormingCommandTemplate(), id: 'brainstorming', scope: 'global' },
    { template: getApeDispatchingParallelAgentsCommandTemplate(), id: 'dispatching-parallel-agents', scope: 'global' },
    { template: getApeExecutingPlansCommandTemplate(), id: 'executing-plans', scope: 'global' },
    { template: getApeFinishingADevelopmentBranchCommandTemplate(), id: 'finishing-a-development-branch', scope: 'global' },
    { template: getApeReceivingCodeReviewCommandTemplate(), id: 'receiving-code-review', scope: 'global' },
    { template: getApeRequestingCodeReviewCommandTemplate(), id: 'requesting-code-review', scope: 'global' },
    { template: getApeSubagentDrivenDevelopmentCommandTemplate(), id: 'subagent-driven-development', scope: 'global' },
    { template: getApeSystematicDebuggingCommandTemplate(), id: 'systematic-debugging', scope: 'global' },
    { template: getApeTestDrivenDevelopmentCommandTemplate(), id: 'test-driven-development', scope: 'global' },
    { template: getApeUsingGitWorktreesCommandTemplate(), id: 'using-git-worktrees', scope: 'global' },
    { template: getApeUsingSkillsCommandTemplate(), id: 'using-skills', scope: 'global' },
    { template: getApeVerificationBeforeCompletionCommandTemplate(), id: 'verification-before-completion', scope: 'global' },
    { template: getApeWritingPlansCommandTemplate(), id: 'writing-plans', scope: 'global' },
    { template: getApeWritingSkillsCommandTemplate(), id: 'writing-skills', scope: 'global' },
  ];

  if (!workflowFilter) return [...workflowCommands, ...globalCommands];

  const filterSet = new Set(workflowFilter);
  const filteredWorkflow = workflowCommands.filter(entry => filterSet.has(entry.id));
  return [...filteredWorkflow, ...globalCommands];
}
```

### Step 4: Update getCommandContents() to work with the new scope field

Replace the function (lines 165-175):

Current:
```typescript
export function getCommandContents(workflowFilter?: readonly string[]): CommandContent[] {
  const commandTemplates = getCommandTemplates(workflowFilter);
  return commandTemplates.map(({ template, id }) => ({
    id,
    name: template.name,
    description: template.description,
    category: template.category,
    tags: template.tags,
    body: template.content,
  }));
}
```

Replace with:
```typescript
export function getCommandContents(workflowFilter?: readonly string[]): CommandContent[] {
  const commandTemplates = getCommandTemplates(workflowFilter);
  return commandTemplates.map(({ template, id }) => ({
    id,
    name: template.name,
    description: template.description,
    category: template.category,
    tags: template.tags,
    body: template.content,
  }));
}
```

Note: No change needed here — the function already only uses `template` and `id`, and the new `scope` field is just added as a property on `CommandTemplateEntry` without affecting how `getCommandContents` consumes it.

### Step 5: Verify compilation

```bash
npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0 errors"
```

**Expected:** 0 errors.

---

## Task 7: Write/update tests

**Files:**
- Create: `test/core/shared/tool-detection-commands.test.ts` (new file — keeps tool-detection tests clean)
- Modify: `test/core/shared/skill-generation.test.ts`

### Step 1: Create tool-detection-commands.test.ts

Create new file `test/core/shared/tool-detection-commands.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  WORKFLOW_COMMAND_IDS,
  GLOBAL_COMMAND_IDS,
  COMMAND_IDS,
  type WorkflowCommandId,
  type GlobalCommandId,
} from '../../../src/core/shared/tool-detection.js';

describe('tool-detection commands', () => {
  describe('WORKFLOW_COMMAND_IDS', () => {
    it('should contain exactly 11 workflow command IDs', () => {
      expect(WORKFLOW_COMMAND_IDS).toHaveLength(11);
    });

    it('should contain all expected workflow commands', () => {
      expect(WORKFLOW_COMMAND_IDS).toContain('explore');
      expect(WORKFLOW_COMMAND_IDS).toContain('new');
      expect(WORKFLOW_COMMAND_IDS).toContain('continue');
      expect(WORKFLOW_COMMAND_IDS).toContain('apply');
      expect(WORKFLOW_COMMAND_IDS).toContain('ff');
      expect(WORKFLOW_COMMAND_IDS).toContain('sync');
      expect(WORKFLOW_COMMAND_IDS).toContain('archive');
      expect(WORKFLOW_COMMAND_IDS).toContain('bulk-archive');
      expect(WORKFLOW_COMMAND_IDS).toContain('verify');
      expect(WORKFLOW_COMMAND_IDS).toContain('onboard');
      expect(WORKFLOW_COMMAND_IDS).toContain('propose');
    });

    it('should have unique IDs', () => {
      const ids = WORKFLOW_COMMAND_IDS as string[];
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('GLOBAL_COMMAND_IDS', () => {
    it('should contain exactly 15 global command IDs', () => {
      expect(GLOBAL_COMMAND_IDS).toHaveLength(15);
    });

    it('should contain all expected global commands', () => {
      expect(GLOBAL_COMMAND_IDS).toContain('brainstorming');
      expect(GLOBAL_COMMAND_IDS).toContain('dispatching-parallel-agents');
      expect(GLOBAL_COMMAND_IDS).toContain('executing-plans');
      expect(GLOBAL_COMMAND_IDS).toContain('finishing-a-development-branch');
      expect(GLOBAL_COMMAND_IDS).toContain('receiving-code-review');
      expect(GLOBAL_COMMAND_IDS).toContain('requesting-code-review');
      expect(GLOBAL_COMMAND_IDS).toContain('subagent-driven-development');
      expect(GLOBAL_COMMAND_IDS).toContain('systematic-debugging');
      expect(GLOBAL_COMMAND_IDS).toContain('test-driven-development');
      expect(GLOBAL_COMMAND_IDS).toContain('using-git-worktrees');
      expect(GLOBAL_COMMAND_IDS).toContain('using-skills');
      expect(GLOBAL_COMMAND_IDS).toContain('verification-before-completion');
      expect(GLOBAL_COMMAND_IDS).toContain('writing-plans');
      expect(GLOBAL_COMMAND_IDS).toContain('writing-skills');
    });

    it('should have unique IDs', () => {
      const ids = GLOBAL_COMMAND_IDS as string[];
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('COMMAND_IDS (backward compatible)', () => {
    it('should contain all 26 IDs (workflow + global)', () => {
      expect(COMMAND_IDS).toHaveLength(26);
    });

    it('should be the concatenation of workflow + global IDs', () => {
      const all = [...WORKFLOW_COMMAND_IDS, ...GLOBAL_COMMAND_IDS] as const;
      expect(COMMAND_IDS).toEqual(all);
    });

    it('should have unique IDs across both categories', () => {
      const ids = COMMAND_IDS as string[];
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should contain all workflow IDs', () => {
      for (const id of WORKFLOW_COMMAND_IDS) {
        expect(COMMAND_IDS).toContain(id);
      }
    });

    it('should contain all global IDs', () => {
      for (const id of GLOBAL_COMMAND_IDS) {
        expect(COMMAND_IDS).toContain(id);
      }
    });
  });

  describe('Type safety', () => {
    it('should accept workflow IDs as WorkflowCommandId', () => {
      const id: WorkflowCommandId = 'explore';
      expect(id).toBe('explore');
    });

    it('should accept global IDs as GlobalCommandId', () => {
      const id: GlobalCommandId = 'brainstorming';
      expect(id).toBe('brainstorming');
    });

    it('should accept any command ID as CommandId', () => {
      const workflowId: CommandId = 'explore';
      const globalId: CommandId = 'brainstorming';
      expect(workflowId).toBe('explore');
      expect(globalId).toBe('brainstorming');
    });
  });
});
```

### Step 2: Update skill-generation.test.ts — fix existing count expectations

In `test/core/shared/skill-generation.test.ts`, the following tests need count updates:

**a) `getCommandTemplates` — "should return all 11 command templates" (line 95-98)**

Replace:
```typescript
    it('should return all 11 command templates', () => {
      const templates = getCommandTemplates();
      expect(templates).toHaveLength(11);
    });
```

With:
```typescript
    it('should return all 25 command templates (workflow + global)', () => {
      const templates = getCommandTemplates();
      expect(templates).toHaveLength(25);
    });
```

**b) `getCommandTemplates` — "should include all expected commands" (line 107-122)**

After the length check, add a scope check and expand the ID list:

Replace:
```typescript
    it('should include all expected commands', () => {
      const templates = getCommandTemplates();
      const ids = templates.map(t => t.id);

      expect(ids).toContain('explore');
      expect(ids).toContain('new');
      expect(ids).toContain('continue');
      expect(ids).toContain('apply');
      expect(ids).toContain('ff');
      expect(ids).toContain('sync');
      expect(ids).toContain('archive');
      expect(ids).toContain('bulk-archive');
      expect(ids).toContain('verify');
      expect(ids).toContain('onboard');
      expect(ids).toContain('propose');
    });
```

With:
```typescript
    it('should include all expected commands', () => {
      const templates = getCommandTemplates();
      const ids = templates.map(t => t.id);

      // Workflow commands
      expect(ids).toContain('explore');
      expect(ids).toContain('new');
      expect(ids).toContain('continue');
      expect(ids).toContain('apply');
      expect(ids).toContain('ff');
      expect(ids).toContain('sync');
      expect(ids).toContain('archive');
      expect(ids).toContain('bulk-archive');
      expect(ids).toContain('verify');
      expect(ids).toContain('onboard');
      expect(ids).toContain('propose');
      // Global commands
      expect(ids).toContain('brainstorming');
      expect(ids).toContain('dispatching-parallel-agents');
      expect(ids).toContain('executing-plans');
      expect(ids).toContain('finishing-a-development-branch');
      expect(ids).toContain('receiving-code-review');
      expect(ids).toContain('requesting-code-review');
      expect(ids).toContain('subagent-driven-development');
      expect(ids).toContain('systematic-debugging');
      expect(ids).toContain('test-driven-development');
      expect(ids).toContain('using-git-worktrees');
      expect(ids).toContain('using-skills');
      expect(ids).toContain('verification-before-completion');
      expect(ids).toContain('writing-plans');
      expect(ids).toContain('writing-skills');
    });
```

**c) `getCommandTemplates` — "should filter by workflow IDs when provided" (line 124-134)**

Replace:
```typescript
    it('should filter by workflow IDs when provided', () => {
      const filtered = getCommandTemplates(['propose', 'explore', 'apply', 'archive']);
      expect(filtered).toHaveLength(4);
      const ids = filtered.map(t => t.id);
      expect(ids).toContain('propose');
      expect(ids).toContain('explore');
      expect(ids).toContain('apply');
      expect(ids).toContain('archive');
      expect(ids).not.toContain('new');
      expect(ids).not.toContain('ff');
    });
```

With:
```typescript
    it('should filter workflow commands but always include global commands', () => {
      const filtered = getCommandTemplates(['propose', 'explore', 'apply', 'archive']);
      // 4 workflow matches + 14 global = 18
      expect(filtered).toHaveLength(18);
      const ids = filtered.map(t => t.id);
      expect(ids).toContain('propose');
      expect(ids).toContain('explore');
      expect(ids).toContain('apply');
      expect(ids).toContain('archive');
      expect(ids).not.toContain('new');
      expect(ids).not.toContain('ff');
      // Global commands always present
      expect(ids).toContain('brainstorming');
      expect(ids).toContain('writing-plans');
    });
```

**d) `getCommandTemplates` — "should return empty array when filter matches nothing" (line 142-144)**

Replace:
```typescript
    it('should return empty array when filter matches nothing', () => {
      const filtered = getCommandTemplates(['nonexistent']);
      expect(filtered).toHaveLength(0);
    });
```

With:
```typescript
    it('should return only global commands when filter matches no workflow commands', () => {
      const filtered = getCommandTemplates(['nonexistent']);
      // Global commands are always included
      expect(filtered).toHaveLength(14);
      const ids = filtered.map(t => t.id);
      expect(ids).toContain('brainstorming');
      expect(ids).not.toContain('explore');
    });
```

**e) `getCommandContents` — "should return all 11 command contents" (line 149-152)**

Replace:
```typescript
    it('should return all 11 command contents', () => {
      const contents = getCommandContents();
      expect(contents).toHaveLength(11);
    });
```

With:
```typescript
    it('should return all 25 command contents (workflow + global)', () => {
      const contents = getCommandContents();
      expect(contents).toHaveLength(25);
    });
```

**f) `getCommandContents` — "should filter by workflow IDs when provided" (line 175-182)**

Replace:
```typescript
    it('should filter by workflow IDs when provided', () => {
      const filtered = getCommandContents(['propose', 'explore']);
      expect(filtered).toHaveLength(2);
      const ids = filtered.map(c => c.id);
      expect(ids).toContain('propose');
      expect(ids).toContain('explore');
      expect(ids).not.toContain('new');
    });
```

With:
```typescript
    it('should filter workflow contents but always include global contents', () => {
      const filtered = getCommandContents(['propose', 'explore']);
      // 2 workflow matches + 14 global = 16
      expect(filtered).toHaveLength(16);
      const ids = filtered.map(c => c.id);
      expect(ids).toContain('propose');
      expect(ids).toContain('explore');
      expect(ids).not.toContain('new');
      // Global commands always present
      expect(ids).toContain('brainstorming');
    });
```

**g) `getCommandContents` — "should return all contents when filter is undefined" (line 184-188)**

No change needed — this test is parameterized on `all.length`.

### Step 3: Run the full test suite

```bash
npx vitest run test/core/shared/skill-generation.test.ts test/core/shared/tool-detection-commands.test.ts test/core/shared/tool-detection.test.ts --reporter=verbose 2>&1
```

**Expected:** All tests pass.

---

## Task 8: Final verification — compile + full test suite

**Files:**
- No file changes

### Step 1: TypeScript compilation

```bash
npx tsc --noEmit 2>&1
```

**Expected:** No errors.

### Step 2: Full test suite

```bash
npx vitest run 2>&1
```

**Expected:** All tests pass.

### Step 3: Verify spec acceptance criteria

```bash
# AC1: Constant definitions
npx tsx -e "
const { WORKFLOW_COMMAND_IDS, GLOBAL_COMMAND_IDS, COMMAND_IDS } = await import('./src/core/shared/tool-detection.js');
console.log('WORKFLOW:', WORKFLOW_COMMAND_IDS.length);
console.log('GLOBAL:', GLOBAL_COMMAND_IDS.length);
console.log('ALL:', COMMAND_IDS.length);
console.log('MATCH:', COMMAND_IDS.length === WORKFLOW_COMMAND_IDS.length + GLOBAL_COMMAND_IDS.length);
"

# AC2: All 14 command templates are exported
npx tsx -e "
const templates = await import('./src/core/shared/skill-generation.js');
const all = templates.getCommandTemplates();
const global = all.filter(e => e.scope === 'global');
console.log('Global templates:', global.length);
console.log('All templates:', all.length);
global.forEach(e => console.log(' -', e.id, '|', e.template.name, '|', e.template.category));
"

# AC3: Dual-channel behavior
npx tsx -e "
const { getCommandTemplates } = await import('./src/core/shared/skill-generation.js');
const noFilter = getCommandTemplates();
const withFilter = getCommandTemplates(['propose', 'explore']);
console.log('No filter:', noFilter.length);
console.log('With filter [propose, explore]:', withFilter.length);
console.log('Global always present:', withFilter.filter(e => e.scope === 'global').length === 14);
"
```

**Expected output:**
```
WORKFLOW: 11
GLOBAL: 14
ALL: 25
MATCH: true
Global templates: 14
All templates: 25
 - brainstorming | APE: Brainstorming | Methodology
 - dispatching-parallel-agents | APE: Dispatching Parallel Agents | Methodology
 - executing-plans | APE: Executing Plans | Methodology
 - finishing-a-development-branch | APE: Finishing a Development Branch | Methodology
 - receiving-code-review | APE: Receiving Code Review | Methodology
 - requesting-code-review | APE: Requesting Code Review | Methodology
 - subagent-driven-development | APE: Subagent-Driven Development | Methodology
 - systematic-debugging | APE: Systematic Debugging | Methodology
 - test-driven-development | APE: Test-Driven Development | Methodology
 - using-git-worktrees | APE: Using Git Worktrees | Methodology
 - using-skills | APE: Using Skills | Methodology
 - verification-before-completion | APE: Verification Before Completion | Methodology
 - writing-plans | APE: Writing Plans | Methodology
 - writing-skills | APE: Writing Skills | Methodology
No filter: 25
With filter [propose, explore]: 16
Global always present: true
```
