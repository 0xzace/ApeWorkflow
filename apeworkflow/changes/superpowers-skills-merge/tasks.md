# Tasks: Merge superpowers-5.1.0 Skills as TypeScript Templates

## Phase 1: 基础设施脚手架（编译通过，不依赖新模板文件）

**目标：** 添加所有基础设施改动，但全局技能用空数组占位。确保现有 11 个技能完全正常，`pnpm run build` 通过。

- [ ] **1.1** 在 `src/core/profiles.ts` 中新增 `ALL_GLOBAL_SKILLS` 常量（14 个字符串），保持 `ALL_WORKFLOWS`（11 个）和 `CORE_WORKFLOWS`（5 个）不变
- [ ] **1.2** 在 `src/core/shared/skill-generation.ts` 中：
  - `SkillTemplateEntry` 的 `workflowId` 改为字面量类型 `WorkflowId`（不是 `string`），变为可选 `?`
  - 新增 `allGlobalEntries: SkillTemplateEntry[] = []` 空占位数组
  - 新增 helper 函数 `isWorkflowEntry(e)` 和 `isGlobalEntry(e)`
  - 修改 `getSkillTemplates()` 返回 `workflowScoped(按筛选) + globalScoped(globalEntries)`
  - `getManagedWorkspaceSkillEntries()` 过滤 `isWorkflowEntry`（避免全局技能被误删）
- [ ] **1.3** 在 `src/core/shared/tool-detection.ts` 中：
  - 新增 `WORKFLOW_SKILL_NAMES`（11 个现有名称，与现有 `SKILL_NAMES` 相同）
  - 新增 `GLOBAL_SKILL_NAMES`（14 个字符串）
  - `SKILL_NAMES = [...WORKFLOW_SKILL_NAMES, ...GLOBAL_SKILL_NAMES]` 供外部兼容
  - `getToolSkillStatus()` 基于全量 `SKILL_NAMES` 检测（已自动生效）
- [ ] **1.4** 在 `src/core/shared/index.ts` 中导出新增常量（`WORKFLOW_SKILL_NAMES`, `GLOBAL_SKILL_NAMES` 等）
- [ ] **1.5** 确认 `src/core/init.ts` 不需要改（`WORKFLOW_TO_SKILL_DIR` 只有 11 个 key，全局技能通过 `getSkillTemplates()` 自然加入）
- [ ] **1.6** 确认 `src/core/profile-sync-drift.ts` 不需要改（`WORKFLOW_TO_SKILL_DIR` 只有 11 个 key，全局技能不参与 profile 漂移检测）
- [ ] **1.7** 运行 `pnpm run build` 确认编译通过（仍然是 11 个工作流技能 + 0 个全局技能 = 11 个，功能不变）
- [ ] **1.8** 删除 `src/core/templates/workflows/feedback.ts` 和 `skill-templates.ts` 中对应的 export
  - feedback.ts 从未接入任何管线，是孤儿代码
- [ ] **1.9** 在 `src/core/init.ts` 的 `removeSkillDirs()` 中增加 `isApeWorkflowManagedSkillDir()` 安全守卫
  - 当前 init.ts 无条件删除目录，不检查是否 ApeWorkflow 生成
  - 改为一行检查，与 skills.ts 的 removeManagedWorkflowSkillDirs() 行为一致

## Phase 2: 14 个技能转换 + 注册（并行可做的，每个技能一个 task）

**目标：** 每个技能独立转换 + 注册 export + import + globalEntries 填充。14 个技能互不依赖，可完全并行。

**转换步骤（每个技能）：**
1. 解析原始 SKILL.md 的 frontmatter（name, description）和 body（instructions）
2. 执行 superpowers → apeworkflow 替换（按维度 A-F）
3. 转义 template literal 特殊字符（`` ` `` → `` \` ``, `${` → `$\{`）
4. 生成 TS 文件（小技能 ≤200 行内联，大技能 >200 行用独立函数）
5. 注册: `skill-templates.ts` 新增 export + `skill-generation.ts` globalEntries 填充条目
6. （如有附属文件）放在 `src/core/templates/workflows/<dirName>/` 同级目录（不是 assets/）

- [ ] **2.1** `apeworkflow-brainstorming.ts` — 164 行（内联）
  - 替换：`docs/superpowers/specs/` → `apeworkflow/specs/` (2 处)
  - 替换：`elements-of-style:writing-clearly` → 删除（该技能不存在，加注释说明）
  - 替换：`skills/brainstorming/visual-companion.md` → `skills/visual-companion.md` (1 处)
  - 注册: `skill-templates.ts` export + `skill-generation.ts` globalEntries
  - 附属文件: `src/core/templates/workflows/apeworkflow-brainstorming/` → visual-companion.md, spec-document-reviewer-prompt.md, scripts/*

- [ ] **2.2** `apeworkflow-dispatching-parallel-agents.ts` — 182 行（内联）
  - 无 superpowers 直接引用，直接转换
  - 注册: `skill-templates.ts` export + `skill-generation.ts` globalEntries
  - 附属文件: 无

- [ ] **2.3** `apeworkflow-executing-plans.ts` — 70 行（内联）
  - 替换：`"Superpowers works much better with subagent support"` → `"This works much better with subagent support"` (1)
  - 替换：`superpowers:subagent-driven-development` → `apeworkflow-subagent-driven-development` (1)
  - 替换：`superpowers:finishing-a-development-branch` → `apeworkflow-finishing-a-development-branch` (1)
  - 替换：`superpowers:using-git-worktrees` → `apeworkflow-using-git-worktrees` (1)
  - 替换：`superpowers:writing-plans` → `apeworkflow-writing-plans` (1)
  - 替换：`superpowers:test-driven-development` → `apeworkflow-test-driven-development` (1)
  - 替换：`superpowers:verification-before-completion` → `apeworkflow-verification-before-completion` (1)
  - 注册: `skill-templates.ts` export + `skill-generation.ts` globalEntries
  - 附属文件: 无

- [ ] **2.4** `apeworkflow-finishing-a-development-branch.ts` — 251 行（函数式）
  - 替换：`"Superpowers created this worktree — we own cleanup"` → `"This worktree was created by the skill — clean it up"` (1)
  - 替换：`~/.config/superpowers/worktrees/` → 删除整行或改为通用描述 (2)
  - 注册: `skill-templates.ts` export + `skill-generation.ts` globalEntries
  - 附属文件: 无

- [ ] **2.5** `apeworkflow-receiving-code-review.ts` — 213 行（函数式）
  - 无 superpowers 引用，直接转换
  - 注册: `skill-templates.ts` export + `skill-generation.ts` globalEntries
  - 附属文件: 无

- [ ] **2.6** `apeworkflow-requesting-code-review.ts` — 103 行（内联）
  - 替换：`docs/superpowers/plans/<filename>.md` → `apeworkflow/changes/<name>/plans/[序号]<filename>.md` (1)
  - 替换：`requesting-code-review/code-reviewer.md` → `apeworkflow-requesting-code-review/code-reviewer.md` (1)
  - 注册: `skill-templates.ts` export + `skill-generation.ts` globalEntries
  - 附属文件: `src/core/templates/workflows/apeworkflow-requesting-code-review/code-reviewer.md`

- [ ] **2.7** `apeworkflow-subagent-driven-development.ts` — 279 行（函数式）
  - 替换：`superpowers:finishing-a-development-branch` → `apeworkflow-finishing-a-development-branch` (2, 含 dot 图)
  - 替换：`docs/superpowers/plans/` → `apeworkflow/changes/<name>/plans/[序号]/` (1)
  - 替换：`~/.config/superpowers/hooks/` → 删除（该目录不存在，加注释或直接删除整行）(1)
  - 替换：`superpowers:using-git-worktrees` → `apeworkflow-using-git-worktrees` (1)
  - 替换：`superpowers:writing-plans` → `apeworkflow-writing-plans` (1)
  - 替换：`superpowers:requesting-code-review` → `apeworkflow-requesting-code-review` (1)
  - 替换：`superpowers:test-driven-development` → `apeworkflow-test-driven-development` (1)
  - 替换：`superpowers:executing-plans` → `apeworkflow-executing-plans` (1)
  - 替换：`./implementer-prompt.md` → `apeworkflow-subagent-driven-development/implementer-prompt.md` (1)
  - 注册: `skill-templates.ts` export + `skill-generation.ts` globalEntries
  - 附属文件: `src/core/templates/workflows/apeworkflow-subagent-driven-development/implementer-prompt.md`, `spec-reviewer-prompt.md`, `code-quality-reviewer-prompt.md`

- [ ] **2.8** `apeworkflow-systematic-debugging.ts` — 296 行（函数式）
  - 替换：`superpowers:test-driven-development` → `apeworkflow-test-driven-development` (2)
  - 替换：`superpowers:verification-before-completion` → `apeworkflow-verification-before-completion` (1)
  - 注册: `skill-templates.ts` export + `skill-generation.ts` globalEntries
  - 附属文件: `src/core/templates/workflows/apeworkflow-systematic-debugging/` → 10 个文件 (*.md, *.ts, *.sh)

- [ ] **2.9** `apeworkflow-test-driven-development.ts` — 371 行（函数式）
  - 无 superpowers 引用，直接转换
  - 注册: `skill-templates.ts` export + `skill-generation.ts` globalEntries
  - 附属文件: `src/core/templates/workflows/apeworkflow-test-driven-development/testing-anti-patterns.md`

- [ ] **2.10** `apeworkflow-using-git-worktrees.ts` — 215 行（函数式）
  - 替换：`~/.config/superpowers/worktrees/` → 删除或注释 (2)
  - 替换：第三条 `~/.config/superpowers/worktrees/` 引用 → 删除或注释 (1)
  - 注册: `skill-templates.ts` export + `skill-generation.ts` globalEntries
  - 附属文件: 无

- [ ] **2.11** `apeworkflow-using-skills.ts` — 117 行（内联，原名 using-superpowers）
  - 替换：`name: using-superpowers` → `name: apeworkflow-using-skills`（frontmatter 中的 name）
  - 替换：`~/.config/superpowers/` → 去掉或替换 (引用)
  - 替换：`using-superpowers:` → `apeworkflow-using-skills:` (技能引用)
  - 注册: `skill-templates.ts` export + `skill-generation.ts` globalEntries
  - 附属文件: `src/core/templates/workflows/apeworkflow-using-skills/references/copilot-tools.md`, `codex-tools.md`, `gemini-tools.md`

- [ ] **2.12** `apeworkflow-verification-before-completion.ts` — 139 行（内联）
  - 无 superpowers 引用，直接转换
  - 注册: `skill-templates.ts` export + `skill-generation.ts` globalEntries
  - 附属文件: 无

- [ ] **2.13** `apeworkflow-writing-plans.ts` — 152 行（内联）
  - 替换：`superpowers:using-git-worktrees` → `apeworkflow-using-git-worktrees` (1)
  - 替换：`docs/superpowers/plans/` → `apeworkflow/changes/<name>/plans/[序号]/` (3)
  - 替换：`superpowers:subagent-driven-development` → `apeworkflow-subagent-driven-development` (2)
  - 替换：`superpowers:executing-plans` → `apeworkflow-executing-plans` (1)
  - 补充：写入计划文件时应自动创建 `apeworkflow/changes/<name>/plans/` 目录（如不存在）
  - 注册: `skill-templates.ts` export + `skill-generation.ts` globalEntries
  - 附属文件: `src/core/templates/workflows/apeworkflow-writing-plans/plan-document-reviewer-prompt.md`

- [ ] **2.14** `apeworkflow-writing-skills.ts` — 655 行（函数式）
  - 替换：`superpowers:test-driven-development` → `apeworkflow-test-driven-development` (2)
  - 替换：`superpowers:systematic-debugging` → `apeworkflow-systematic-debugging` (1)
  - 注册: `skill-templates.ts` export + `skill-generation.ts` globalEntries
  - 附属文件: `src/core/templates/workflows/apeworkflow-writing-skills/anthropic-best-practices.md`, `examples/`, `graphviz-conventions.dot`, `persuasion-principles.md`, `render-graphs.js`, `testing-skills-with-subagents.md`

## Phase 3: 附属文件同目录复制 + 管线联调

**目标：** 处理 31 个附属文件复制逻辑，确保 `removeManagedWorkflowSkillDirs` 不碰全局技能。

- [ ] **3.1** 修改 `src/core/workspace/skills.ts` 的 `generateWorkspaceAgentSkills()` / `updateWorkspaceAgentSkills()` 中的复制逻辑
  - 不再新增 `copyAttachedFiles()` 函数
  - 生成 SKILL.md 后，用 `cp -r {workflowsDir}/{dirName}/* {skillsDir}/{dirName}/`（排除 .ts 模板文件）
  - 或：遍历源目录，复制所有非 .ts 文件到目标技能目录
- [ ] **3.2** 确认 `removeManagedWorkflowSkillDirs()` 只清理工作流技能（全局技能不应被 profile 切换清理）
  - 验证 `getManagedWorkspaceSkillEntries()` 已过滤 `isWorkflowEntry`
  - 验证 `updateWorkspaceAgentSkills()` 的 cleanup 路径不影响全局技能目录
- [ ] **3.3** 确认 `init.ts` 中 `removeSkillDirs()` 已有 `isApeWorkflowManagedSkillDir()` 安全守卫（任务 1.9）

## Phase 4: 测试验证（合并原 Phase 4 + Phase 5）

- [ ] **4.1** 运行 `pnpm run build` 确认 TS 编译通过
- [ ] **4.2** 运行 `pnpm test` 确认现有测试通过
  - 特别关注 `test/core/shared/skill-generation.test.ts` 和 `test/core/shared/tool-detection.test.ts`
  - `skill-generation.test.ts:11` 期望 `getSkillTemplates()` 返回 11 个 → 需更新为 25 个
  - `skill-generation.test.ts:48` 验证 `workflowId` 存在 → 全局技能无 workflowId，需调整
  - `tool-detection.test.ts:31` 期望 `SKILL_NAMES` 长度 11 → 需更新为 25
  - `tool-detection.test.ts:83-92` 用 `SKILL_NAMES.length` 验证 → 自动适应新长度
- [ ] **4.3** 手动测试 `apeworkflow update` — 验证 `.claude/skills/` 中包含全部 25 个技能（全带 apeworkflow- 前缀）
- [ ] **4.4** 验证每个技能的 SKILL.md frontmatter 中 name 带 `apeworkflow-` 前缀
- [ ] **4.5** 验证技能内容中无残留 superpowers 引用：`grep -r "superpowers" src/core/templates/workflows/apeworkflow-*.ts | wc -l` 应为 0
- [ ] **4.6** 验证附属文件正确复制到对应技能目录
- [ ] **4.7** 验证 `apeworkflow config profile` 命令只显示 11 个工作流技能
- [ ] **4.8** 更新 `docs/customization.md` 添加完整 25 个技能列表
- [ ] **4.9** 在 CHANGELOG.md 添加变更说明
