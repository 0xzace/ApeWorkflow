# Design: Schema-Driven Task Routing

## Context

当前每个工作流命令（`/ape:apply`, `/ape:verify`, `/ape:archive`）和对应技能文件（`apeworkflow-apply-change`, `apeworkflow-archive-change`）都硬编码了一份 20 行的"任务类型路由表"：

```
功能开发: apply → executing-plans → TDD → subagent
缺陷修复: apply → systematic-debugging → TDD → executing-plans
重构:     apply → executing-plans → TDD → subagent
文档:     apply → writing-skills
```

这段数据出现在 5 个文件中，靠人工维护一致性。新增任务类型需要改 5 个文件。

## Decision: 路由表移入 schema.yaml phases 配置

把任务类型路由数据从 Markdown 文本迁移到 schema YAML 的 `phases` 块中，通过 CLI `instructions` 命令的 JSON 输出暴露给 Claude。

### 核心架构

```
schema.yaml (phases.apply/verify/archive.taskTypeRouting)
       ↓ resolveSchema()
       ↓ loadChangeContext() → ChangeContext.phases
       ↓
CLI: apeworkflow instructions apply --json  → + taskTypeRouting 字段
CLI: apeworkflow instructions verify --json → 新命令
CLI: apeworkflow instructions archive --json → 新命令
       ↓
Claude: 读取 CLI JSON 输出中的 taskTypeRouting，不再硬编码
```

### Backward Compatibility

- `schema.apply` 保留（旧格式）。加载时自动映射到 `schema.phases.apply`
- 没有 `phases` 的旧 schema，CLI 返回 `taskTypeRouting: undefined`，Claude 走 `instruction` 文本
- 不影响任何现有 CLI 命令行为

### Schema 变更设计

```yaml
# spec-driven/schema.yaml 新增

apply:
  requires: [plans]
  tracks: plans/*.md
  instruction: |
    Read the plan files, work through pending tasks, mark complete as you go.
  taskTypeRouting:
    default:
      - executing-plans
      - test-driven-development
      - subagent-driven-development
    taskTypes:
      feature:
        - executing-plans
        - test-driven-development
        - subagent-driven-development
      bugfix:
        - systematic-debugging
        - test-driven-development
        - executing-plans
      refactor:
        - executing-plans
        - test-driven-development
        - subagent-driven-development
      docs:
        - writing-skills

verify:
  instruction: |
    Verify implementation matches change artifacts before archiving.
    Use three dimensions: completeness, correctness, coherence.
  taskTypeRouting:
    default:
      - verification-before-completion
    taskTypes:
      feature:
        - verification-before-completion
        - requesting-code-review
        - receiving-code-review
      bugfix:
        - verification-before-completion
        - requesting-code-review
        - receiving-code-review
      refactor:
        - verification-before-completion
        - requesting-code-review
        - receiving-code-review
      docs:
        - verification-before-completion

archive:
  instruction: |
    Archive a completed change. Sync delta specs, then move to archive directory.
  taskTypeRouting:
    default:
      - finishing-a-development-branch
      - verification-before-completion
    taskTypes:
      feature:
        - finishing-a-development-branch
        - verification-before-completion
      bugfix:
        - finishing-a-development-branch
        - verification-before-completion
      refactor:
        - finishing-a-development-branch
        - verification-before-completion
      docs:
        - finishing-a-development-branch
        - verification-before-completion
```

### Zod Schema 变更

**types.ts 新增/修改：**

```typescript
// 新增路由结构
TaskTypeRoutingSchema = {
  default: string[] (min 1)
  taskTypes?: Record<string, string[]>  // key → task type name, value → skill chain
}

// 扩展 PhaseConfig（替换原有的 ApplyPhase）
PhaseConfigSchema = {
  requires: string[]
  tracks?: string | null
  instruction?: string
  taskTypeRouting?: TaskTypeRoutingSchema  ← 新增
}

// SchemaYamlSchema 新增 phases
phases?: Record<string, PhaseConfigSchema>  ← 新增
// apply 保留，向后兼容
```

### CLI 变更

**现有命令增强：**
- `apeworkflow instructions apply --change X --json` → 返回类型增加 `taskTypeRouting?` 字段
- 数据从 `schema.phases.apply.taskTypeRouting` 提取，fallback 到 `schema.apply.taskTypeRouting`

**新增命令：**
- `apeworkflow instructions verify --change X --json` → 返回 `VerifyInstructions`
- `apeworkflow instructions archive --change X --json` → 返回 `ArchiveInstructions`

### Markdown 文件精简

每个文件删除约 20 行硬编码表格，替换为 5 行引用说明：

```markdown
## 任务类型路由

从 CLI 输出动态读取。运行 `apeworkflow instructions apply --change "<name>" --json`，
使用返回 JSON 中的 `taskTypeRouting` 字段：
- `taskTypeRouting.default`: 任务类型无法识别时的 fallback skill 链
- `taskTypeRouting.taskTypes.<type>`: 指定任务类型的 skill 链
```

### 变更文件清单

| 文件 | 操作 | 预计改动 |
|------|------|---------|
| `src/core/artifact-graph/types.ts` | 修改 | +20 行 (新增 Zod + 类型导出) |
| `src/core/artifact-graph/schema.ts` | 修改 | +15 行 (phases 验证) |
| `src/core/artifact-graph/instruction-loader.ts` | 修改 | +10 行 (ChangeContext.phases) |
| `src/commands/workflow/shared.ts` | 修改 | +10 行 (ApplyInstructions.taskTypeRouting) |
| `src/commands/workflow/instructions.ts` | 修改 | +130 行 (verify/archive 指令生成器) |
| `src/commands/workflow/index.ts` | 修改 | +5 行 (导出新函数) |
| `src/cli/index.ts` | 修改 | +30 行 (注册 2 个新命令) |
| `schemas/spec-driven/schema.yaml` | 修改 | +35 行 (phases 块) |
| `schemas/workspace-planning/schema.yaml` | 修改 | +35 行 (同模式) |
| `.claude/commands/ape/apply.md` | 修改 | -15 行 (精简路由表) |
| `.claude/commands/ape/verify.md` | 修改 | -15 行 |
| `.claude/commands/ape/archive.md` | 修改 | -15 行 |
| `.claude/skills/apeworkflow-apply-change/SKILL.md` | 修改 | -15 行 |
| `.claude/skills/apeworkflow-archive-change/SKILL.md` | 修改 | -15 行 |
| `test/core/artifact-graph/schema.test.ts` | 修改 | +60 行 (phases 验证测试) |
| `test/commands/workflow/instructions.test.ts` | 修改 | +50 行 (routing 测试) |
| `test/commands/workflow/instructions-print.test.ts` | 修改 | +30 行 (routing 打印测试) |
| `test/commands/workflow/instructions-routing.test.ts` | **新增** | ~200 行 (端到端路由测试) |

### 风险

| 风险 | 严重度 | 缓解 |
|------|--------|------|
| Zod 扩展破坏旧 YAML | 低 | `.optional()` 保护；测试覆盖 |
| .md 文件丢失上下文 | 中 | 保留 JSON 示例在引用说明中 |
| 路由与 CLI 逻辑不一致 | 中 | 路由是纯数据，CLI 只做读取转发 |

## Decision Log

- **D1: phases vs 顶层 apply** → 用 phases 做统一命名空间，apply 保留为别名
- **D2: 任务类型自动识别** → 不做。由 Claude 根据上下文判断类型，schema 只回答"给定类型 X 的 skill 链是什么"
- **D3: 新 phase 的 discoverability** → `apeworkflow schemas` 已可展示 schema 结构，后续可增强
- **D4: workspace-planning schema** → 同上模式，独立配置
