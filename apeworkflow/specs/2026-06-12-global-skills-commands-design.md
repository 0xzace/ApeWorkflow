# Design: Global Skills CLI Commands

> **Status:** Approved
> **Date:** 2026-06-12
> **Topic:** 给 15 个全局方法论技能添加独立 `/ape:*` 命令行

## 1. 背景

ApeWorkflow 现有 11 个工作流技能有对应的 `/ape:*` 命令行（`/ape:propose`, `/ape:explore` 等）。15 个全局方法论技能（brainstorming, TDD, debugging 等）只有 SKILL.md，没有 CLI 命令。

目标：给所有 15 个全局技能添加独立的 `/ape:*` 命令，风格与工作流命令一致。

## 2. 目标

1. 15 个全局技能各有一个独立命令（如 `/ape:brainstorming`, `/ape:test-driven-development`）
2. 命令接受一个可选参数（任务描述字符串）
3. 命令内容复用对应技能模板的 instructions，避免内容重复
4. 不影响现有工作流命令管线
5. 不影响 profile 机制（全局命令始终可用）

## 3. 非目标

- 不修改现有 11 个工作流命令
- 不新增命令路由机制
- 不修改命令分类（category）—— 全局命令统一为 `Methodology`
- 不做命令别名或缩写

## 4. 架构

```
┌──────────────────────────────────────────────────────────────────┐
│                 ApeWorkflow 命令管线（合并后）                      │
│                                                                  │
│   /ape:* CLI commands                                            │
│        │                                                         │
│   ┌────┴─────┐                                                   │
│   │ 通道 1: 工作流命令  │  通道 2: 全局命令                         │
│   │  (11 个)     │  (15 个)                                      │
│   │            │                                                  │
│   │ WORKFLOW_  │  GLOBAL_COMMAND_IDS                             │
│   │ COMMAND_   │                                                  │
│   │ IDS ↓      │  ↓ 无条件                                        │
│   │ profile    │  getCommandTemplates                            │
│   │ 筛选       │                                                  │
│   └────┬───────┘  └─────────────────────────────────────────────┘
│        │            │                                              │
│        └────────────┼─────────────────────────────────────────────┘
│                     │                                              │
│            ┌────────┴──────────┐                                  │
│            │ getCommandTemplates│                                  │
│            │ 返回 26 个命令      │                                  │
│            └────────┬──────────┘                                  │
│                     │                                              │
│            ┌────────┴──────────┐                                  │
│            │ getCommandContents │                                  │
│            │ → CommandContent[] │                                  │
│            └───────────────────┘                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 核心原则

- `WORKFLOW_COMMAND_IDS` 保持 11 个不变
- 新增 `GLOBAL_COMMAND_IDS` 包含 15 个全局命令 ID
- `COMMAND_IDS = [...WORKFLOW_COMMAND_IDS, ...GLOBAL_COMMAND_IDS]` = 26 个
- 全局命令不受 profile 筛选
- 全局命令的 `content` 复用对应技能模板的 instructions

## 5. 数据模型

### 5.1 常量拆分

```typescript
// tool-detection.ts

export const WORKFLOW_COMMAND_IDS = [
  'explore', 'new', 'continue', 'apply', 'ff', 'sync',
  'archive', 'bulk-archive', 'verify', 'onboard', 'propose',
] as const;  // 11 个

export const GLOBAL_COMMAND_IDS = [
  'brainstorming',
  'dispatching-parallel-agents',
  'executing-plans',
  'finishing-a-development-branch',
  'receiving-code-review',
  'requesting-code-review',
  'subagent-driven-development',
  'systematic-debugging',
  'test-driven-development',
  'using-git-worktrees',
  'using-skills',
  'verification-before-completion',
  'writing-plans',
  'writing-skills',
] as const;  // 15 个

// 向后兼容
export const COMMAND_IDS = [...WORKFLOW_COMMAND_IDS, ...GLOBAL_COMMAND_IDS] as const;
export type CommandId = (typeof COMMAND_IDS)[number];
```

### 5.2 CommandTemplateEntry 扩展

```typescript
// skill-generation.ts

export interface CommandTemplateEntry {
  template: CommandTemplate;
  id: string;
  scope?: 'workflow' | 'global';  // 标记命令来源通道
}
```

### 5.3 getCommandTemplates() 双通道

```typescript
function getCommandTemplates(workflowFilter?: readonly string[]): CommandTemplateEntry[] {
  // 工作流命令（受 profile 筛选）
  const workflowCommands: CommandTemplateEntry[] = [
    { template: getApeExploreCommandTemplate(), id: 'explore', scope: 'workflow' },
    // ... 11 个
  ];

  // 全局命令（无条件）
  const globalCommands: CommandTemplateEntry[] = [
    { template: getApeBrainstormingCommandTemplate(), id: 'brainstorming', scope: 'global' },
    // ... 15 个
  ];

  const all = [...workflowScoped, ...globalCommands];
  return all;
}
```

## 6. 全局命令模板格式

每个全局技能在对应的 TS 模板文件中新增一个 `getApeXxxCommandTemplate()` 函数。

### 小技能（≤200 行）

```typescript
export function getApeBrainstormingCommandTemplate(): CommandTemplate {
  return {
    name: 'APE: Brainstorming',
    description: 'Start brainstorming — explore ideas and design collaboratively',
    category: 'Methodology',
    tags: ['methodology', 'brainstorming', 'design'],
    content: getBrainstormingSkillTemplate().instructions,
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}
```

### 大技能（>200 行）

```typescript
export function getApeTestDrivenDevelopmentCommandTemplate(): CommandTemplate {
  return {
    name: 'APE: Test-Driven Development',
    description: 'Use TDD — write test first, watch it fail, write minimal code to pass',
    category: 'Methodology',
    tags: ['methodology', 'test-driven-development', 'tdd'],
    content: getTestDrivenDevelopmentInstructions(),
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}
```

### 复用策略

- 小技能直接调用 `getSkillTemplate().instructions`
- 大技能直接调用 `getInstructions()` 函数
- 避免内容重复，命令和内容保持同步

### 命令 ID 到 /ape:* 映射

| 技能名 | 命令 ID | /ape 命令 |
|--------|---------|-----------|
| brainstorming | `brainstorming` | `/ape:brainstorming` |
| dispatching-parallel-agents | `dispatching-parallel-agents` | `/ape:dispatching-parallel-agents` |
| executing-plans | `executing-plans` | `/ape:executing-plans` |
| finishing-a-development-branch | `finishing-a-development-branch` | `/ape:finishing-a-development-branch` |
| receiving-code-review | `receiving-code-review` | `/ape:receiving-code-review` |
| requesting-code-review | `requesting-code-review` | `/ape:requesting-code-review` |
| subagent-driven-development | `subagent-driven-development` | `/ape:subagent-driven-development` |
| systematic-debugging | `systematic-debugging` | `/ape:systematic-debugging` |
| test-driven-development | `test-driven-development` | `/ape:test-driven-development` |
| using-git-worktrees | `using-git-worktrees` | `/ape:using-git-worktrees` |
| using-skills | `using-skills` | `/ape:using-skills` |
| verification-before-completion | `verification-before-completion` | `/ape:verification-before-completion` |
| writing-plans | `writing-plans` | `/ape:writing-plans` |
| writing-skills | `writing-skills` | `/ape:writing-skills` |

## 7. 文件变更清单

### 修改文件（6 个）

| 文件 | 改动 |
|------|------|
| `src/core/shared/skill-generation.ts` | 15 个 `getApeXxxCommandTemplate()` 导入 + `globalCommands` 数组 + 双通道合并 + `scope` 字段 |
| `src/core/shared/tool-detection.ts` | `COMMAND_IDS` 拆分为 `WORKFLOW_COMMAND_IDS` + `GLOBAL_COMMAND_IDS` |
| `src/core/shared/index.ts` | 导出新常量 |
| `src/core/templates/skill-templates.ts` | 15 个 `getApeXxxCommandTemplate()` export |
| `src/core/templates/workflows/apeworkflow-*.ts` | 15 个技能文件各加一个 `getApeXxxCommandTemplate()`（+5~15 行/文件） |

### 不变文件

| 文件 | 原因 |
|------|------|
| `src/core/init.ts` | 只处理工作流命令（已有 `WORKFLOW_COMMAND_IDS`） |
| `src/core/profile-sync-drift.ts` | 同上 |
| `src/commands/` | 命令路由已通用，不改 |
| `ALL_WORKFLOWS` / `CORE_WORKFLOWS` | 不变 |
| `WORKFLOW_TO_SKILL_DIR` | 不变 |

## 8. 设计决策记录

### 决策 1：复用技能 instructions 作为命令 content

**做法：** 命令模板的 `content` 直接引用对应技能模板的 `instructions`（或 `getInstructions()` 函数）。

**理由：** 避免内容重复，保证命令和 SKILL.md 内容同步。修改技能内容时只需改一处。

### 决策 2：COMMAND_IDS 拆分

**做法：** `COMMAND_IDS` → `WORKFLOW_COMMAND_IDS` + `GLOBAL_COMMAND_IDS`，`COMMAND_IDS` 保持向后兼容。

**理由：** 语义清晰，工作流和全局命令独立维护。未来扩展方便。

### 决策 3：命令 scope 标记

**做法：** `CommandTemplateEntry` 新增 `scope?: 'workflow' | 'global'` 字段。

**理由：** 标记命令来源通道，方便未来按 scope 过滤或展示。

### 决策 4：全局命令 category 为 Methodology

**做法：** 所有全局命令的 `category` 固定为 `Methodology`。

**理由：** 与现有工作流命令（`category: 'Workflow'`）区分。

## 9. 验收标准

### AC1: 常量定义
- [ ] `WORKFLOW_COMMAND_IDS` 11 个
- [ ] `GLOBAL_COMMAND_IDS` 15 个
- [ ] `COMMAND_IDS` 26 个

### AC2: 命令模板
- [ ] 15 个全局技能各有一个 `getApeXxxCommandTemplate()`
- [ ] `name` 格式为 `APE: <DisplayName>`
- [ ] `category` 为 `Methodology`
- [ ] `content` 复用技能 instructions

### AC3: getCommandTemplates
- [ ] 无 filter 返回 26 个
- [ ] 有 filter 返回 `filter匹配数 + 15`

### AC4: 向后兼容
- [ ] `COMMAND_IDS` 仍包含全部 26 个 ID
- [ ] 现有工作流命令不受影响

### AC5: 编译通过
- [ ] `pnpm run build` 编译通过
- [ ] 测试通过
