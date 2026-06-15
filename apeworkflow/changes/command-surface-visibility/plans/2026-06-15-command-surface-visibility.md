# 命令展示面收敛 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use apeworkflow-subagent-driven-development (recommended) or apeworkflow-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让所有文档/引导里展示的命令从同一份共享可见集合渲染，并移除 `new`、`continue`、`ff`、`sync` 这四个隐藏命令的默认展示。

**Architecture:** Introduce a tiny shared template helper that owns the visible command list and the markdown renderers used by onboarding and workflow guidance. `onboard.ts` and the command-heavy workflow templates will import that helper directly so the display surface has one source of truth, while CLI registration, command generation, shell completion, and profile logic stay unchanged. Tests will cover the helper output, the rendered onboarding text, and the existing parity fixture after template strings change.

**Tech Stack:** TypeScript, Vitest, string-based template generation, existing ApeWorkflow skill/template modules.

---

### Task 1: Add a shared visible-command surface helper

**Files:**
- Create: `src/core/templates/visible-command-surface.ts`
- Create: `test/core/templates/visible-command-surface.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import {
  VISIBLE_COMMAND_IDS,
  renderVisibleCoreCommandTable,
  renderVisibleAdditionalCommandTable,
  renderVisibleCommandReference,
  renderVisibleNextStep,
} from '../../../src/core/templates/visible-command-surface.js';

describe('visible-command-surface', () => {
  it('exports only the eight visible commands', () => {
    expect(VISIBLE_COMMAND_IDS).toEqual([
      'explore',
      'propose',
      'apply',
      'verify',
      'archive',
      'onboard',
      'bulk-archive',
      'feedback',
    ]);
  });

  it('renders command reference text without hidden commands', () => {
    const reference = renderVisibleCommandReference();

    expect(reference).toContain('/ape:propose');
    expect(reference).toContain('/ape:apply');
    expect(reference).not.toContain('/ape:new');
    expect(reference).not.toContain('/ape:continue');
    expect(reference).not.toContain('/ape:ff');
    expect(reference).not.toContain('/ape:sync');
  });

  it('renders onboarding sections from the same source', () => {
    const core = renderVisibleCoreCommandTable();
    const additional = renderVisibleAdditionalCommandTable();

    expect(core).toContain('/ape:explore');
    expect(core).toContain('/ape:archive');
    expect(additional).toContain('/ape:feedback');
    expect(additional).toContain('/ape:onboard');
    expect(core).not.toContain('/ape:new');
    expect(additional).not.toContain('/ape:continue');
  });

  it('renders a visible next-step prompt', () => {
    expect(renderVisibleNextStep('propose')).toContain('/ape:propose');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- test/core/templates/visible-command-surface.test.ts`

Expected: FAIL because `src/core/templates/visible-command-surface.ts` does not exist yet.

- [ ] **Step 3: Implement the helper module**

```ts
export const VISIBLE_COMMAND_IDS = [
  'explore',
  'propose',
  'apply',
  'verify',
  'archive',
  'onboard',
  'bulk-archive',
  'feedback',
] as const;

export type VisibleCommandId = (typeof VISIBLE_COMMAND_IDS)[number];

const CORE_VISIBLE_COMMAND_IDS: readonly VisibleCommandId[] = [
  'explore',
  'propose',
  'apply',
  'archive',
];

const ADDITIONAL_VISIBLE_COMMAND_IDS: readonly VisibleCommandId[] = [
  'verify',
  'onboard',
  'bulk-archive',
  'feedback',
];

function renderCommandRows(commandIds: readonly VisibleCommandId[]): string {
  return commandIds
    .map((commandId) => {
      const commandText = `/ape:${commandId}`;
      const descriptionById: Record<VisibleCommandId, string> = {
        explore: 'Think through problems before or during work',
        propose: 'Create a change and generate all artifacts',
        apply: 'Implement tasks from a change',
        verify: 'Verify implementation matches artifacts',
        archive: 'Archive a completed change',
        onboard: 'Learn the ApeWorkflow workflow',
        'bulk-archive': 'Archive multiple completed changes',
        feedback: 'Submit feedback about ApeWorkflow',
      };

      return ` | \`${commandText}\` | ${descriptionById[commandId]} |`;
    })
    .join('\n');
}

export function renderVisibleCoreCommandTable(): string {
  return [
    '**Core workflow:**',
    '',
    ' | Command           | What it does                               |',
    ' |-------------------|--------------------------------------------|',
    renderCommandRows(CORE_VISIBLE_COMMAND_IDS),
  ].join('\n');
}

export function renderVisibleAdditionalCommandTable(): string {
  return [
    '**Additional commands:**',
    '',
    ' | Command           | What it does                               |',
    ' |-------------------|--------------------------------------------|',
    renderCommandRows(ADDITIONAL_VISIBLE_COMMAND_IDS),
  ].join('\n');
}

export function renderVisibleCommandReference(): string {
  return [
    renderVisibleCoreCommandTable(),
    '',
    renderVisibleAdditionalCommandTable(),
  ].join('\n');
}

export function renderVisibleNextStep(commandId: VisibleCommandId): string {
  return `\`/ape:${commandId}\``;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test -- test/core/templates/visible-command-surface.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/templates/visible-command-surface.ts test/core/templates/visible-command-surface.test.ts
git commit -m "feat: add visible command surface helper"
```

---

### Task 2: Rewrite onboarding and workflow guidance to use the shared surface

**Files:**
- Modify: `src/core/templates/workflows/onboard.ts`
- Modify: `src/core/templates/workflows/new-change.ts`
- Modify: `src/core/templates/workflows/continue-change.ts`
- Modify: `src/core/templates/workflows/ff-change.ts`
- Modify: `src/core/templates/workflows/sync-specs.ts`
- Modify: `src/core/templates/workflows/apply-change.ts`
- Verify: `src/core/templates/workflows/explore.ts`
- Verify: `src/core/templates/workflows/propose.ts`
- Verify: `src/core/templates/workflows/verify-change.ts`
- Verify: `src/core/templates/workflows/archive-change.ts`
- Verify: `src/core/templates/workflows/feedback.ts`
- Modify: `test/core/templates/command-surface-visibility.test.ts`

- [ ] **Step 1: Add the onboarding regression test before changing templates**

```ts
import { describe, expect, it } from 'vitest';
import { getOnboardSkillTemplate } from '../../../src/core/templates/workflows/onboard.js';
import { getNewChangeSkillTemplate } from '../../../src/core/templates/workflows/new-change.js';
import { getContinueChangeSkillTemplate } from '../../../src/core/templates/workflows/continue-change.js';
import { getFfChangeSkillTemplate } from '../../../src/core/templates/workflows/ff-change.js';
import { getSyncSpecsSkillTemplate } from '../../../src/core/templates/workflows/sync-specs.js';
import { getApplyChangeSkillTemplate } from '../../../src/core/templates/workflows/apply-change.js';

describe('command surface visibility', () => {
  const hiddenCommands = ['/ape:new', '/ape:continue', '/ape:ff', '/ape:sync'];

  it('keeps hidden commands out of onboarding text', () => {
    const onboarding = getOnboardSkillTemplate().instructions;

    for (const hidden of hiddenCommands) {
      expect(onboarding).not.toContain(hidden);
    }
  });

  it('keeps hidden commands out of change guidance templates', () => {
    const templates = [
      getNewChangeSkillTemplate().instructions,
      getContinueChangeSkillTemplate().instructions,
      getFfChangeSkillTemplate().instructions,
      getSyncSpecsSkillTemplate().instructions,
      getApplyChangeSkillTemplate().instructions,
    ];

    for (const body of templates) {
      for (const hidden of hiddenCommands) {
        expect(body).not.toContain(hidden);
      }
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- test/core/templates/command-surface-visibility.test.ts`

Expected: FAIL because the templates still contain `/ape:new`, `/ape:continue`, `/ape:ff`, or `/ape:sync`.

- [ ] **Step 3: Import the shared renderer in `onboard.ts` and replace the hand-written tables**

Use the helper functions from `src/core/templates/visible-command-surface.ts` to replace the two markdown tables and the next-step prompt.

```ts
import {
  renderVisibleCommandReference,
  renderVisibleNextStep,
} from '../visible-command-surface.js';

// Replace the duplicated tables with the shared block.
${renderVisibleCommandReference()}

// Replace the final prompt with the shared visible next step.
Try ${renderVisibleNextStep('propose')} on something you actually want to build. You've got the rhythm now!
```

- [ ] **Step 4: Rewrite the hidden-command templates to remove visible references to `/ape:new`, `/ape:continue`, `/ape:ff`, and `/ape:sync`**

Apply the same rule in each file:

- `src/core/templates/workflows/new-change.ts`
- `src/core/templates/workflows/continue-change.ts`
- `src/core/templates/workflows/ff-change.ts`
- `src/core/templates/workflows/sync-specs.ts`
- `src/core/templates/workflows/apply-change.ts`

Use the visible helper where a prompt or table should still show a command, and rewrite the remaining prose so it explains the action in plain language instead of naming a hidden command.

```ts
// Example rewrite in continue-change.ts:
// Before:
// - Prompt: "Run `/ape:continue` to create the next artifact"
//
// After:
// - Prompt: "Continue with the next artifact when you're ready."
```

- [ ] **Step 5: Run the onboarding visibility test again**

Run: `pnpm test -- test/core/templates/command-surface-visibility.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/core/templates/workflows/onboard.ts src/core/templates/workflows/new-change.ts src/core/templates/workflows/continue-change.ts src/core/templates/workflows/ff-change.ts src/core/templates/workflows/sync-specs.ts src/core/templates/workflows/apply-change.ts test/core/templates/command-surface-visibility.test.ts
git commit -m "feat: converge visible command surface in guidance"
```

---

### Task 3: Refresh template parity hashes and verify the final command surface

**Files:**
- Modify: `test/core/templates/skill-templates-parity.test.ts`
- Test: `test/core/templates/visible-command-surface.test.ts`
- Test: `test/core/templates/command-surface-visibility.test.ts`
- Test: `test/core/shared/skill-generation.test.ts`

- [ ] **Step 1: Run the parity test to capture the new hashes**

Run: `pnpm test -- test/core/templates/skill-templates-parity.test.ts`

Expected: FAIL because the onboarding and workflow template payload hashes changed after the visible-command rewrite.

- [ ] **Step 2: Update the expected hashes in the parity fixture**

Replace the expected hash entries for every template whose instructions changed in Task 2, then keep the generated-content hashes aligned with the updated strings.

```ts
// Update the expected hash table in test/core/templates/skill-templates-parity.test.ts
// so the onboarding and affected workflow templates match the new rendered text.
```

- [ ] **Step 3: Run the full template-focused regression set**

Run: `pnpm test -- test/core/templates/visible-command-surface.test.ts test/core/templates/command-surface-visibility.test.ts test/core/templates/skill-templates-parity.test.ts test/core/shared/skill-generation.test.ts`

Expected: PASS.

- [ ] **Step 4: Verify the final state does not leak hidden commands**

Confirm the rendered onboarding text and workflow guidance strings do not contain `/ape:new`, `/ape:continue`, `/ape:ff`, or `/ape:sync`, while the visible 8-command set remains intact.

- [ ] **Step 5: Commit**

```bash
git add test/core/templates/skill-templates-parity.test.ts
git commit -m "test: refresh command surface parity hashes"
```

---

### Scope Check

- This plan stays within the documentation/guidance display surface.
- CLI registration, command generation, shell completion, and profile logic remain untouched.
- The only new abstraction is the shared visible-command surface helper used by template text.
