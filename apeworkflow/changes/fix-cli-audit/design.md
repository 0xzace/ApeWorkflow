# Design

## Context

ApeWorkflow CLI 经过 2026-06-17 全面审计，发现 13 个问题覆盖 P0（致命）到 P3（低）。问题集中在：

1. **安装流程**——`copyAttachedFiles` 静默吞错，prompt 文件未安装
2. **单源 vs 双源**——命令和 Skill 内容完全相同，由模板源码 `content: getApplyChangeSkillTemplate().instructions` 驱动
3. **路由分裂**——命令文件硬编码中文路由表，CLI 返回英文路由表，两套永远对不上
4. **设计不一致**——变更选择策略在 apply/archive/verify 中不同

## Goals / Non-Goals

**Goals:**
- 修复所有 P0 和 P1 问题（7 个）
- 为 P2 问题提供实现方案（即使不全部实现）
- 修复 P3 的 CLAUDE.md 缺失

**Non-Goals:**
- 不重构 CLI 核心架构
- 不改 schema 定义
- 不改变 artifact 依赖链（proposal→specs/design→tasks→plans）
- 不添加新的 CLI 子命令（只在 `.claude/commands` 中加文件）

## Decisions

### Decision 1: 命令/Skill 镜像 → 单源模式

**选择**: 命令文件（`.claude/commands/ape/*.md`）不再作为独立模板源，而是由 `apeworkflow update` 从 Skill 模板生成。

```
src/core/templates/workflows/apply-change.ts
  ├── getApplyChangeSkillTemplate() → Skill 内容（单源）
  └── getApeApplyCommandTemplate()  → 从 Skill 内容生成（不再独立维护）
```

这样 `using-skills` 的"先检查 Skill"规则和 `/ape:apply` 的内容完全一致，没有元循环问题。

**Why not 双源+契约测试?**
- 双源意味着每次改一个忘了改另一个，审计已经证明这不可靠
- 契约测试能发现不一致，但不能防止不一致发生
- 单源从根源消除问题

### Decision 2: 任务路由 → 完全依赖 CLI 返回

删除所有命令文件（apply.md、archive.md、verify.md）中的硬编码中文路由表。AI 应该直接使用 `apeworkflow instructions apply --json` 返回的 `taskTypeRouting` 字段。

verify 的路由表更是死代码——CLI 根本不会返回。直接删除。

### Decision 3: 变更选择 → 统一为"无变更名时 auto-select"

```
/ape:apply   → auto-select（如果只有一个活跃变更）
/ape:archive → auto-select（如果只有一个活跃变更）
/ape:verify  → auto-select（如果只有一个活跃变更）
```

**Why**: 用户只有一个变更时，选另一个是错误风险极低的操作。如果选错了，用户可以加参数覆盖（`/ape:archive another-change`）。"始终手动"在单变更场景下是摩擦。

### Decision 4: Workspace Planning → 提供回退方案

不删除当前检测，但在检测后添加回退：

```
if workspace-planning && allowedEditRoots empty:
  1. 说明当前不支持
  2. 建议: 先用 /ape:explore 在 workspace 范围内探索
  3. 建议: 对具体子区域用 /ape:propose 创建变更
  4. 不卡死
```

### Decision 5: Lite 模式 → 提供 --lite 参数

为快速小修改提供轻量路径：

```bash
apeworkflow new change <name> --lite  # 只创建 proposal + tasks
# 跳过 specs 和 design
```

这不影响现有的标准 `spec-driven` 流程。
