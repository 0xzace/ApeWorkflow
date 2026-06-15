# Design: Methodology-Driven Workflow

## Problem Statement

### 当前状态：两张皮

当前 ApeWorkflow 有两个技能体系，但它们是孤立的：

```
┌───────────────────────────┐    ┌───────────────────────────┐
│   工作流技能 (11 个)       │    │   全局技能 (14 个)         │
│                           │    │                           │
│  /ape:apply               │    │  /ape:TDD (方法论)         │
│  /ape:archive             │    │  /ape:debugging (方法论)   │
│  /ape:verify              │    │  /ape:code-review (方法论) │
│  ...                      │    │  ...                      │
│                           │    │                           │
│  职责：流程编排             │    │  职责：执行质量            │
│  知道做什么                │    │  知道怎么做                │
│  不知道怎么做              │    │  不知道下一步                │
│  不管质量                  │    │  不管进度                  │
└───────────────────────────┘    └───────────────────────────┘
         │                                │
         └─────── 两张皮，无连接 ──────────┘
```

### apply 的实际行为

查看 `src/core/templates/workflows/apply-change.ts`，对"怎么写代码"的全部指导只有：

```
Make the code changes required.
Keep changes minimal and focused.
```

一个 task loop：

```
读取 tasks.md → 遍历 checkbox → 写代码 (AI 自由发挥) → 标记完成 → 下一个
```

**没有方法论约束、没有质量保障、没有验证要求。**

### 方法论技能的现状

方法论技能（TDD、debugging、code-review 等）之间互相引用：

```
systematic-debugging  ──▶── test-driven-development
                   ──▶── verification-before-completion

executing-plans     ──▶── writing-plans
                   ──▶── finishing-a-development-branch
                   ──▶── subagent-driven-development
                   ──▶── using-git-worktrees

requesting-code-review ──▶── subagent-driven-development
```

但 **没有一个方法论技能引用工作流生命周期**：

- 零引用 `tasks.md`
- 零引用 `/ape:apply`、`/ape:archive`、`/ape:verify`
- 零引用 `change`、`.apeworkflow.yaml`
- 完成后没有 handoff 指令

方法论技能完成自己的对话后，AI "自由发挥"。

### 核心问题

```
1. apply 只管任务列表，不管实现质量
2. 方法论技能只管战术，不跟踪进度
3. 两者之间没有状态传递（谁完成了、做到哪了、下一步是什么）
4. 用户需要手动决定调用哪个方法论，容易跳过关键步骤
```

---

## Goals

| 目标 | 说明 |
|------|------|
| 方法论内嵌到工作流 | `/ape:apply` 自动编排方法论，用户无需手动调用 |
| 方法论知道自己属于工作流 | 每个方法论技能知道前后步骤，完成后自动 handoff |
| 方法论技能成为一等公民 | 拥有 `/ape:*` 命令行，参与 profile 管理 |
| 保持方法论完整性 | 方法论技能不拆解为子步骤，保持完整的对话框架 |
| 向后兼容 | 现有 11 个工作流技能不受影响，用户可以继续单独调用方法论技能 |

## Non-Goals

| 排除项 | 原因 |
|--------|------|
| 拆方法论为子步骤 | 方法论是完整对话框架，不是函数 |
| 重构 artifact-graph 引擎 | 不在本次重构范围内 |
| 修改 schema 定义 | artifact 结构不变 |
| 方法论技能按 profile 过滤 | 方法论技能将始终存在（但拥有 workflowId） |
| 自动检测任务类型用 ML/NLP | 用结构化 metadata 代替 |

---

## Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     三层架构                                     │
│                                                                 │
│  Layer 3: 编排层 (Orchestration)                                 │
│  ─────────────────────────────────                               │
│  改写 apply-change.ts 的指令                                      │
│  apply 成为"方法论编排器"                                          │
│  每轮 task 循环：选择方法论 → 注入指令 → 执行 → 验证 → handoff    │
│                                                                 │
│  Layer 2: 指令层 (Instruction)                                   │
│  ─────────────────────────────────                               │
│  每个方法论技能的 instructions 增加 handoff 段落                    │
│  明确说明：何时开始、何时结束、完成后做什么                           │
│  建立方法论 ↔ 工作流的对话契约                                      │
│                                                                 │
│  Layer 1: 代码层 (Code)                                          │
│  ─────────────────────────────────                               │
│  14 个全局技能 → 工作流技能                                        │
│  加 workflowId、CLI 命令、profile 管理                             │
│  改 4-5 个文件的少量代码                                           │
│                                                                 │
│  三层是递进依赖的：                                               │
│  代码层是基础 → 指令层是桥梁 → 编排层是目标                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Code — 方法论技能变成工作流技能

### 改动概览

每个方法论技能需要从 5 个地方注册一次 `workflowId`。14 个技能 × 5 处 = 70 处小改动。

### 具体改动

#### 1. `src/core/profiles.ts`

```typescript
export const ALL_WORKFLOWS = [
  // 现有 11 个工作流（不变）
  'propose', 'explore', 'new', 'continue', 'apply',
  'ff', 'sync', 'archive', 'bulk-archive', 'verify', 'onboard',
  // 新增 14 个方法论（从 ALL_GLOBAL_SKILLS 移入）
  'test-driven-development',
  'systematic-debugging',
  'verification-before-completion',
  'requesting-code-review',
  'receiving-code-review',
  'writing-plans',
  'executing-plans',
  'using-git-worktrees',
  'finishing-a-development-branch',
  'subagent-driven-development',
  'using-skills',           // 原 using-superpowers
  'dispatching-parallel-agents',
  'brainstorming',
  'writing-skills',
] as const;

// ALL_GLOBAL_SKILLS 保留为空或逐步移除
export const ALL_GLOBAL_SKILLS = [] as const;
```

#### 2. `src/core/shared/tool-detection.ts`

```typescript
// 从 WORKFLOW_SKILL_NAMES 移到 GLOBAL_SKILL_NAMES → 合并
export const WORKFLOW_SKILL_NAMES = [
  // 现有 11 个（不变）
  'apeworkflow-explore',
  ...
  // 新增 14 个
  'apeworkflow-test-driven-development',
  'apeworkflow-systematic-debugging',
  // ... 等
] as const;

export const WORKFLOW_COMMAND_IDS = [
  // 现有 11 个（不变）
  'explore',
  ...
  // 新增 14 个
  'test-driven-development',
  'systematic-debugging',
  // ... 等
] as const;

// GLOBAL_SKILL_NAMES 和 GLOBAL_COMMAND_IDS 可以保留为空或移除
// SKILL_NAMES 和 COMMAND_IDS 自动包含所有（因为 WORKFLOW_* 已包含全部）
```

#### 3. `src/core/shared/skill-generation.ts`

```typescript
// 从 globalEntries 移到 workflowEntries，加 workflowId
const workflowEntries: SkillTemplateEntry[] = [
  // 现有 11 个（不变）
  { template: getApplyChangeSkillTemplate(), dirName: 'apeworkflow-apply-change', workflowId: 'apply' },
  ...
  // 新增 14 个
  { template: getTestDrivenDevelopmentSkillTemplate(), dirName: 'apeworkflow-test-driven-development', workflowId: 'test-driven-development' },
  { template: getSystematicDebuggingSkillTemplate(), dirName: 'apeworkflow-systematic-debugging', workflowId: 'systematic-debugging' },
  // ... 等
];

const globalEntries: SkillTemplateEntry[] = []; // 空
```

#### 4. `src/core/templates/skill-templates.ts`

无需改动。所有 14 个方法论技能的 export 已存在。

#### 5. `WorkflowId` 类型

```typescript
// 自动扩展，因为 ALL_WORKFLOWS 变了
export type WorkflowId = (typeof ALL_WORKFLOWS)[number];
```

### 代码层改动总结

| 文件 | 改动量 | 风险 |
|------|--------|------|
| `profiles.ts` | +14 行 | 低 |
| `tool-detection.ts` | +14 行（SKILL_NAMES + COMMAND_IDS）| 低 |
| `skill-generation.ts` | +14 行（workflowEntries）| 低 |
| `skill-templates.ts` | 无 | 无 |
| **合计** | ~42 行代码改动 | **低风险** |

---

## Layer 2: Instruction — Handoff 契约

### 问题

当前方法论技能是"对话孤岛"：

```
调用 /ape:TDD:
  → RED → GREEN → REFACTOR → ... → 完成
  → "TDD 完成"
  → AI 自由发挥 ← 问题在这里
  
调用 /ape:debugging:
  → Phase 1 → Phase 2 → Phase 3 → 完成
  → "Debugging 完成"
  → AI 自由发挥 ← 问题在这里
```

### 解决方案：Handoff 段落

在每个方法论技能的 instructions 末尾，增加一个统一格式的 handoff 段落：

```markdown
## Handoff — 回到工作流

这个方法论技能是 ApeWorkflow 方法论流水线的一部分。

**完成后，执行以下 handoff：**

1. 如果这是通过 `/ape:apply` 调用的：
   - 更新 `tasks.md` 中对应任务的 checkbox 为 `- [x]`
   - 显示：`"✓ 任务完成，方法：<TDD/debugging/...>"`

2. 如果没有 `/ape:apply` 在运行：
   - 建议用户运行 `/ape:apply` 继续下一个任务
   - 或建议下一步方法论（见下方推荐）

**推荐后续方法论（根据任务类型）：**
- 功能实现 → verification-before-completion
- Bug 修复 → verification-before-completion → requesting-code-review
- 重构 → verification-before-completion → requesting-code-review

**不要自行决定跳过或合并方法论步骤。**
```

### 各方法论技能的 Handoff 差异

不同方法论技能对 handoff 的需求不同：

| 方法论技能 | Handoff 目标 | 推荐后续 |
|-----------|-------------|---------|
| `test-driven-development` | 打勾 tasks.md | `verification-before-completion` |
| `systematic-debugging` | 打勾 tasks.md + 记录 root cause | `verification-before-completion` |
| `verification-before-completion` | 打勾 tasks.md | `requesting-code-review` (如需要) |
| `requesting-code-review` | 记录 review 结果 | `verification-before-completion` (fix 后) |
| `writing-plans` | 保存 plan 文件 | `executing-plans` 或 `/ape:apply` |
| `executing-plans` | 更新任务状态 | `finishing-a-development-branch` |
| `using-git-worktrees` | 创建/确认分支 | 返回调用者 |
| `finishing-a-development-branch` | 合并分支 | `/ape:apply` 继续下一个 |
| `subagent-driven-development` | 子任务状态更新 | `executing-plans` |
| `using-skills` | — (工具技能，无 handoff) | — |
| `brainstorming` | 保存讨论结果 | `/ape:continue` 或 `/ape:propose` |
| `dispatching-parallel-agents` | 状态汇总 | 返回调用者 |
| `writing-skills` | — (工具技能，无 handoff) | — |
| `receiving-code-review` | 记录 review 结果 | `test-driven-development` (fix 后) |

### 指令层改动总结

| 技能 | 改动量 | 类型 |
|------|--------|------|
| 14 个方法论技能 | 每个 +10~20 行 | 内容追加 |
| **合计** | ~200 行 Markdown 追加 | **无代码风险** |

---

## Layer 3: Orchestration — 方法论感知的 apply

### 当前 apply 的 task loop

```
for each pending task in tasks.md:
  显示任务描述
  "Make the code changes required."    ← 关键问题：太抽象
  写代码
  标记完成
```

### 新 apply 的 methodology-aware task loop

```
for each pending task in tasks.md:
  1. 分析任务内容 → 判断类型
  2. 选择方法论策略
  3. 显示方法论选择：
     "Task 3/7: 实现注册 API
      Recommended approach: TDD (red-green-refactor)"
  4. 注入方法论指令到当前上下文
  5. 执行实现
  6. 方法论完成后，执行 verification checkpoint
  7. 更新 tasks.md checkbox
  8. 显示进度 → 继续下一个

可选：用户中途可以手动切换方法论
  "I'd like to skip TDD for this one"
  "Let me use subagent-driven-development instead"
```

### 任务类型判断

不依赖 NLP，用**关键词启发式**（简单但有效）：

| 类型 | 关键词 | 推荐方法论 |
|------|--------|-----------|
| 功能实现 | "实现", "add", "create", "build", "implement" | `test-driven-development` |
| Bug 修复 | "修复", "fix", "bug", "error", "crash", "null" | `systematic-debugging` |
| 重构 | "重构", "refactor", "cleanup", "restructure" | `verification-before-completion` |
| 代码审查 | "review", "审查", "代码评审" | `requesting-code-review` |
| 复杂任务 | "subagent", "parallel", "多步骤" | `subagent-driven-development` |
| 简单任务 | "update", "add comment", "typo" | 无方法论（直接做） |
| 计划相关 | "plan", "规划", "design" | `writing-plans` |

### 方法论注入机制

方法论指令不复制粘贴，而是**引用已加载的技能**：

```
apply-change.ts instructions 中新增:

Step N: Choose methodology for this task

  Analyze the task description to determine the implementation strategy:

  | Task Type | Recommended Skill |
  |-----------|-------------------|
  | Feature implementation | apeworkflow-test-driven-development |
  | Bug fix | apeworkflow-systematic-debugging |
  | Refactoring | apeworkflow-verification-before-completion |
  | Code review | apeworkflow-requesting-code-review |
  | Complex/multi-step | apeworkflow-subagent-driven-development |
  | Simple/ trivial | None (implement directly) |

  If a methodology skill is recommended:
    1. Announce: "I'm using [skill-name] for this task."
    2. Follow the full methodology instructions
    3. When complete, update the task checkbox and proceed

  If no methodology is needed:
    1. Implement the task directly
    2. Keep changes minimal
    3. Update the task checkbox
```

**关键点**：AI 已经通过 skill 系统加载了所有方法论技能的内容。apply 的指令只需要"建议"和"契约"，不需要复制方法论的具体步骤。

### 验证检查点

在每个方法论完成后，verify 检查点：

```
Methodology checkpoint (after each task):

  ✓ Checkbox updated in tasks.md
  ✓ Code compiles (if applicable)
  ✓ No obvious regressions
  ✓ Task matches spec/design requirements

  If checkpoint fails:
    → Pause and report
    → Suggest artifact update
    → Do NOT force-advance
```

### 编排层改动总结

| 文件 | 改动量 | 风险 |
|------|--------|------|
| `apply-change.ts` | +~80 行（新指令） | 中 |
| `verify-change.ts` | 微调（理解 methodology 上下文） | 低 |

---

## Complete Architecture

### 完整的数据流

```
用户: /ape:apply "add-user-auth"
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    apply-change.ts (重构版)                   │
│                                                             │
│  1. 选择变更                                                │
│  2. 查状态 → 获取 contextFiles (proposal, specs, design, tasks) │
│  3. 读取 contextFiles                                       │
│  4. Show progress: "N/M tasks complete"                     │
│                                                             │
│  ┌─── 任务循环 ───────────────────────────────────────┐     │
│  │                                                    │     │
│  │  for each pending task:                            │     │
│  │    ├─ 1. 分析任务内容                               │     │
│  │    ├─ 2. 判断类型 → 推荐方法论                      │     │
│  │    ├─ 3. 注入方法论指令 (AI 已有技能内容)            │     │
│  │    ├─ 4. 执行实现                                    │     │
│  │    ├─ 5. Methodology handoff (打勾 + 推荐后续)      │     │
│  │    └─ 6. Verify checkpoint                          │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  5. 完成/暂停 → 显示进度                                     │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    方法论技能 (已注册为工作流技能)              │
│                                                             │
│  /ape:test-driven-development                               │
│  /ape:systematic-debugging                                  │
│  /ape:verification-before-completion                        │
│  ...                                                        │
│                                                             │
│  每个技能:                                                   │
│  - 有独立的 /ape:* 命令（用户可单独调用）                     │
│  - 有 workflowId（代码层）                                   │
│  - 有 handoff 段落（指令层）                                 │
│  - 知道自己是工作流的一部分                                   │
└─────────────────────────────────────────────────────────────┘
```

### 方法论流水线状态机

```
                    ┌──────────────┐
                    │  任务选择      │
                    └──────┬───────┘
                           │
              ┌────────────▼────────────┐
              │   任务类型判断            │
              │                         │
              │  新功能 → TDD           │
              │  Bug  → Debugging       │
              │  重构 → Verification    │
              │  简单 → 直接做           │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │   方法论执行              │
              │   (AI 按方法论指令执行)    │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │   Handoff               │
              │   - 打勾 tasks.md       │
              │   - 推荐后续方法论        │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │   Verify Checkpoint     │
              │   - 编译通过？           │
              │   - 无回归？             │
              │   - 符合 spec？          │
              └────┬────────────┬───────┘
              Pass │             │ Fail
                   │             │
              ┌────▼────┐  ┌────▼──────────┐
              │ 下一个   │  │ 暂停 + 报告   │
              │ 任务     │  │ 建议 artifact │
              └────┬────┘  │ 更新           │
                   │       └───────────────┘
              ┌────▼────┐
              │ 所有任务 │
              │ 完成？   │
              └─┬───┬───┘
             Yes │   │ No
                 │   │
        ┌────────▼───▼─────────┐
        │ 建议 archive          │
        └──────────────────────┘
```

---

## File Changes Summary

### 新增文件

无。

### 修改文件

| 文件 | 改动 | 改动量 |
|------|------|--------|
| `src/core/profiles.ts` | ALL_WORKFLOWS +14 项 | +14 行 |
| `src/core/shared/tool-detection.ts` | WORKFLOW_SKILL_NAMES +14 项, WORKFLOW_COMMAND_IDS +14 项 | +28 行 |
| `src/core/shared/skill-generation.ts` | workflowEntries +14 项 | +14 行 |
| `src/core/templates/workflows/apply-change.ts` | 重写 task loop 指令 | +~80 行 |
| 14 个方法论技能 .ts 文件 | 追加 handoff 段落 | ~200 行 |
| **合计** | | **~336 行改动** |

### 不变的文件

| 文件 | 原因 |
|------|------|
| `src/core/shared/index.ts` | 导出已存在 |
| `src/core/templates/skill-templates.ts` | export 已存在 |
| `src/core/workspace/skills.ts` | isWorkflowEntry 过滤已正确工作 |
| `src/core/init.ts` | 无变化 |
| `src/core/profile-sync-drift.ts` | 无变化 |
| `ALL_WORKFLOWS` 中的现有 11 个 | 保持不变 |
| `WORKFLOW_TO_SKILL_DIR` | 不变（方法论技能不需要 workflow 映射） |
| Schema 定义 | 不变 |

### 关于 WORKFLOW_TO_SKILL_DIR

方法论技能**不需要** `WORKFLOW_TO_SKILL_DIR` 映射，因为它们没有对应的 workflow 概念。

这引出一个设计决策：方法论技能的 `workflowId` 应该是什么语义？

```
方案 A: workflowId = 方法论名称本身
  workflowId: 'test-driven-development'
  → 可以出现在 profile 中，但不在 WORKFLOW_TO_SKILL_DIR 中
  → profile 切换时保留（始终存在）
  → 但代码层需要处理 workflowId 不在 WORKFLOW_TO_SKILL_DIR 的情况

方案 B: 方法论技能的 workflowId 标记为特殊值
  workflowId: 'methodology:test-driven-development'
  → 明确标记为"非工作流"的 workflowId
  → 但类型上不符合 WorkflowId 字面量
```

**推荐方案 A 的变体：方法论技能不在 profile 控制范围内。**

```typescript
// profiles.ts
export const ALL_WORKFLOWS = [
  // ... 11 个传统工作流 ...
  // 方法论技能：加特殊前缀或独立列表
] as const;

// 方法论技能不参与 profile 切换
// getProfileWorkflows() 只返回工作流技能
// 但方法论技能有 workflowId，可以被单独列出
```

**更准确的做法**：方法论技能有 `workflowId`（为了 skill-generation 统一处理），但 `getProfileWorkflows()` 只返回 `CORE_WORKFLOWS` 或 `customWorkflows`，不包含方法论技能。

这样：
- 方法论技能始终存在（不受 profile 切换影响）
- 拥有独立的 `/ape:*` 命令
- 可以被用户单独调用
- apply 编排时使用 `workflowId` 匹配

---

## Risks and Tradeoffs

### 风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| 任务类型判断不准确 | 推荐错误的方法论 | 用户可随时手动切换；关键词启发式只是建议 |
| 方法论指令过长 | 上下文窗口压力 | 方法论技能内容不复制到 apply 指令中，AI 已有技能内容 |
| 方法论之间的状态传递 | 一个方法论的输出另一个读不到 | 通过 tasks.md 和 contextFiles 传递状态 |
| 用户困惑 | 不知道方法论何时被自动调用 | apply 明确announce："I'm using [methodology] for this task" |
| 方法论技能的 handoff 段落被忽略 | AI 不打勾 tasks.md | 在 apply 指令中加入验证检查点 |

### 权衡

| 选择 | 优点 | 缺点 |
|------|------|------|
| apply 自动调用方法论 | 用户不用手动调 | AI 可能跳过 handoff |
| apply 只建议方法论 | 用户可控 | 用户可能不知道有方法论可用 |
| 推荐方案：建议 + 默认执行 | 平衡两者 | 需要用户主动干预的能力 |

---

## Implementation Phases

### Phase 1: 代码层（低风险，独立验证）

- [ ] 改 `profiles.ts` +14 项
- [ ] 改 `tool-detection.ts` +28 项
- [ ] 改 `skill-generation.ts` +14 项
- [ ] `pnpm run build` 验证编译通过
- [ ] `pnpm test` 验证现有测试通过

### Phase 2: 指令层（无代码风险，可独立验证）

- [ ] 14 个方法论技能追加 handoff 段落
- [ ] 手动验证 handoff 内容正确性
- [ ] 确认无残留 superpowers 引用（来自 superpowers-skills-merge change）

### Phase 3: 编排层（高风险，需要手动测试）

- [ ] 重写 `apply-change.ts` 指令
- [ ] 手动测试 `/ape:apply` + TDD 场景
- [ ] 手动测试 `/ape:apply` + debugging 场景
- [ ] 验证 handoff 执行

### Phase 4: 集成测试

- [ ] `apeworkflow update` 验证全部 25 个技能
- [ ] `apeworkflow config profile` 验证 profile 行为正确
- [ ] 端到端测试：propose → apply → verify → archive

---

## Open Questions

1. **方法论技能是否应该出现在 `apeworkflow config profile` 列表中？**
   - 建议：不出现。始终存在，不受 profile 控制。

2. **任务类型判断的准确率达到多少才值得自动调用？**
   - 建议：关键词启发式足够（功能实现/bug 修复是最常见的两种类型）。
   - 简单任务可以直接做，不需要方法论。

3. **用户中途想切换方法论怎么办？**
   - 在 apply 的 task loop 中，允许用户随时说 "用 TDD"、"跳过这个"。
   - apply 指令中明确： "如果用户要求切换方法论，遵循用户指令。"

4. **方法论技能的 workflowId 类型是否应该扩展到 `WorkflowId`？**
   - 需要。`ALL_WORKFLOWS` 变长后，`WorkflowId` 类型自动扩展。
   - 但 `getProfileWorkflows()` 需要过滤掉方法论技能。

5. **`WORKFLOW_SKILL_NAMES` 和 `GLOBAL_SKILL_NAMES` 的关系？**
   - 方法论技能从 GLOBAL → WORKFLOW，GLOBAL 变空。
   - 但 `SKILL_NAMES = [...SKILL_NAMES]` 仍然包含全部，向后兼容。
