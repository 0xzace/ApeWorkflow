# Design: Merge superpowers-5.1.0 Skills as TypeScript Templates

> **Status:** Approved
> **Date:** 2026-06-12
> **Change:** apeworkflow/changes/superpowers-skills-merge

## 1. 背景

ApeWorkflow 现有技能管线是**工作流驱动**的：11 个技能（`apeworkflow-*.ts` 模板），随 profile 启用/禁用，有 `/ape:*` 命令行。

superpowers-5.1.0 的 14 个方法论技能（brainstorming, TDD, systematic-debugging 等）是静态 Markdown 文件（3207 行），覆盖 AI 代理开发方法论。`feedback.ts` 已存在但未接入管线。

两者互补但需要统一分发机制：抹掉 superpowers 命名痕迹，统一 `apeworkflow-` 前缀，通过同一管线分发全部 26 个技能。

## 2. 目标

1. 方法论技能作为**全局技能**独立于工作流分发
2. 不影响现有 `ALL_WORKFLOWS`、`CORE_WORKFLOWS`、`WORKFLOW_TO_SKILL_DIR`
3. `getSkillTemplates()` 始终返回 26 个技能（11 个工作流按筛选 + 15 个全局无条件）
4. `apeworkflow update` 生成全部 26 个技能文件
5. `apeworkflow config profile` 只显示 11 个工作流技能
6. 修复 `ALL_WORKFLOWS` 缺少 `propose` 的 pre-existing bug

## 3. 非目标

- 不优化技能之间的调用流程（如 superpowers → ApeWorkflow 的衔接）
- 不新增 profile 配置或过滤机制
- 不修改 superpowers 上游内容（本次转换一次性操作）
- 不做 Registry 重构（现有 11 个技能的硬编码数组保持不变）

## 4. 架构：双通道技能管线

```
┌──────────────────────────────────────────────────────────────────┐
│               ApeWorkflow 技能生成管线（合并后）                    │
│                                                                  │
│   apeworkflow update / workspace update                         │
│            │                                                     │
│   ┌────────┴─────────┐                                          │
│   │ 通道 1: 工作流技能  │  通道 2: 全局技能                         │
│   │  (11 个)         │  (15 个)                                  │
│   │                 │  (原14个 + feedback)                        │
│   │ ALL_WORKFLOWS  │  ALL_GLOBAL_SKILLS                         │
│   │ ↓ 按 profile    │  ↓ 无条件                                   │
│   │ getSkillTempl.  │  getSkillTempl.                            │
│   └────────┬────────┘  └─────────────────────────────────────────┘
│            │            │                                          │
│            └────────────┼─────────────────────────────────────────┘
│                         │                                          │
│                ┌────────┴──────────┐                              │
│                │ getSkillTemplates()│                              │
│                │ 返回 26 个技能条目   │                              │
│                └────────┬──────────┘                              │
│                         │                                          │
│                ┌────────┴──────────┐                              │
│                │ generateWorkspace │                              │
│                │ AgentSkills()     │                              │
│                │ → ~/.claude/skills/│                              │
│                └───────────────────┘                              │
│                                                                  │
│   清理路径:                                                      │
│   removeManagedWorkflowSkillDirs()                                │
│     → 只处理 workflowId !== undefined 的条目                       │
│     → 全局技能永远不会被清理                                        │
└──────────────────────────────────────────────────────────────────┘
```

### 核心原则

- `ALL_WORKFLOWS` 保持 11 个不变（本次修复补充 `propose`）
- 新增 `ALL_GLOBAL_SKILLS` 包含 15 个方法论技能
- `WORKFLOW_TO_SKILL_DIR` 只映射 11 个工作流技能
- 全局技能通过 `getSkillTemplates()` 直接访问
- 方法论技能不加入 profile 选择器 UI

## 5. 数据模型

### 5.1 SkillTemplateEntry（修改）

```typescript
// workflowId 改为精确字面量类型，变为可选
interface SkillTemplateEntry {
  template: SkillTemplate;
  dirName: string;
  workflowId?: WorkflowId;  // 工作流技能有，全局技能无

  // ⚠️ 不新增 scope 字段 — 用 workflowId 做天然区分
  // 现有 11 个条目已有 workflowId，新增 15 个不加 = 全局技能
}

// 精确字面量联合类型（含 propose）
type WorkflowId = 'explore' | 'new' | 'continue' | 'apply' | 'ff' | 'sync'
  | 'archive' | 'bulk-archive' | 'verify' | 'onboard' | 'propose';

function isWorkflowEntry(e: SkillTemplateEntry): boolean {
  return e.workflowId !== undefined;
}
function isGlobalEntry(e: SkillTemplateEntry): boolean {
  return e.workflowId === undefined;
}
```

### 5.2 常量拆分

```typescript
// tool-detection.ts

export const WORKFLOW_SKILL_NAMES = [
  'apeworkflow-explore',
  'apeworkflow-new-change',
  'apeworkflow-continue-change',
  'apeworkflow-apply-change',
  'apeworkflow-ff-change',
  'apeworkflow-sync-specs',
  'apeworkflow-archive-change',
  'apeworkflow-bulk-archive-change',
  'apeworkflow-verify-change',
  'apeworkflow-onboard',
  'apeworkflow-propose',
] as const;  // 11 个

export const GLOBAL_SKILL_NAMES = [
  'apeworkflow-brainstorming',
  'apeworkflow-dispatching-parallel-agents',
  'apeworkflow-executing-plans',
  'apeworkflow-finishing-a-development-branch',
  'apeworkflow-receiving-code-review',
  'apeworkflow-requesting-code-review',
  'apeworkflow-subagent-driven-development',
  'apeworkflow-systematic-debugging',
  'apeworkflow-test-driven-development',
  'apeworkflow-using-git-worktrees',
  'apeworkflow-using-skills',
  'apeworkflow-verification-before-completion',
  'apeworkflow-writing-plans',
  'apeworkflow-writing-skills',
  'apeworkflow-feedback',  // 新接入
] as const;  // 15 个

// 向后兼容
export const SKILL_NAMES = [...WORKFLOW_SKILL_NAMES, ...GLOBAL_SKILL_NAMES] as const;
// 26 个

export type SkillName = (typeof SKILL_NAMES)[number];
```

### 5.3 getSkillTemplates() 双通道实现

```typescript
function getSkillTemplates(workflowFilter?: readonly string[]): SkillTemplateEntry[] {
  const workflowScoped = allEntries
    .filter(isWorkflowEntry)
    .filter(e => !workflowFilter || workflowFilter.includes(e.workflowId!));

  const globalScoped = allEntries.filter(isGlobalEntry);

  return [...workflowScoped, ...globalScoped];
}
```

关键点：
- `workflowFilter` 只影响工作流通道，全局通道始终全量返回
- 无 filter 时返回 26 个；有 filter 时返回 `filter匹配数 + 15`
- `init.ts` 调用 `getSkillTemplates(workflows)` 时自动获得 26 个技能
- `generateWorkspaceAgentSkills()` 调用 `getSkillTemplates(profileIds)` 时也获得 26 个

### 5.4 removeManagedWorkspaceSkillEntries() 过滤

```typescript
function getManagedWorkspaceSkillEntries(): Array<{ workflowId: string; dirName: string }> {
  return getSkillTemplates()
    .filter(isWorkflowEntry)  // 只保留有 workflowId 的条目
    .map(({ workflowId, dirName }) => ({ workflowId, dirName }));
}
```

这确保全局技能永远不会被清理。

## 6. 文件变更清单

### 6.1 新增文件（15 个技能模板 + 附属文件）

```
src/core/templates/workflows/
├── apeworkflow-brainstorming.ts                    (~164 行，内联)
├── apeworkflow-dispatching-parallel-agents.ts      (~182 行，内联)
├── apeworkflow-executing-plans.ts                  (~70 行，内联)
├── apeworkflow-finishing-a-development-branch.ts   (~251 行，函数式)
├── apeworkflow-receiving-code-review.ts            (~213 行，函数式)
├── apeworkflow-requesting-code-review.ts           (~103 行，内联)
├── apeworkflow-subagent-driven-development.ts      (~279 行，函数式)
├── apeworkflow-systematic-debugging.ts             (~296 行，函数式)
├── apeworkflow-test-driven-development.ts          (~371 行，函数式)
├── apeworkflow-using-git-worktrees.ts              (~215 行，函数式)
├── apeworkflow-using-skills.ts                     (~117 行，内联)
├── apeworkflow-verification-before-completion.ts   (~139 行，内联)
├── apeworkflow-writing-plans.ts                    (~152 行，内联)
└── apeworkflow-writing-skills.ts                   (~655 行，函数式)
```

**大技能阈值判定（200 行）：**

| 技能 | 正文行数 | 模式 |
|------|---------|------|
| brainstorming | ~164 | 内联 |
| dispatching-parallel-agents | ~182 | 内联 |
| executing-plans | ~70 | 内联 |
| finishing-a-development-branch | ~251 | 函数式 |
| receiving-code-review | ~213 | 函数式 |
| requesting-code-review | ~103 | 内联 |
| subagent-driven-development | ~279 | 函数式 |
| systematic-debugging | ~296 | 函数式 |
| test-driven-development | ~371 | 函数式 |
| using-git-worktrees | ~215 | 函数式 |
| using-skills | ~117 | 内联 |
| verification-before-completion | ~139 | 内联 |
| writing-plans | ~152 | 内联 |
| writing-skills | ~655 | 函数式 |

### 6.2 修改文件（6 个）

| 文件 | 改动 |
|------|------|
| `src/core/profiles.ts` | 补充 `propose` 到 `ALL_WORKFLOWS`，新增 `ALL_GLOBAL_SKILLS` 常量（15 个字符串） |
| `src/core/shared/skill-generation.ts` | `SkillTemplateEntry.workflowId` 改为 `WorkflowId?`；新增 `allGlobalEntries` 占位数组；新增 `isWorkflowEntry`/`isGlobalEntry`；修改 `getSkillTemplates()` 双通道合并；修改 `getManagedWorkspaceSkillEntries()` 过滤 |
| `src/core/shared/tool-detection.ts` | `SKILL_NAMES` 拆分为 `WORKFLOW_SKILL_NAMES` + `GLOBAL_SKILL_NAMES`；导出新常量 |
| `src/core/shared/index.ts` | 导出 `WORKFLOW_SKILL_NAMES`, `GLOBAL_SKILL_NAMES` |
| `src/core/templates/skill-templates.ts` | 新增 14 个 export 语句（feedback 已有 export，保持） |
| `src/core/workspace/skills.ts` | `getManagedWorkspaceSkillEntries()` 过滤 `isWorkflowEntry`；附属文件复制逻辑（同目录非 `.ts` 文件） |

### 6.3 不变文件

| 文件 | 原因 |
|------|------|
| `ALL_WORKFLOWS` / `CORE_WORKFLOWS` | 保持 11/5 个，不加入方法论技能 |
| `WORKFLOW_TO_SKILL_DIR` (init.ts, profile-sync-drift.ts) | 保持 11 个 key |
| `COMMAND_IDS` | 方法论技能无命令行 |
| 原有 11 个 TS 模板文件 | 已有 `apeworkflow-` 前缀，不变 |

## 7. 技能模板文件格式

```typescript
// 小技能（≤200 行）：内联 return
export function getBrainstormingSkillTemplate(): SkillTemplate {
  return {
    name: 'apeworkflow-brainstorming',
    description: 'You MUST use this before any creative work...',
    instructions: `# Brainstorming Ideas Into Designs
...
    `,
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}

// 大技能（>200 行）：独立函数提取 instructions
export function getTestDrivenDevelopmentSkillTemplate(): SkillTemplate {
  return {
    name: 'apeworkflow-test-driven-development',
    description: 'Use when implementing any feature or bugfix...',
    instructions: getTestDrivenDevelopmentInstructions(),
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}

function getTestDrivenDevelopmentInstructions(): string {
  return `Write the test first. Watch it fail. Write minimal code to pass.
...
`;
}
```

## 8. superpowers → apeworkflow 映射表

所有 superpowers 原始引用必须转换，抹掉 superpowers 痕迹：

### 维度 A: superpowers:<skill-name> 引用（17 处）

```
superpowers:test-driven-development          →  apeworkflow-test-driven-development
superpowers:using-git-worktrees              →  apeworkflow-using-git-worktrees
superpowers:writing-plans                    →  apeworkflow-writing-plans
superpowers:finishing-a-development-branch   →  apeworkflow-finishing-a-development-branch
superpowers:requesting-code-review           →  apeworkflow-requesting-code-review
superpowers:executing-plans                  →  apeworkflow-executing-plans
superpowers:subagent-driven-development      →  apeworkflow-subagent-driven-development
superpowers:systematic-debugging             →  apeworkflow-systematic-debugging
superpowers:verification-before-completion   →  apeworkflow-verification-before-completion
```

影响技能：executing-plans(4), subagent-driven-dev(6), systematic-debugging(3), writing-plans(3), receiving-code-review(1), writing-skills(2)

### 维度 B: 路径中的 superpowers（7 处）

```
docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md  →  apeworkflow/specs/YYYY-MM-DD-<topic>-design.md
docs/superpowers/plans/<filename>.md  →  apeworkflow/changes/<name>/plans/[序号]<filename>.md
```

影响技能：brainstorming(2), writing-plans(3), subagent-driven-dev(1), requesting-code-review(1)

### 维度 C: ~/.config/superpowers/ 路径引用（4 处）

```
~/.config/superpowers/worktrees/ → 删除或替换为通用描述
```

影响技能：finishing-a-development-branch(2), using-git-worktrees(2)

### 维度 D: 文本中的 "Superpowers"（5 处）

```
"Superpowers works much better with subagent support"  →  "This works much better with subagent support"
"Superpowers created this worktree — we own cleanup"   →  "This worktree was created by the skill — clean it up"
```

影响技能：executing-plans(1), finishing-a-development-branch(2)

### 维度 E: using-superpowers 技能改名

```
name: using-superpowers        →  name: apeworkflow-using-skills
技能文件路径：using-superpowers/  →  using-skills/
```

### 维度 F: 附属文件路径引用（简化）

```
skills/brainstorming/visual-companion.md  →  brainstorming/visual-companion.md
./implementer-prompt.md                  →  apeworkflow-subagent-driven-development/implementer-prompt.md
elements-of-style:writing-clearly        →  删除（该技能不存在，加注释）
```

## 9. 附属文件策略

### 存储位置

附属文件与 TS 模板放同目录 `src/core/templates/workflows/<dirName>/`，保持原始子目录结构。

### 复制逻辑

`generateWorkspaceAgentSkills()` 生成 SKILL.md 后，遍历源目录下所有非 `.ts` 文件，按子目录结构复制到目标技能目录。

### SKILL.md 中路径引用

转换后 SKILL.md 引用附属文件时，使用**相对于技能根目录**的路径：

```markdown
<!-- 原始 -->
skills/brainstorming/visual-companion.md
<!-- 转换后 -->
brainstorming/visual-companion.md
```

生成的技能目录结构：

```
~/.claude/skills/apeworkflow-brainstorming/
├── SKILL.md
├── brainstorming/
│   └── visual-companion.md
├── scripts/
│   └── plan-document-reviewer-prompt.md
└── spec-document-reviewer-prompt.md
```

### 附属文件映射表

| 技能 | 附属文件 |
|------|---------|
| brainstorming | `brainstorming/visual-companion.md`, `scripts/*`, `spec-document-reviewer-prompt.md` |
| requesting-code-review | `code-reviewer.md` |
| subagent-driven-development | `implementer-prompt.md`, `spec-reviewer-prompt.md`, `code-quality-reviewer-prompt.md` |
| systematic-debugging | 10 个文件 (*.md, *.ts, *.sh) |
| test-driven-development | `testing-anti-patterns.md` |
| writing-plans | `plan-document-reviewer-prompt.md` |
| writing-skills | `anthropic-best-practices.md`, `examples/*`, `graphviz-conventions.dot`, `persuasion-principles.md`, `render-graphs.js`, `testing-skills-with-subagents.md` |
| using-skills | `references/copilot-tools.md`, `codex-tools.md`, `gemini-tools.md` |

## 10. 设计决策记录

### 决策 1：用 `workflowId` 区分，不加 `scope` 字段

现有 11 个工作流条目已有 `workflowId`，新增 15 个不加 `workflowId`。用 `workflowId !== undefined` 判断比新增 `scope` 字段更自然，不需要修改现有代码。

### 决策 2：抹掉所有 superpowers 痕迹

直接修改 14 个技能文件中的 superpowers 引用为 `apeworkflow-` 或通用描述。不做渐进式兼容。

### 决策 3：附属文件与模板放同目录

构建时自动复制到 `dist/core/templates/workflows/`，npm publish 自动包含。省去 `copyAttachedFiles()` 整个运行时函数和硬编码映射。

### 决策 4：`feedback.ts` 接入管线

命令已存在（`src/commands/feedback.ts`），技能是配套的引导式技能。作为第 15 个全局技能注册，使命令+技能配套完整。

### 决策 5：`propose` 修复

`ALL_WORKFLOWS` 缺少 `propose`（但 `COMMAND_IDS` 和 `skill-generation.ts` 都有），是 pre-existing bug。本次一并修复：补充 `propose` 到 `ALL_WORKFLOWS`，更新 `WorkflowId` 字面量类型。

## 11. 转换流程（自动化 + 手动）

**自动处理步骤：**
1. 读取原始 SKILL.md（14 个文件）
2. 解析 YAML frontmatter（`---` 分隔符之间）
3. 提取 body（frontmatter 之后的内容）
4. 执行 superpowers→apeworkflow 替换（37+ 处，按维度 A-F 映射表）
5. name 加 `apeworkflow-` 前缀
6. body 中 `` ` ``→`` \` ``, `${`→`$\{`
7. 生成 TS 代码框架（小文件内联 / 大文件函数式）

**手动处理步骤：**
1. 审查反引号转义完整性
2. 确认 superpowers 引用全部替换
3. 确认大文件使用独立函数模式
4. 运行 `pnpm run build` 编译
5. 运行 `pnpm test` 验证
6. 抽样验证生成内容正确性

## 12. 验收标准

### AC1: 常量定义
- [ ] `ALL_WORKFLOWS` 11 个（含 propose），`CORE_WORKFLOWS` 5 个不变
- [ ] `ALL_GLOBAL_SKILLS` 15 个
- [ ] `SKILL_NAMES` 26 个
- [ ] `WORKFLOW_TO_SKILL_DIR` 保持 11 个 key

### AC2: SkillTemplateEntry 扩展
- [ ] `workflowId` 类型为字面量 `WorkflowId` 且可选
- [ ] `isWorkflowEntry` / `isGlobalEntry` helper 函数正确

### AC3: getSkillTemplates 双通道
- [ ] 无 filter 返回 26 个
- [ ] 有 filter 返回 `filter匹配数 + 15`

### AC4: 技能生成
- [ ] 全部 26 个技能的 SKILL.md 生成成功
- [ ] 所有新技能 name 带 `apeworkflow-` 前缀
- [ ] 内容中无残留 superpowers 引用

### AC5: 技能清理
- [ ] profile 切换不会清理全局技能

### AC6: Profile UI 不膨胀
- [ ] `apeworkflow config profile` 只显示 11 个工作流技能

### AC7: 附属文件
- [ ] 8 个有附属文件的技能正确复制附属文件

### AC8: 测试通过
- [ ] `pnpm run build` 编译通过
- [ ] `pnpm test` 现有测试全部通过
