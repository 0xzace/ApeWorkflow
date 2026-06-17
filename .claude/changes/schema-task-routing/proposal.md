---
apeworkflow:
  version: 1
---

# Proposal: Schema-Driven Task Routing

## Why

ApeWorkflow 的"任务类型路由"（即 `feature → executing-plans → TDD → subagent` 这样的 skill 链映射）硬编码在 5 个 `.md` 文件中。每次新增任务类型或修改 skill 链，需要同时改 5 个文件，靠人工维护一致性。

```
当前: 5 份副本 × 4 种任务类型 × 3 个阶段 = 60 处 skill 引用
      每次变更需要人工确认 5 个文件的一致性
```

这导致：
- **维护成本高**：新增一个任务类型（如 "ops"）需要改 5 个文件
- **容易漂移**：副本之间出现微小差异（"调用"前缀有无、措辞差异）
- **发现性差**：用户不知道完整的 skill 链有哪些，也无法通过 CLI 查询

## What Changes

### CLI 层
1. 扩展 `apeworkflow instructions apply --json` 返回 `taskTypeRouting` 字段
2. 新增 `apeworkflow instructions verify --json` 命令
3. 新增 `apeworkflow instructions archive --json` 命令

### Schema 层
4. 在 `schema.yaml` 中新增 `phases` 配置块，支持 `apply`, `verify`, `archive` 各阶段的 `taskTypeRouting` 定义
5. Zod schema 验证新增 `phases` 和 `taskTypeRouting` 结构

### 文档层
6. 精简 5 个 `.md` 文件：删除 20 行硬编码路由表，替换为 CLI JSON 引用说明
7. 新增端到端路由测试（验证 schema → CLI → Claude 数据流）

## Capabilities

### New Capabilities
- **schema-task-routing**: 任务类型路由由 schema.yaml 定义，CLI 输出为结构化 JSON，.md 文件动态读取

### Modified Capabilities
- **spec-driven schema**: 新增 phases.apply, phases.verify, phases.archive 配置块
- **workspace-planning schema**: 同上
- **apeworkflow instructions apply**: 新增 taskTypeRouting 返回字段

## Impact

- `src/core/artifact-graph/types.ts`: Zod schema 扩展
- `src/core/artifact-graph/schema.ts`: phases 验证逻辑
- `src/commands/workflow/instructions.ts`: 新增 generateVerifyInstructions / generateArchiveInstructions
- `src/cli/index.ts`: 注册 2 个新 CLI 命令
- `schemas/spec-driven/schema.yaml`: 新增 ~35 行 phases 配置
- `schemas/workspace-planning/schema.yaml`: 新增 ~35 行 phases 配置
- 5 个 `.md` 文件: 精简路由表
- 测试: 3 个修改文件 + 1 个新增文件
