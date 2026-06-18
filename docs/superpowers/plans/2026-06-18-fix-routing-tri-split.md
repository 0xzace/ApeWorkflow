# Fix Routing Tri-Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove hardcoded Chinese routing tables from template files and installed command files, replacing them with inline directives that tell the AI agent to call the CLI for routing at runtime.

**Architecture:** Four files need edits — two template source files (`verify-change.ts`, `archive-change.ts`) have a `taskRoutingBlock` constant and `${taskRoutingBlock}` interpolations that must be removed; two installed command files (`verify.md`, `archive.md`) have the Chinese routing table markdown blocks that must be replaced. The CLI (`instructions.ts`) and schema (`schema.yaml`) are already correct and need no changes.

**Tech Stack:** TypeScript (template files), Markdown (command files). No new dependencies.

---

### Task 1: Remove `taskRoutingBlock` from `verify-change.ts`

**Files:**
- Modify: `src/core/templates/workflows/verify-change.ts`

- [ ] **Step 1: Delete the `taskRoutingBlock` constant**

  Delete lines 9–37:

  ```typescript
  // 任务类型路由块，供两个模板复用
  const taskRoutingBlock = [
    '## 任务类型路由',
    '',
    '### `功能开发`',
    '- `apply`：`executing-plans -> test-driven-development -> subagent-driven-development`',
    '- `verify`：`verification-before-completion -> requesting-code-review -> receiving-code-review`',
    '- `archive`：`finishing-a-development-branch -> verification-before-completion`',
    '',
    '### `缺陷修复`',
    '- `apply`：`systematic-debugging -> test-driven-development -> executing-plans`',
    '- `verify`：`verification-before-completion -> requesting-code-review -> receiving-code-review`',
    '- `archive`：`finishing-a-development-branch -> verification-before-completion`',
    '',
    '### `重构`',
    '- `apply`：`executing-plans -> test-driven-development -> subagent-driven-development`',
    '- `verify`：`verification-before-completion -> requesting-code-review -> receiving-code-review`',
    '- `archive`：`finishing-a-development-branch -> verification-before-completion`',
    '',
    '### `文档`',
    '- `apply`：`writing-skills`',
    '- `verify`：`verification-before-completion`',
    '- `archive`：`finishing-a-development-branch -> verification-before-completion`',
    '',
    '### 统一规则',
    '- `apply` 阶段按任务类型选择执行顺序',
    '- `verify` 阶段先提供验证证据，再进入 review',
    '- `archive` 阶段先收尾，再确认归档',
  ].join('\n');
  ```

  After deletion, line 39 (`export function getVerifyChangeSkillTemplate()`) will be immediately after the import.

- [ ] **Step 2: Replace `${taskRoutingBlock}` in `getVerifyChangeSkillTemplate`**

  Line 188 (inside the `instructions` string): replace
  ```
  ${taskRoutingBlock}
  ```
  with
  ```
  任务类型路由：调用 `apeworkflow instructions verify --change <name> --json` 获取。不要在此内联静态路由表。
  ```

  Line 362 (inside the `content` string of `getApeVerifyCommandTemplate`): replace
  ```
  ${taskRoutingBlock}
  ```
  with
  ```
  任务类型路由：调用 `apeworkflow instructions verify --change <name> --json` 获取。不要在此内联静态路由表。
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/core/templates/workflows/verify-change.ts
  git commit -m "refactor(templates): remove hardcoded routing from verify-change.ts"
  ```

### Task 2: Remove `taskRoutingBlock` from `archive-change.ts`

**Files:**
- Modify: `src/core/templates/workflows/archive-change.ts`

- [ ] **Step 1: Delete the `taskRoutingBlock` constant**

  Delete lines 9–37 (same block content as verify-change.ts):

  ```typescript
  // 任务类型路由块，供两个模板复用
  const taskRoutingBlock = [
    '## 任务类型路由',
    '',
    '### `功能开发`',
    '- `apply`：`executing-plans -> test-driven-development -> subagent-driven-development`',
    '- `verify`：`verification-before-completion -> requesting-code-review -> receiving-code-review`',
    '- `archive`：`finishing-a-development-branch -> verification-before-completion`',
    '',
    '### `缺陷修复`',
    '- `apply`：`systematic-debugging -> test-driven-development -> executing-plans`',
    '- `verify`：`verification-before-completion -> requesting-code-review -> receiving-code-review`',
    '- `archive`：`finishing-a-development-branch -> verification-before-completion`',
    '',
    '### `重构`',
    '- `apply`：`executing-plans -> test-driven-development -> subagent-driven-development`',
    '- `verify`：`verification-before-completion -> requesting-code-review -> receiving-code-review`',
    '- `archive`：`finishing-a-development-branch -> verification-before-completion`',
    '',
    '### `文档`',
    '- `apply`：`writing-skills`',
    '- `verify`：`verification-before-completion`',
    '- `archive`：`finishing-a-development-branch -> verification-before-completion`',
    '',
    '### 统一规则',
    '- `apply` 阶段按任务类型选择执行顺序',
    '- `verify` 阶段先提供验证证据，再进入 review',
    '- `archive` 阶段先收尾，再确认归档',
  ].join('\n');
  ```

- [ ] **Step 2: Replace `${taskRoutingBlock}` in `getArchiveChangeSkillTemplate`**

  Line 128 (inside the `instructions` string): replace
  ```
  ${taskRoutingBlock}
  ```
  with
  ```
  任务类型路由：调用 `apeworkflow instructions archive --change <name> --json` 获取。不要在此内联静态路由表。
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/core/templates/workflows/archive-change.ts
  git commit -m "refactor(templates): remove hardcoded routing from archive-change.ts"
  ```

### Task 3: Remove Chinese routing from `.claude/commands/ape/verify.md`

**Files:**
- Modify: `.claude/commands/ape/verify.md`

- [ ] **Step 1: Replace the Chinese routing table block**

  Delete lines 153–178 (the entire `## 任务类型路由` section) and replace with a single line:

  ```markdown
  任务类型路由：调用 `apeworkflow instructions verify --change <name> --json` 获取。不要在此内联静态路由表。
  ```

  The file currently has:
  ```markdown
  ## 任务类型路由

  ### `功能开发`
  - `apply`：`executing-plans -> test-driven-development -> subagent-driven-development`
  ... (through line 178)
  ```

  After replacement, the `## Verification Heuristics` section (line ~180 in context) should follow directly.

- [ ] **Step 2: Commit**

  ```bash
  git add .claude/commands/ape/verify.md
  git commit -m "refactor(commands): remove hardcoded routing from verify.md"
  ```

### Task 4: Remove Chinese routing from `.claude/commands/ape/archive.md`

**Files:**
- Modify: `.claude/commands/ape/archive.md`

- [ ] **Step 1: Replace the Chinese routing table block**

  Delete lines 93–118 (the entire `## 任务类型路由` section) and replace with:

  ```markdown
  任务类型路由：调用 `apeworkflow instructions archive --change <name> --json` 获取。不要在此内联静态路由表。
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add .claude/commands/ape/archive.md
  git commit -m "refactor(commands): remove hardcoded routing from archive.md"
  ```

### Task 5: Build and verify

**Files:**
- Build: `npm run build`
- Verification: grep, CLI commands

- [ ] **Step 1: Run build**

  ```bash
  npm run build
  ```

  Expected: Build succeeds with no errors.

- [ ] **Step 2: Verify no Chinese routing keys in templates**

  ```bash
  grep -rn "功能开发\|缺陷修复\|重构\|文档" src/core/templates/workflows/
  ```

  Expected: No output (no Chinese routing keys remain).

  ```bash
  grep -rn "taskRoutingBlock" src/core/templates/workflows/
  ```

  Expected: No output.

- [ ] **Step 3: Verify no Chinese routing in command files**

  ```bash
  grep -n "功能开发\|缺陷修复" .claude/commands/ape/verify.md .claude/commands/ape/archive.md
  ```

  Expected: No output.

- [ ] **Step 4: Verify CLI still returns routing correctly**

  If there is an active change to test against:

  ```bash
  npx ts-node src/cli.ts instructions verify --change <test-change> --json | jq '.taskTypeRouting'
  npx ts-node src/cli.ts instructions archive --change <test-change> --json | jq '.taskTypeRouting'
  ```

  Expected: Both return valid `taskTypeRouting` objects with English keys (`feature`, `bugfix`, `refactor`, `docs`).

- [ ] **Step 5: Commit any build output if tracked**

  ```bash
  git add -A
  git commit -m "chore: build output for routing fix"
  ```

### Task 6: Validate with openspec

**Files:**
- Validate: `openspec validate fix-routing-tri-split`

- [ ] **Step 1: Run validation**

  ```bash
  openspec validate fix-routing-tri-split
  ```

  Expected: All spec requirements pass.

- [ ] **Step 2: Commit**

  ```bash
  git add -A
  git commit -m "chore: validate fix-routing-tri-split"
  ```
