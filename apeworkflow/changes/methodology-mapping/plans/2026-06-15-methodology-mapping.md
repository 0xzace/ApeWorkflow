# 方法论技能映射 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use apeworkflow-subagent-driven-development (recommended) or apeworkflow-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不新增主流程入口的前提下，让 5 个工作流阶段按 `功能开发 / 缺陷修复 / 重构 / 文档` 选择不同的方法论推荐顺序。

**Architecture:** This change stays inside the five stage skill templates. Each template gets an explicit task-type routing section that describes the order for that stage. Existing hash-based tests stay in place, so the implementation must refresh the parity fixture after the instruction strings change.

**Tech Stack:** TypeScript, Vitest, existing skill-template string generation.

---

### Task 1: Add task-type routing to `explore.ts` and `propose.ts`

**Files:**
- Modify: `src/core/templates/workflows/explore.ts`
- Modify: `src/core/templates/workflows/propose.ts`
- Test: `test/core/templates/skill-templates-parity.test.ts`

- [ ] **Step 1: Add the routing section to both instruction strings**

Insert the following markdown block into each template string, keeping the existing intro and stage-specific content intact:

```md
## 任务类型路由

### `功能开发`
- `explore`：`using-skills -> brainstorming`
- `propose`：`writing-plans -> using-git-worktrees -> dispatching-parallel-agents`

### `缺陷修复`
- `explore`：`using-skills -> brainstorming`
- `propose`：`systematic-debugging -> writing-plans -> using-git-worktrees`

### `重构`
- `explore`：`using-skills -> brainstorming`
- `propose`：`writing-plans -> using-git-worktrees -> dispatching-parallel-agents`

### `文档`
- `explore`：`using-skills -> brainstorming`
- `propose`：`writing-plans`

### 统一规则
- `explore` 阶段先路由，再澄清
- `propose` 阶段先定计划，再选工作区或并行策略
```

- [ ] **Step 2: Run the parity test before refreshing hashes**

Run: `pnpm test -- test/core/templates/skill-templates-parity.test.ts`

Expected: FAIL because the `explore` and `propose` template payload hashes no longer match the fixture.

### Task 2: Add task-type routing to `apply-change.ts`, `verify-change.ts`, and `archive-change.ts`

**Files:**
- Modify: `src/core/templates/workflows/apply-change.ts`
- Modify: `src/core/templates/workflows/verify-change.ts`
- Modify: `src/core/templates/workflows/archive-change.ts`
- Test: `test/core/templates/skill-templates-parity.test.ts`

- [ ] **Step 1: Add the routing section to the three instruction strings**

Insert the following markdown block into each template string, keeping the existing stage guidance intact:

```md
## 任务类型路由

### `功能开发`
- `apply`：`executing-plans -> test-driven-development -> subagent-driven-development`
- `verify`：`verification-before-completion -> requesting-code-review -> receiving-code-review`
- `archive`：`finishing-a-development-branch -> verification-before-completion`

### `缺陷修复`
- `apply`：`systematic-debugging -> test-driven-development -> executing-plans`
- `verify`：`verification-before-completion -> requesting-code-review -> receiving-code-review`
- `archive`：`finishing-a-development-branch -> verification-before-completion`

### `重构`
- `apply`：`executing-plans -> test-driven-development -> subagent-driven-development`
- `verify`：`verification-before-completion -> requesting-code-review -> receiving-code-review`
- `archive`：`finishing-a-development-branch -> verification-before-completion`

### `文档`
- `apply`：`writing-skills`
- `verify`：`verification-before-completion`
- `archive`：`finishing-a-development-branch -> verification-before-completion`

### 统一规则
- `apply` 阶段按任务类型选择执行顺序
- `verify` 阶段先提供验证证据，再进入 review
- `archive` 阶段先收尾，再确认归档
```

- [ ] **Step 2: Run the parity test again**

Run: `pnpm test -- test/core/templates/skill-templates-parity.test.ts`

Expected: FAIL until the parity fixture is refreshed.

### Task 3: Refresh the parity fixture for the five changed templates

**Files:**
- Modify: `test/core/templates/skill-templates-parity.test.ts`

- [ ] **Step 1: Replace the hash values for the changed template functions and generated content**

Update the expected hashes for these five template functions:

- `getExploreSkillTemplate`
- `getApeProposeSkillTemplate`
- `getApplyChangeSkillTemplate`
- `getVerifyChangeSkillTemplate`
- `getArchiveChangeSkillTemplate`

Update the expected generated content hashes for these five skill directories:

- `apeworkflow-explore`
- `apeworkflow-propose`
- `apeworkflow-apply-change`
- `apeworkflow-verify-change`
- `apeworkflow-archive-change`

- [ ] **Step 2: Run the focused parity test**

Run: `pnpm test -- test/core/templates/skill-templates-parity.test.ts`

Expected: PASS.

- [ ] **Step 3: Run the template regression suite**

Run: `pnpm test -- test/core/templates/skill-templates-parity.test.ts test/core/shared/skill-generation.test.ts`

Expected: PASS, and the counts in `skill-generation.test.ts` should remain unchanged.

---

### Scope Check

- Do not modify `src/core/shared/skill-generation.ts`
- Do not modify `src/core/shared/tool-detection.ts`
- Do not modify `src/core/templates/skill-templates.ts`
- Do not modify command registry files
- Do not add a new runtime routing layer

This implementation is a text-and-test change inside the five main workflow templates.
