# ApeWorkflow UX Issues — Fix Design

> **Date:** 2026-06-18
> **Scope:** All 19 UX issues identified in exploration (commands, skills, config, CLI behavior)
> **Strategy:** Command thinning + Skill routing + 4-config maximums + smart defaults

---

## Problem Statement

ApeWorkflow has 19 UX issues spanning 7 categories, making the CLI hard to adopt and use:

| Category | Count | Key Issues |
|----------|-------|------------|
| Duplication / Maintenance | 2 | #2 commands≅skills, #15 dual-edit cost |
| Cognitive Load | 3 | #1 concept overload, #3 skill nesting, #10 1% rule |
| Missing Config | 1 | #17 no user-overridable settings |
| Inconsistent Behavior | 7 | #4 auto-select, #5 propose loop, #7 conflict detection, #11 granularity, #13 workspace STOP, #14 date collision, #18 onboarding assumptions |
| Async Risk | 1 | #6 spec sync fire-and-forget |
| Error Recovery | 1 | #12 no retry/rollback |
| Experience | 2 | #8 TDD dogmatism, #9 anti-gratitude, #19 pause overload |

---

## Solution Overview

Three parallel tracks:

1. **Command thinning + Skill routing** — Commands own selection, routing, progress. Skills own methodology, steps, checklists.
2. **4-config maximum** — `strictness`, `plan`, `skills`, `onboarding`. Everything else fixed by smart defaults in code.
3. **CLI code improvements** — Bulk fetch, sync-wait, partial-execute, auto-suffix, retry, incremental loading.

---

## Section 1: Command Thinning + Skill Routing

### Current State

| Command | Lines | Duplicates |
|---------|-------|------------|
| `explore.md` | 284 | `apeworkflow-explore/SKILL.md` |
| `propose.md` | 113 | `apeworkflow-propose/SKILL.md` |
| `apply.md` | 156 | `apeworkflow-apply-change/SKILL.md` |
| `archive.md` | 116 | `apeworkflow-archive-change/SKILL.md` |
| `feedback.md` | 25 | `apeworkflow-feedback/SKILL.md` |
| `verify.md` | 170 | _(independent, creating new Skill)_ |
| `bulk-archive.md` | 244 | _(independent)_ |
| `onboard.md` | 549 | _(independent)_ |

**8 commands × 200 avg lines = 1600 lines, ~60% duplicated with Skills.**

### Target State

```
.expanded
├── commands/ape/
│   ├── explore.md      3 lines  (delegate to skill)
│   ├── propose.md      5 lines  (delegate to skill)
│   ├── apply.md       30 lines  (routing + progress + output)
│   ├── archive.md     25 lines  (selection + mv + report)
│   ├── verify.md     30 lines  (routing + report, logic in Skill)
│   ├── feedback.md    5 lines  (delegate to skill)
│   ├── bulk-archive.md  244 lines (independent, kept)
│   └── onboard.md      549 lines (independent, kept)
├── skills/
│   ├── apeworkflow-explore/         (existing, unchanged)
│   ├── apeworkflow-propose/         (existing, unchanged)
│   ├── apeworkflow-apply-change/    (existing, unchanged)
│   ├── apeworkflow-archive-change/  (existing, unchanged)
│   ├── apeworkflow-feedback/        (existing, unchanged)
│   └── apeworkflow-verification/    (NEW — from verify.md)
```

**Total command lines: 1600 → ~1040 lines, -35% overall, -60% in duplicated files.**

### Command → Skill Routing Map

| Command | Delegation |
|---------|-----------|
| `/ape:explore` | → `apeworkflow-explore` |
| `/ape:propose` | → `apeworkflow-propose` |
| `/ape:apply` | → `apeworkflow-apply-change` + schema-based taskTypeRouting |
| `/ape:archive` | → `apeworkflow-archive-change` |
| `/ape:verify` | → `apeworkflow-verification` |
| `/ape:feedback` | → `apeworkflow-feedback` |
| `/ape:bulk-archive` | Inline (no Skill, independent) |
| `/ape:onboard` | Inline (no Skill, independent) |

### Key Principle

```
Command = Selection + Routing + Progress Tracking + Output Formatting
Skill   = Methodology + Step-by-Step + Checklists + Guardrails
```

---

## Section 2: Config Structure (4 Keys)

### config.yaml Default Template

```yaml
# ============================================================
# ApeWorkflow Configuration
# ============================================================

strictness:
  # Methodology strictness
  tdd: true               # true=iron-clad (must TDD), false=recommended, skip=disabled
  noGratitude: true       # true=disable performative thanks, false=normal interaction
  selectionPolicy:        # Change selection strategy (unified across apply/archive/verify)
    default: auto-if-single  # auto-if-single | always-prompt

plan:
  # Implementation plan granularity
  granularity: medium     # fine=steps 2-5min (10+ steps), medium=3-5 steps per task, coarse=1 paragraph per task

skills:
  # Skill loading and execution strategy
  loadPolicy: smart       # smart=keyword-based (recommended), strict=load-on-1%-chance
  maxDepth: 2             # Maximum nesting depth for skills (default 2, prevents 7-layer nesting)

onboarding:
  # Onboarding experience tuning
  maxPauses: 3            # Maximum PAUSE points during guided walkthrough
  # Preserves: pause after explore demo, pause after archive
  # Skips: pause after proposal draft, pause after tasks outline
```

### Design Rationale

| Key | Solves | Default | Why |
|-----|--------|---------|-----|
| `strictness` | #8 TDD, #9 gratitude, #4 auto-select | Current behavior | Unifies execution style |
| `plan` | #11 granularity | `medium` | Less robotic than `fine`, more structured than `coarse` |
| `skills` | #3 nesting, #10 1% rule | `smart` + depth 2 | On-demand loading, bounded recursion |
| `onboarding` | #1 concept load, #19 pauses | `maxPauses: 3` | Guided but not interrupted |

### Items Fixed by Code, Not Config

| # | Issue | Fix Location |
|---|-------|-------------|
| 5 | Propose artifact loop | `src/core/planning-home.ts` — bulk fetch dependency graph |
| 6 | Spec sync async risk | `src/core/archive.ts` — sync-wait before mv |
| 7 | Bulk-archive conflict detection | `src/core/archive.ts` — pre-check for single-archive too |
| 12 | No error recovery | `src/cli/error-handling.ts` — retry + warn-not-stop |
| 13 | Workspace STOP too conservative | `src/core/change-status-policy.ts` — partial execution |
| 14 | Archive date collision | `src/core/archive.ts` — auto-suffix `-1`, `-2` |
| 16 | Plans bottleneck | `src/core/planning-files.ts` — incremental loading |
| 18 | Onboarding assumptions | `src/core/init.ts` — empty/small project graceful degradation |

---

## Section 3: Skill Loading Engine (Solves #1, #3, #10)

### Current: 1% Rule

```
User says anything → Check all 20 Skills → Load if 1% match → Result: 20 CLI calls
```

### New: Smart Match Engine

```
User input → Keyword/intent matcher → Load 1-3 Skills → Result: O(1) lookup
```

| User Input | Loaded Skills |
|------------|--------------|
| "help me implement X" | `propose`, `apply-change` |
| "fix X" | `apply-change` |
| "debug X" | `systematic-debugging` |
| "review X" | `requesting-review`, `receiving-review` |
| "write plan" | `writing-plans` |
| "cleanup" | `finishing-a-dev-branch` |
| Simple question (no action) | _(none)_ |

### Rules

1. Match by keyword intent
2. Load at most 3 skills
3. `maxDepth=2` by default (configurable)
4. Rank by relevance score
5. No skill loaded for read-only operations (`list`, `status`, `view`)

---

## Section 4: New Skill — apeworkflow-verification

Extracted from `verify.md` (170 lines). The command file (`verify.md`) becomes a 30-line router.

### Structure

```
apeworkflow-verification/
  SKILL.md   (~140 lines, from current verify.md)
```

### Content

- Three-dimension verification: Completeness, Correctness, Coherence
- Graceful degradation (plan-only / plan+specs / full artifacts)
- Config-aware strictness (read from `strictness.selectionPolicy`)
- Report template (scorecard + issues by priority)

### Command File (verify.md)

```markdown
---
name: "APE: Verify"
description: "Verify implementation matches change artifacts"
---

Select a change, delegate to apeworkflow-verification skill, show report.
```

---

## Section 5: CLI Code Changes

### 5.1 Bulk Dependency Graph (Solves #5)

**File:** `src/core/planning-home.ts`

```typescript
// Before: create → status → check → create → status → check (5 iterations)
// After: single call
const graph = await getArtifactGraph(changeName);
// Returns: { artifacts: [...], applyRequires: [...], dependencyOrder: [...] }
// AI computes local order, creates all artifacts, no CLI round-trips
```

### 5.2 Sync-Wait Before Archive (Solves #6)

**File:** `src/core/archive.ts`

```typescript
// Before: fire sync subagent → immediately mv (race condition)
// After: sync → await → mv
if (hasDeltaSpecs) {
  await syncSpecs(changeName);  // synchronous, throws on failure
  await moveChangeToArchive(changeName, date);
}
```

### 5.3 Pre-Check for Single-Archive Conflicts (Solves #7)

**File:** `src/core/archive.ts`

```typescript
// Before: only bulk-archive checked cross-change spec conflicts
// After: both single and bulk check
function preCheckArchiveConflict(changeName: string): ConflictReport | null {
  const activeChanges = listActiveChanges();
  const mySpecs = getDeltaSpecs(changeName);
  for (const other of activeChanges) {
    if (overlaps(mySpecs, getDeltaSpecs(other))) {
      return { change: other, capability: overlap };
    }
  }
  return null;
}
```

### 5.4 Retry + Warn-Not-Stop (Solves #12)

**File:** `src/cli/error-handling.ts`

```typescript
async function retryWithFallback<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; onWarning?: (err: Error) => void } = {}
): Promise<T | null> {
  const { maxAttempts = 2, onWarning } = options;
  for (let i = 0; i < maxAttempts; i++) {
    try { return await fn(); }
    catch (err) {
      if (i < maxAttempts - 1) { onWarning?.(err); continue; }
      return null;  // non-fatal: return null, don't crash
    }
  }
}
```

### 5.5 Partial Execute for workspace-planning (Solves #13)

**File:** `src/core/change-status-policy.ts`

```typescript
// Before: allowedEditRoots empty → STOP everything
// After: list available roots → let user choose
function resolveEditScope(actionContext: ActionContext): EditScope {
  if (actionContext.mode === 'workspace-planning') {
    if (actionContext.allowedEditRoots?.length > 0) {
      return { mode: 'full', roots: actionContext.allowedEditRoots };
    }
    // New: offer partial execution
    const availableRoots = listAvailableEditRoots(actionContext);
    if (availableRoots.length > 0) {
      return { mode: 'partial', roots: availableRoots, askUser: true };
    }
    return { mode: 'none', reason: 'no editable roots' };
  }
  return { mode: 'full', roots: ['repo-local'] };
}
```

### 5.6 Auto-Suffix for Archive Name (Solves #14)

**File:** `src/core/archive.ts`

```typescript
function generateArchiveName(name: string, date: string): string {
  let candidate = `${date}-${name}`;
  let suffix = 1;
  while (archiveExists(candidate)) {
    candidate = `${date}-${name}-${suffix}`;
    suffix++;
  }
  return candidate;
}
```

### 5.7 Incremental Planning Context (Solves #16)

**File:** `src/core/planning-files.ts`

```typescript
function loadPlanningContext(changeName: string, granularity: 'fine' | 'medium' | 'coarse'): PlanningContext {
  // Fine: load all artifacts entirely
  // Medium: load proposal + relevant specs per task
  // Coarse: load task outline + proposal summary only
  const base = { proposal: loadProposal(changeName) };
  if (granularity === 'fine') {
    return { ...base, specs: loadAllSpecs(changeName), design: loadDesign(changeName), tasks: loadTasks(changeName) };
  }
  if (granularity === 'medium') {
    return { ...base, specs: loadRelevantSpecs(changeName), design: loadDesign(changeName) };
  }
  return { ...base, tasks: loadTasks(changeName) };
}
```

### 5.8 Onboarding Graceful Degradation (Solves #18)

**File:** `src/core/init.ts` (onboard logic)

```typescript
function scanForTasks(): ScanResult {
  const todos = searchTodoComments();
  const errors = findMissingErrorHandling();
  const smallProjects = findUntestedFunctions();

  if (todos.length === 0 && errors.length === 0 && smallProjects.length === 0) {
    return { status: 'empty', suggestion: 'hello-world-exercise' };
  }
  if (todos.length + errors.length <= 2) {
    return { status: 'small', suggestion: 'skip-brainstorming' };
  }
  return { status: 'rich', suggestions: generateSuggestions() };
}
```

---

## Section 6: Backward Compatibility

| Change | Backward Compatible | Notes |
|--------|-------------------|-------|
| Command thinning | ✅ | Behavior unchanged, only delegation added |
| New config keys | ✅ | Old configs without these keys → default values |
| `apply/archive/verify` selection | ✅ | `auto-if-single` matches current apply behavior |
| Archive auto-suffix | ✅ | Only triggers on collision, doesn't affect normal archive |
| Verify Skill extraction | ✅ | `/ape:verify` works the same, logic moved to Skill |
| Skill loading engine | ✅ | `loadPolicy: smart` replaces `strict` without changing outcomes for most users |
| New artifact loop | ✅ | Bulk fetch returns same data as current status --json |

---

## Section 7: File Change Summary

| File | Change | Lines |
|------|--------|-------|
| `.claude/commands/ape/explore.md` | Thin to 3 lines | 284 → 3 |
| `.claude/commands/ape/propose.md` | Thin to 5 lines | 113 → 5 |
| `.claude/commands/ape/apply.md` | Keep routing, remove methodology | 156 → 30 |
| `.claude/commands/ape/archive.md` | Keep selection, remove methodology | 116 → 25 |
| `.claude/commands/ape/verify.md` | Thin, delegate to Skill | 170 → 30 |
| `.claude/commands/ape/feedback.md` | Thin to 5 lines | 25 → 5 |
| `.claude/skills/apeworkflow-verification/SKILL.md` | **NEW** — from verify.md | +140 |
| `apeworkflow/config.yaml` (default template) | **NEW** — 4-key config | +20 |
| `src/core/config.ts` | Config loading + validation | +80 |
| `src/core/archive.ts` | Sync-wait, pre-check, auto-suffix | +50 |
| `src/core/planning-home.ts` | Bulk dependency graph | +30 |
| `src/core/planning-files.ts` | Incremental loading | +40 |
| `src/cli/error-handling.ts` | Retry logic | +30 |
| `src/core/change-status-policy.ts` | Partial execution | +25 |
| `src/core/init.ts` | Onboard degradation | +20 |

**Total: ~14 files changed, +470 lines added, -900 lines removed, net -430 lines.**

---

## Appendix: Issue Traceability Matrix

| Issue | Fix Track | Location |
|-------|-----------|----------|
| #1 Concept overload | Section 3 (smart loading) + Section 2 (onboarding config) | `skills.loadPolicy`, `onboarding.maxPauses` |
| #2 Commands≅Skills duplication | Section 1 (command thinning) | `.claude/commands/ape/` |
| #3 Skill nesting depth | Section 3 (maxDepth) | `skills.maxDepth` |
| #4 Auto-select inconsistency | Section 2 (strictness) | `strictness.selectionPolicy` |
| #5 Propose artifact loop | Section 5.1 | `src/core/planning-home.ts` |
| #6 Spec sync async risk | Section 5.2 | `src/core/archive.ts` |
| #7 Conflict detection | Section 5.3 | `src/core/archive.ts` |
| #8 TDD dogmatism | Section 2 | `strictness.tdd` |
| #9 Anti-gratitude | Section 2 | `strictness.noGratitude` |
| #10 1% rule redundancy | Section 3 | `skills.loadPolicy` |
| #11 Plan granularity | Section 2 | `plan.granularity` |
| #12 No error recovery | Section 5.4 | `src/cli/error-handling.ts` |
| #13 Workspace STOP | Section 5.5 | `src/core/change-status-policy.ts` |
| #14 Archive date collision | Section 5.6 | `src/core/archive.ts` |
| #15 Dup maintenance cost | Section 1 (same as #2) | `.claude/commands/ape/` |
| #16 Plans bottleneck | Section 5.7 | `src/core/planning-files.ts` |
| #17 No config layer | Section 2 | `apeworkflow/config.yaml` |
| #18 Onboarding assumptions | Section 5.8 | `src/core/init.ts` |
| #19 Pause overload | Section 2 | `onboarding.maxPauses` |
