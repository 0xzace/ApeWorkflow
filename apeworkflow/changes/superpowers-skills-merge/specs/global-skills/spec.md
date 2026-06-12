---
id: global-skills
description: 方法论技能作为全局技能独立于工作流分发，不影响 ALL_WORKFLOWS 和 profile 机制
---

# Spec: 全局技能（Global Skills）独立分发

## 背景

ApeWorkflow 现有技能管线是**工作流驱动**的：一个技能 = 一个工作流 = 一个命令行。
`getSkillTemplates(profileIds)` 返回的技能受 profile 筛选。

superpowers-5.1.0 的 14 个方法论技能（brainstorming, TDD, systematic-debugging 等）没有命令行，也不受 profile 控制。它们应该始终存在，不受用户选择的 workflow 影响。

强行将这些技能加入 `ALL_WORKFLOWS` 会导致：
- `config profile` 命令展示膨胀（25 个工作流）
- profile 切换时方法论技能被误删
- 语义混乱：方法论技能不是工作流

## 目标

1. 方法论技能作为独立的"全局技能"通道存在
2. 不影响现有 `ALL_WORKFLOWS`、`CORE_WORKFLOWS`、`WORKFLOW_TO_SKILL_DIR`
3. `getSkillTemplates()` 始终返回 25 个技能（11 个工作流按筛选 + 14 个全局无条件）
4. `apeworkflow update` / `workspace update` 生成全部 25 个技能文件
5. `apeworkflow config profile` 只显示 11 个工作流技能

## 验收标准

### AC1: 常量定义
- [ ] `ALL_WORKFLOWS` 保持 11 个字符串不变
- [ ] `CORE_WORKFLOWS` 保持 5 个字符串不变
- [ ] 新增 `ALL_GLOBAL_SKILLS` 包含 14 个字符串：
  `['brainstorming', 'dispatching-parallel-agents', 'executing-plans', 'finishing-a-development-branch', 'receiving-code-review', 'requesting-code-review', 'subagent-driven-development', 'systematic-debugging', 'test-driven-development', 'using-git-worktrees', 'using-skills', 'verification-before-completion', 'writing-plans', 'writing-skills']`
- [ ] `WORKFLOW_TO_SKILL_DIR`（init.ts + profile-sync-drift.ts）保持 11 个 key 不变
- [ ] 新增 `WORKFLOW_SKILL_NAMES`（11 个）和 `GLOBAL_SKILL_NAMES`（14 个）
- [ ] `SKILL_NAMES = [...WORKFLOW_SKILL_NAMES, ...GLOBAL_SKILL_NAMES]` = 25 个

### AC2: SkillTemplateEntry 扩展
- [ ] `SkillTemplateEntry` 的 `workflowId` 类型为字面量联合类型 `WorkflowId`（不是 `string`）
- [ ] 全局技能条目无 `workflowId`（`undefined`），通过 `isWorkflowEntry` / `isGlobalEntry` 区分
- [ ] `isWorkflowEntry(e)` 和 `isGlobalEntry(e)` helper 函数存在且正确

### AC3: getSkillTemplates 双通道
- [ ] 无 filter 调用时：返回 25 个技能条目（11 + 14）
- [ ] 有 filter 调用时：返回 `workflowScoped(按filter) + globalScoped(全量14)` = `filter匹配数 + 14`
- [ ] `generateWorkspaceAgentSkills()` 调用 `getSkillTemplates(profileIds)` 时总能拿到 25 个技能
- [ ] `init.ts` 调用 `getSkillTemplates(workflows)` 时也能拿到 25 个技能

### AC4: 技能生成
- [ ] `apeworkflow update` 后 `.claude/skills/` 或对应工具 skillsDir 中包含全部 25 个技能
- [ ] 所有 25 个技能的 SKILL.md frontmatter 中 name 带 `apeworkflow-` 前缀
- [ ] 14 个新技能内容中无 `superpowers` 引用残留（grep 确认）

### AC5: 技能清理
- [ ] profile 切换不会清理全局技能（它们始终存在）
- [ ] `removeManagedWorkflowSkillDirs()` 只处理工作流技能
- [ ] `getManagedWorkspaceSkillEntries()` 过滤 `isWorkflowEntry`

### AC6: Profile UI 不膨胀
- [ ] `apeworkflow config profile` 的命令选择器只显示 11 个工作流技能
- [ ] `WORKFLOW_PROMPT_META`（config.ts）保持 11 个 key 不变

### AC7: 附属文件
- [ ] 8 个有附属文件的技能（brainstorming, requesting-code-review, subagent-driven-development, systematic-debugging, test-driven-development, writing-plans, writing-skills, using-skills）正确复制附属文件
- [ ] 附属文件与 TS 模板放同目录（`src/core/templates/workflows/<dirName>/`），构建时自动到 `dist/core/templates/workflows/`
- [ ] 附属文件随 npm 包自动分发（通过 `files: ["dist"]`）
- [ ] 附属文件复制在技能生成后执行（`cp -r` 同目录非 .ts 文件）
- [ ] SKILL.md 中的附属文件路径引用与生成位置一致

### AC8: 测试通过
- [ ] `pnpm run build` 编译通过
- [ ] `pnpm test` 现有测试全部通过
- [ ] 测试文件已更新以匹配新的数量（11 → 25）

## 设计决策记录

- **决策 1：** 不在 `ALL_WORKFLOWS` 中加 14 个技能（见 proposal.md 决策 7）
- **决策 2：** 用 `workflowId` 区分技能类型（而非新增 scope 字段）
  - 现有 11 个工作流条目已有 `workflowId`，新增 14 个不加 = 全局技能
  - 过滤逻辑：`isWorkflowEntry = workflowId !== undefined`
- **决策 3（已更新 → 见 design.md 决策 8）：** 附属文件改为与 TS 模板放同目录（`workflows/<dirName>/`），不再用独立的 `assets/` 层
  - 构建时自动到 `dist/core/templates/workflows/`
  - 复制时 `cp -r` 连带附属文件
  - 不修改 TS 模板的 template literal 体积
- **决策 4：** `feedback.ts` 删除
  - 孤儿技能，从未接入任何管线
  - 如需恢复，从 git history 找回

## 与现有 artifacts 的关系

| Artifact | 状态 | 关系 |
|----------|------|------|
| proposal.md | 已更新 | 添加架构设计 + 决策 7 + 风险表格 |
| design.md | 已更新 | 重写架构、类型设计、映射表、附属文件策略 |
| tasks.md | 已更新 | 拆为 4 个 Phase，每个技能独立 task |
| schema | 无依赖 | 此 spec 不改变 change schema |
