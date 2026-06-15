# Proposal: Methodology-Driven Workflow

## Intent

将 14 个全局方法论技能从"对话孤岛"升级为"工作流一等公民"，通过三层改造让 `/ape:apply` 自动编排方法论技能，实现方法论驱动的工作流。

## Background

当前 ApeWorkflow 有两套技能体系：

- **工作流技能 (11 个)**：负责流程编排——知道做什么、按什么顺序做
- **全局技能 (14 个)**：负责执行质量——知道怎么做、有具体战术

两者之间没有连接：

1. `apply` 只管任务列表，不管实现质量（"Make the code changes required"）
2. 方法论技能（TDD、debugging 等）是对话孤岛——完成后没有 handoff
3. 用户需要手动调用方法论，容易跳过关键步骤
4. 方法论技能之间互相引用，但都不认识工作流生命周期

## Scope

### In scope

- 代码层：14 个全局技能 → 工作流技能（加 workflowId、CLI 命令）
- 指令层：每个方法论技能追加 handoff 段落（完成后知道下一步）
- 编排层：重写 `apply-change.ts` 指令，使 apply 成为方法论编排器

### Out of scope

- 重构 artifact-graph 引擎
- 修改 schema 定义
- ML/NLP 任务类型分类（用关键词启发式代替）
- 方法论技能拆解为子步骤

## Approach

三层递进改造：

```
代码层 (profiles.ts, tool-detection.ts, skill-generation.ts)
  → 14 个技能加 workflowId，约 42 行代码

指令层 (14 个方法论技能 .ts)
  → 每个追加 handoff 段落，约 200 行

编排层 (apply-change.ts)
  → 重写 task loop 指令，约 80 行
```

## Architecture

详见 [design.md](./design.md)。

核心概念：

```
apply 的 task loop 从：

  for task in tasks:
    写代码（AI 自由发挥）

变为：

  for task in tasks:
    分析类型 → 推荐方法论 → 注入指令 → 执行 → handoff → verify → 下一个
```

## Risks

| 风险 | 影响 | 缓解 |
|------|------|------|
| 任务类型判断不准确 | 推荐错误方法论 | 用户可手动切换 |
| AI 忽略 handoff | tasks.md 不更新 | apply 加入 verify checkpoint |
| 上下文窗口压力 | 指令过长 | 方法论内容不复制，AI 已有技能 |

## Phases

1. **代码层** — 改 4-5 个文件，~42 行，低风险，独立验证
2. **指令层** — 14 个技能追加 handoff，~200 行，无代码风险
3. **编排层** — 重写 apply-change 指令，~80 行，需要手动测试
4. **集成测试** — 端到端验证
