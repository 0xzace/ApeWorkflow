# Tasks: Methodology-Driven Workflow

## Phase 1: 代码层 — 方法论技能变成工作流技能

**目标：** 14 个全局技能获得 workflowId，编译通过，功能不变。

- [ ] **1.1** 修改 `src/core/profiles.ts`
  - `ALL_WORKFLOWS` 新增 14 项方法论技能 ID
  - 保持 `CORE_WORKFLOWS` 和 `ALL_GLOBAL_SKILLS` 不变（或 `ALL_GLOBAL_SKILLS` 清空）
  - 新增 14 项：`test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review`, `receiving-code-review`, `writing-plans`, `executing-plans`, `using-git-worktrees`, `finishing-a-development-branch`, `subagent-driven-development`, `using-skills`, `dispatching-parallel-agents`, `brainstorming`, `writing-skills`

- [ ] **1.2** 修改 `src/core/shared/tool-detection.ts`
  - `WORKFLOW_SKILL_NAMES` 新增 14 项（对应 14 个方法论技能 dirName）
  - `WORKFLOW_COMMAND_IDS` 新增 14 项
  - `SKILL_NAMES` 和 `COMMAND_IDS` 自动扩展（因为是 spread）

- [ ] **1.3** 修改 `src/core/shared/skill-generation.ts`
  - `workflowEntries` 新增 14 项（从 `globalEntries` 移入，加 `workflowId`）
  - `globalEntries` 清空（或保留 feedback 如有）
  - `getSkillTemplates()` 逻辑不变（globalEntries 已空，filter 行为不变）

- [ ] **1.4** 修改 `src/core/shared/index.ts`
  - 确认导出不变（所有类型已导出）

- [ ] **1.5** 运行 `pnpm run build` 验证编译通过

- [ ] **1.6** 运行 `pnpm test` 验证现有测试通过
  - `skill-generation.test.ts` 可能需要更新（25 个技能 vs 11 个）
  - `tool-detection.test.ts` 可能需要更新（SKILL_NAMES.length = 25）

## Phase 2: 指令层 — Handoff 契约

**目标：** 每个方法论技能知道自己是工作流的一部分，完成后有 handoff 指令。

- [ ] **2.1** 修改 `apeworkflow-test-driven-development.ts`
  - 末尾追加 handoff 段落：完成后更新 tasks.md checkbox，推荐 verification-before-completion

- [ ] **2.2** 修改 `apeworkflow-systematic-debugging.ts`
  - 末尾追加 handoff 段落：完成后更新 tasks.md checkbox，记录 root cause，推荐 verification-before-completion

- [ ] **2.3** 修改 `apeworkflow-verification-before-completion.ts`
  - 末尾追加 handoff 段落：完成后推荐 requesting-code-review（如需要）

- [ ] **2.4** 修改 `apeworkflow-requesting-code-review.ts`
  - 末尾追加 handoff 段落：记录 review 结果，推荐 verification-before-completion（fix 后）

- [ ] **2.5** 修改 `apeworkflow-writing-plans.ts`
  - 末尾追加 handoff 段落：保存 plan 后推荐 executing-plans 或 /ape:apply

- [ ] **2.6** 修改 `apeworkflow-executing-plans.ts`
  - 末尾追加 handoff 段落：任务完成后推荐 finishing-a-development-branch

- [ ] **2.7** 修改 `apeworkflow-using-git-worktrees.ts`
  - 末尾追加 handoff 段落：分支创建/确认后返回调用者

- [ ] **2.8** 修改 `apeworkflow-finishing-a-development-branch.ts`
  - 末尾追加 handoff 段落：合并后推荐 /ape:apply 继续下一个任务

- [ ] **2.9** 修改 `apeworkflow-subagent-driven-development.ts`
  - 末尾追加 handoff 段落：子任务完成后推荐 executing-plans

- [ ] **2.10** 修改 `apeworkflow-using-skills.ts`
  - 作为工具技能，不需要 handoff（或简单说明自己是技能发现工具）

- [ ] **2.11** 修改 `apeworkflow-brainstorming.ts`
  - 末尾追加 handoff 段落：讨论结果保存后推荐 /ape:continue 或 /ape:propose

- [ ] **2.12** 修改 `apeworkflow-dispatching-parallel-agents.ts`
  - 作为工具技能，不需要手 off（或简单说明自己是并行调度工具）

- [ ] **2.13** 修改 `apeworkflow-writing-skills.ts`
  - 作为工具技能，不需要 handoff

- [ ] **2.14** 修改 `apeworkflow-receiving-code-review.ts`
  - 末尾追加 handoff 段落：记录 review 结果，推荐 test-driven-development（fix 后）

- [ ] **2.15** 运行 `pnpm run build` 验证编译通过

## Phase 3: 编排层 — 方法论感知的 apply

**目标：** `apply-change.ts` 重写 task loop 指令，使其成为方法论编排器。

- [ ] **3.1** 重写 `apply-change.ts` 的 Step 6（Implement tasks loop）
  - 新增任务类型判断（关键词启发式）
  - 新增方法论推荐表
  - 新增方法论注入指令（announce + 遵循方法论 + handoff）
  - 新增 verify checkpoint

- [ ] **3.2** 更新 `apply-change.ts` 的 Guardrails
  - 添加方法论相关规则（不跳过 methodology、用户可切换、handoff 必须执行）

- [ ] **3.3** 更新 `apply-change.ts` 的 Fluid Workflow Integration 段落
  - 说明方法论自动编排 + 用户手动干预的平衡

- [ ] **3.4** 更新 CommandTemplate 中的指令（与 SkillTemplate 保持一致）

## Phase 4: 集成测试

- [ ] **4.1** 运行 `pnpm run build` 确认编译通过

- [ ] **4.2** 运行 `pnpm test` 确认所有测试通过

- [ ] **4.3** 手动测试 `apeworkflow update` — 验证 25 个技能都生成

- [ ] **4.4** 手动测试 `/ape:apply` 场景：
  - 新功能 → 自动选择 TDD
  - Bug 修复 → 自动选择 debugging
  - 简单任务 → 直接实现

- [ ] **4.5** 验证 handoff 执行：
  - tasks.md checkbox 正确更新
  - 推荐后续方法论正确

- [ ] **4.6** 验证 `/ape:TDD` 等独立命令仍可单独调用

- [ ] **4.7** 验证 `apeworkflow config profile` 不显示方法论技能

- [ ] **4.8** 验证 `apeworkflow list` 显示全部技能状态
