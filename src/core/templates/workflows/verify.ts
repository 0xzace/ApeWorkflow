/**
 * Verification Skill Template
 *
 * Provides 3-dimension verification: Completeness, Correctness, Coherence.
 * Distinct from the CLI verify-change command template.
 */
import type { SkillTemplate } from '../types.js';

export function getVerificationSkillTemplate(): SkillTemplate {
  return {
    name: 'apeworkflow-verification',
    description:
      'Verify implementation matches change artifacts (specs, tasks, design). Use when the user wants to validate implementation is complete, correct, and coherent before archiving.',
    license: 'MIT',
    compatibility: 'Requires apeworkflow CLI.',
    metadata: { author: 'apeworkflow', version: '1.0' },
    instructions: `Verify that an implementation matches the change artifacts (specs, tasks, design).

**Input**: Optionally specify a change name. If omitted, run \`apeworkflow list --json\` to get available changes and use **AskUserQuestion tool** to let the user select.

**Steps**

1. **If no change name provided, prompt for selection**
   Run \`apeworkflow list --json\` to get available changes.
   Show changes that have implementation tasks (plan files under \`plans/\` exist).
   Mark changes with incomplete tasks as "(In Progress)".

   **Config-aware selection:** Read \`strictness.selectionPolicy\` from config:
   - \`auto-if-single\`: auto-select if only one active change exists
   - \`always-prompt\`: always prompt the user (recommended for verify)
   - If not set, use \`always-prompt\` for verify (safer default)

2. **Check status**
   \`\`\`bash
   apeworkflow status --change "<name>" --json
   \`\`\`

3. **Get planning context**
   \`\`\`bash
   apeworkflow instructions apply --change "<name>" --json
   \`\`\`
   Read all available artifacts from \`contextFiles\`.

4. **Initialize verification report**
   Create a report with three dimensions:
   - **Completeness**: Track tasks and spec coverage
   - **Correctness**: Track requirement implementation and scenario coverage
   - **Coherence**: Track design adherence and pattern consistency

5. **Verify Completeness**
   - If \`contextFiles.tasks\` exists, read every file path
   - Parse checkboxes: \`- [ ]\` (incomplete) vs \`- [x]\` (complete)
   - Count complete vs total tasks
   - Add CRITICAL issue for each incomplete task

6. **Verify Correctness**
   - For each requirement from delta specs, search codebase for implementation evidence
   - For each scenario, check if conditions are handled in code
   - Add WARNING for spec/design divergences

7. **Verify Coherence**
   - If design.md exists, verify implementation follows key decisions
   - Check code pattern consistency with project patterns
   - Add SUGGESTION for minor deviations

8. **Generate Verification Report**
   Summary scorecard + Issues by Priority (CRITICAL/WARNING/SUGGESTION)

**Graceful Degradation**
- If only plan files exist: verify task completion only
- If tasks + specs exist: verify completeness and correctness
- If full artifacts: verify all three dimensions
- Always note which checks were skipped and why`,
  };
}
