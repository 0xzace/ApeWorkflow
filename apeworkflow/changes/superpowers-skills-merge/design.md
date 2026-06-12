# Design: Merge superpowers-5.1.0 Skills as TypeScript Templates

## Architecture

### 双通道技能管线

```
┌─────────────────────────────────────────────────────────────┐
│  ApeWorkflow Skill 生成管线（合并后）                         │
│                                                             │
│  apeworkflow update / workspace update                     │
│           │                                                 │
│  ┌────────┴────────┐                                        │
│  │ 通道 1: 工作流技能  │  通道 2: 全局技能                      │
│  │  (11 个)         │  (14 个)                               │
│  │                 │                                        │
│  │ ALL_WORKFLOWS  │  ALL_GLOBAL_SKILLS                      │
│  │ ↓ 按 profile    │  ↓ 无条件                                │
│  │ getSkillTempl.  │  getSkillTempl.                         │
│  └────────┬────────┘  └─────────────────────────────────────┘
│           │            │                                      │
│           └────────────┼──────────────────────────────────────┘
│                        │                                      │
│              ┌─────────┴──────────┐                          │
│              │ getSkillTemplates()│                          │
│              │ 返回 25 个技能条目   │                          │
│              └─────────┬──────────┘                          │
│                        │                                      │
│              ┌─────────┴──────────┐                          │
│              │ generateWorkspace  │                          │
│              │ AgentSkills()      │                          │
│              │ generate all 25 →  │                            │
│              │ ~/.claude/skills/  │                          │
│              └────────────────────┘                          │
│                                                              │
│  清理路径:                                                   │
│  removeManagedWorkflowSkillDirs()                            │
│    → 只处理 workflowId !== undefined 的条目                   │
│    → 全局技能（无 workflowId）永远不会被清理                  │
└─────────────────────────────────────────────────────────────┘
```

### 核心常量

```
ALL_WORKFLOWS        = 11 个（不变，工作流技能）
ALL_GLOBAL_SKILLS    = 14 个（新增，方法论技能）

WORKFLOW_SKILL_NAMES = 11 个（工作流技能的 dirName 列表）
GLOBAL_SKILL_NAMES   = 14 个（全局技能的 dirName 列表）
SKILL_NAMES          = [...WORKFLOW_SKILL_NAMES, ...GLOBAL_SKILL_NAMES] = 25 个

WORKFLOW_TO_SKILL_DIR  = 11 个 key（不变，工作流 → 目录名映射）
```

### 技能清单

```
工作流技能（11 个，随 profile）:
  apeworkflow-explore, apeworkflow-new-change, apeworkflow-continue-change,
  apeworkflow-apply-change, apeworkflow-ff-change, apeworkflow-sync-specs,
  apeworkflow-archive-change, apeworkflow-bulk-archive-change,
  apeworkflow-verify-change, apeworkflow-onboard, apeworkflow-propose

全局技能（14 个，始终存在）:
  apeworkflow-brainstorming, apeworkflow-dispatching-parallel-agents,
  apeworkflow-executing-plans, apeworkflow-finishing-a-development-branch,
  apeworkflow-receiving-code-review, apeworkflow-requesting-code-review,
  apeworkflow-subagent-driven-development, apeworkflow-systematic-debugging,
  apeworkflow-test-driven-development, apeworkflow-using-git-worktrees,
  apeworkflow-using-skills, apeworkflow-verification-before-completion,
  apeworkflow-writing-plans, apeworkflow-writing-skills
```

## 类型设计

### SkillTemplateEntry（修改）

```typescript
// 现有接口，新增 workflowId 变为可选
interface SkillTemplateEntry {
  template: SkillTemplate;
  dirName: string;
  workflowId?: string;  // 工作流技能有，全局技能无

  // ⚠️ 不新增 scope 字段 — 用 workflowId 做天然区分
  // 现有 11 个条目已有 workflowId，新增 14 个不加 workflowId = 全局技能
}

function isWorkflowEntry(e: SkillTemplateEntry): boolean {
  return e.workflowId !== undefined;
}
function isGlobalEntry(e: SkillTemplateEntry): boolean {
  return e.workflowId === undefined;
}
```

### SKILL_NAMES 拆分

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
] as const;

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
] as const;

// 向后兼容
export const SKILL_NAMES = [...WORKFLOW_SKILL_NAMES, ...GLOBAL_SKILL_NAMES] as const;
export type SkillName = (typeof SKILL_NAMES)[number];
```

### getSkillTemplates() 双通道实现

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
- 无 filter 时返回 25 个；有 filter 时返回 `filter匹配数 + 14`
- `init.ts` 调用 `getSkillTemplates(workflows)` 时自动获得 25 个技能
- `generateWorkspaceAgentSkills()` 调用 `getSkillTemplates(profileIds)` 时也获得 25 个

### removeManagedWorkspaceSkillEntries() 过滤

```typescript
function getManagedWorkspaceSkillEntries(): Array<{ workflowId: string; dirName: string }> {
  return getSkillTemplates()
    .filter(isWorkflowEntry)  // 只保留有 workflowId 的条目
    .map(({ workflowId, dirName }) => ({ workflowId, dirName }));
}
```

这确保全局技能永远不会被清理。

## 文件新增清单

### 新增文件（15 个）

```
src/core/templates/workflows/          ← 新增 14 个 TS 模板
├── apeworkflow-brainstorming.ts                   ← ~180 行
├── apeworkflow-dispatching-parallel-agents.ts     ← ~200 行
├── apeworkflow-executing-plans.ts                 ← ~78 行
├── apeworkflow-finishing-a-development-branch.ts  ← ~280 行
├── apeworkflow-receiving-code-review.ts           ← ~236 行
├── apeworkflow-requesting-code-review.ts          ← ~115 行
├── apeworkflow-subagent-driven-development.ts     ← ~310 行
├── apeworkflow-systematic-debugging.ts            ← ~328 行
├── apeworkflow-test-driven-development.ts         ← ~412 行（函数式）
├── apeworkflow-using-git-worktrees.ts             ← ~238 行
├── apeworkflow-using-skills.ts                    ← ~130 行（原 using-superpowers）
├── apeworkflow-verification-before-completion.ts  ← ~154 行
├── apeworkflow-writing-plans.ts                   ← ~169 行
└── apeworkflow-writing-skills.ts                  ← ~730 行（函数式）

src/core/templates/assets/             ← 附属文件（npm 包分发）
├── brainstorming/
│   ├── scripts/visual-companion.md
│   ├── scripts/plan-document-reviewer-prompt.md
│   └── spec-document-reviewer-prompt.md
├── requesting-code-review/
│   └── code-reviewer.md
├── subagent-driven-development/
│   ├── implementer-prompt.md
│   ├── spec-reviewer-prompt.md
│   └── code-quality-reviewer-prompt.md
├── systematic-debugging/
│   └── (10 个文件: *.md, *.ts, *.sh)
├── test-driven-development/
│   └── testing-anti-patterns.md
├── writing-plans/
│   └── plan-document-reviewer-prompt.md
├── writing-skills/
│   ├── anthropic-best-practices.md
│   ├── examples/
│   ├── graphviz-conventions.dot
│   ├── persuasion-principles.md
│   ├── render-graphs.js
│   └── testing-skills-with-subagents.md
└── using-skills/
    ├── references/copilot-tools.md
    ├── references/codex-tools.md
    └── references/gemini-tools.md
```

### 修改的文件（6 个）

| 文件 | 改动 |
|------|------|
| `src/core/profiles.ts` | 新增 `ALL_GLOBAL_SKILLS` 常量（14 个字符串） |
| `src/core/shared/skill-generation.ts` | `SkillTemplateEntry` 新增 `workflowId?`；新增 `allGlobalEntries` 占位数组；`getSkillTemplates()` 双通道合并 |
| `src/core/shared/tool-detection.ts` | `SKILL_NAMES` 拆分为 `WORKFLOW_SKILL_NAMES` + `GLOBAL_SKILL_NAMES`；`getToolSkillStatus()` 基于全量 `SKILL_NAMES` |
| `src/core/shared/index.ts` | 导出 `WORKFLOW_SKILL_NAMES`, `GLOBAL_SKILL_NAMES` |
| `src/core/templates/skill-templates.ts` | 新增 14 个 export 语句 |
| `src/core/workspace/skills.ts` | `getManagedWorkspaceSkillEntries()` 过滤 `isWorkflowEntry`；附属文件复制逻辑 |

### 不变的文件

| 文件 | 原因 |
|------|------|
| `ALL_WORKFLOWS` / `CORE_WORKFLOWS` | 保持 11/5 个，不加入方法论技能 |
| `WORKFLOW_TO_SKILL_DIR` (init.ts, profile-sync-drift.ts) | 保持 11 个 key |
| `COMMAND_IDS` | 方法论技能无命令行 |
| `src/commands/workflow/instructions.ts` | 无 superpowers 引用 |
| `src/core/init.ts` | `WORKFLOW_TO_SKILL_DIR` 只有 11 个 key，全局技能通过 `getSkillTemplates()` 自然加入 |
| `src/core/profile-sync-drift.ts` | `WORKFLOW_TO_SKILL_DIR` 只有 11 个 key，全局技能不参与 profile 漂移 |

## 模板文件格式

```typescript
// 小技能（≤200 行 Markdown 正文）：内联 return
export function getBrainstormingSkillTemplate(): SkillTemplate {
  return {
    name: 'apeworkflow-brainstorming',
    description: 'You MUST use this before any creative work...',
    instructions: `Help turn ideas into fully formed designs and specs through natural collaborative dialogue.
...
    `,
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}

// 大技能（>200 行 Markdown 正文）：独立函数（与 onboard.ts 风格一致）
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

### 大技能阈值

| 文件 | Markdown 正文行数 | 模式 |
|------|-------------------|------|
| brainstorming | ~164 | 内联 |
| dispatching-parallel-agents | ~182 | 内联（临界，但 ≤200） |
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

## superpowers → apeworkflow 映射表

所有 superpowers 原始引用必须转换，抹掉 superpowers 痕迹：

```
──────────────────────────────────────────────────────────────────────
维度 A: superpowers:<skill-name> 引用（17 处）
──────────────────────────────────────────────────────────────────────
  superpowers:test-driven-development          →  apeworkflow-test-driven-development
  superpowers:using-git-worktrees              →  apeworkflow-using-git-worktrees
  superpowers:writing-plans                    →  apeworkflow-writing-plans
  superpowers:finishing-a-development-branch   →  apeworkflow-finishing-a-development-branch
  superpowers:requesting-code-review           →  apeworkflow-requesting-code-review
  superpowers:executing-plans                  →  apeworkflow-executing-plans
  superpowers:subagent-driven-development      →  apeworkflow-subagent-driven-development
  superpowers:systematic-debugging             →  apeworkflow-systematic-debugging
  superpowers:verification-before-completion   →  apeworkflow-verification-before-completion

  影响技能文件：executing-plans(4), subagent-driven-dev(6), systematic-debugging(3),
               writing-plans(3), receiving-code-review(1), writing-skills(2)

──────────────────────────────────────────────────────────────────────
维度 B: 路径中的 superpowers（7 处）
──────────────────────────────────────────────────────────────────────
  docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md  →  apeworkflow/specs/YYYY-MM-DD-<topic>-design.md
  docs/superpowers/plans/<filename>.md  →  apeworkflow/changes/<name>/plans/[序号]<filename>.md

  影响技能文件：brainstorming(2), writing-plans(3), subagent-driven-dev(1),
               requesting-code-review(1)

──────────────────────────────────────────────────────────────────────
维度 C: ~/.config/superpowers/ 路径引用（4 处）
──────────────────────────────────────────────────────────────────────
  ~/.config/superpowers/worktrees/ → 本地 .worktrees/ 目录（优先策略已存在）

  影响技能文件：finishing-a-development-branch(2), using-git-worktrees(2)

──────────────────────────────────────────────────────────────────────
维度 D: 文本中的 "Superpowers"（5 处）
──────────────────────────────────────────────────────────────────────
  "Superpowers works much better with subagent support"  →  "This works much better with subagent support"
  "Superpowers created this worktree — we own cleanup"   →  "This worktree was created by the skill — clean it up"

  影响技能文件：executing-plans(1), finishing-a-development-branch(2)

──────────────────────────────────────────────────────────────────────
维度 E: using-superpowers 技能改名
──────────────────────────────────────────────────────────────────────
  name: using-superpowers        →  name: apeworkflow-using-skills
  技能文件路径：using-superpowers/  →  using-skills/

  影响技能文件：using-superpowers(1), 以及所有引用它的技能

──────────────────────────────────────────────────────────────────────
维度 F: 附属文件路径引用（简化）
──────────────────────────────────────────────────────────────────────
  skills/brainstorming/visual-companion.md  →  brainstorming/visual-companion.md
  requesting-code-review/code-reviewer.md  →  不变（同技能目录内）
  ./implementer-prompt.md                  →  apeworkflow-subagent-driven-development/implementer-prompt.md
  elements-of-style:writing-clearly        →  注释（该技能不存在）

  影响技能文件：brainstorming(1), subagent-driven-dev(1)
```

## 附属文件策略（方案 C）

### 存储位置

附属文件打包进 npm 包：

```
package.json → files: ["dist", ...]
dist/assets/skills/ → 附属文件根目录
```

构建后路径：
```
dist/assets/skills/brainstorming/scripts/visual-companion.md
dist/assets/skills/subagent-driven-development/implementer-prompt.md
```

### 生成管线

```
generateWorkspaceAgentSkills() {
  for each tool {
    for each { template, dirName } in skillTemplates {
      // 1. 生成 SKILL.md
      write SKILL.md to: skillsDir/dirName/SKILL.md

      // 2. 复制附属文件（如果有）
      if (attachedFiles[dirName]) {
        copy from dist/assets/skills/dirName/*
            to  skillsDir/dirName/（按子目录结构）
      }
    }
  }
}
```

### 附属文件映射表

| 技能 | 附属文件源路径 | 复制目标目录 |
|------|--------------|------------|
| brainstorming | `assets/brainstorming/scripts/*`, `assets/brainstorming/*.md` | `skillsDir/apeworkflow-brainstorming/scripts/` + `skillsDir/apeworkflow-brainstorming/` |
| requesting-code-review | `assets/requesting-code-review/code-reviewer.md` | `skillsDir/apeworkflow-requesting-code-review/` |
| subagent-driven-development | `assets/subagent-driven-development/*.md` | `skillsDir/apeworkflow-subagent-driven-development/` |
| systematic-debugging | `assets/systematic-debugging/*` (10 files) | `skillsDir/apeworkflow-systematic-debugging/` |
| test-driven-development | `assets/test-driven-development/testing-anti-patterns.md` | `skillsDir/apeworkflow-test-driven-development/` |
| writing-plans | `assets/writing-plans/plan-document-reviewer-prompt.md` | `skillsDir/apeworkflow-writing-plans/` |
| writing-skills | `assets/writing-skills/*` + `assets/writing-skills/examples/*` | `skillsDir/apeworkflow-writing-skills/` + `examples/` |
| using-skills | `assets/using-skills/references/*` | `skillsDir/apeworkflow-using-skills/references/` |

### SKILL.md 中的路径引用

生成的 SKILL.md 中引用附属文件时，使用相对于技能目录的路径：

```markdown
<!-- 原始 SKILL.md 中 -->
Read skills/brainstorming/visual-companion.md for the visual companion process.

<!-- 转换后 -->
Read brainstorming/visual-companion.md for the visual companion process.
```

因为生成的 SKILL.md 位于 `skillsDir/apeworkflow-brainstorming/SKILL.md`，所以 `brainstorming/visual-companion.md` 解析为 `skillsDir/apeworkflow-brainstorming/brainstorming/visual-companion.md`。

不对，需要重新考虑路径。生成的 SKILL.md 位于技能根目录，附属文件也位于技能目录下：

```
~/.claude/skills/apeworkflow-brainstorming/
├── SKILL.md
├── visual-companion.md              ← 从 assets 复制到这里
└── scripts/
    └── visual-companion.md          ← 如果 assets 有 scripts/ 子目录
```

SKILL.md 中的引用：
```markdown
<!-- 原始 -->
skills/brainstorming/visual-companion.md
<!-- 转换 -->
skills/visual-companion.md           ← 相对于技能根目录
```

不，更简单的做法：附属文件直接平铺在技能目录或子目录，SKILL.md 中的引用用相对于技能根目录的路径。

```
~/.claude/skills/apeworkflow-brainstorming/
├── SKILL.md
└── visual-companion.md

SKILL.md 引用: visual-companion.md
```

```
~/.claude/skills/apeworkflow-subagent-driven-development/
├── SKILL.md
├── implementer-prompt.md
├── spec-reviewer-prompt.md
└── code-quality-reviewer-prompt.md

SKILL.md 引用: implementer-prompt.md
```

这样最简单。所有附属文件平铺在技能根目录，SKILL.md 中的引用也用相对于技能根目录的路径。

## 关键设计决策记录

### 决策 1：用 `workflowId` 区分，不加 `scope` 字段

**原因：** 现有 11 个工作流条目已有 `workflowId`，新增 14 个全局技能不加 `workflowId`。用 `workflowId !== undefined` 判断比新增 `scope` 字段更自然，不需要修改现有代码。

### 决策 2：抹掉所有 superpowers 痕迹

**做法：** 直接修改 14 个技能文件中的 superpowers 引用为 apeworkflow- 或通用描述。不做渐进式兼容。

**理由：** 干净融入，不遗留任何超 powers 影子。

### 决策 3：附属文件方案 C（已更新 → 见决策 8）

> **决策 8 已取代本决策。** 附属文件不再放在独立的 `assets/` 目录，改为与 TS 模板放同目录（`workflows/<dirName>/`）。
>
> 保留此条目仅作为设计历史参考。

### 决策 4：frontmatter 处理

```markdown
<!-- 原始 SKILL.md -->
---
name: brainstorming
description: "You MUST use this..."
---

# Brainstorming Ideas Into Designs
...
```

**转为 TS：**
```typescript
{
  name: 'apeworkflow-brainstorming',                    // ← 加前缀
  description: 'You MUST use this...',                  // ← 从 frontmatter 提取
  instructions: `# Brainstorming Ideas Into Designs\n...`,
  metadata: { author: 'apeworkflow', version: '1.0' },  // ← 统一风格
}
```

**注意事项：**
- 原始 description 值中的双引号需转义
- 原始 instructions 中的 `` ` `` 转义为 `` \` ``
- 原始 instructions 中的 `${` 转义为 `$\{`

### 决策 5：方法论技能作为全局技能独立管理

```
工作流技能 (11 个)：
  - 有 workflowId
  - 有 /ape:* 命令行
  - 随 profile 启用/禁用
  - WORKFLOW_TO_SKILL_DIR 映射

全局技能 (14 个)：
  - 无 workflowId
  - 无命令行
  - 始终存在，不受 profile 影响
  - 通过 getSkillTemplates() 全量返回
```

**不在 ALL_WORKFLOWS 中加 14 个的原因：**
1. 方法论技能没有命令行，不属于 workflow 概念
2. `config profile` 命令只展示工作流技能，不应膨胀
3. profile 切换不应影响全局技能的增删
4. 分离后未来可扩展：方法论技能也可按子 profile 过滤

### 决策 6：metadata 字段统一

所有新技能模板添加统一 metadata：
```typescript
metadata: { author: 'apeworkflow', version: '1.0' }
```

生成的 SKILL.md 包含（由 `generateSkillContent()` 自动添加）：
```yaml
---
name: apeworkflow-brainstorming
description: "You MUST use this..."
license: MIT
compatibility: Requires apeworkflow CLI.
metadata:
  author: apeworkflow
  version: "1.0"
  generatedBy: "1.0.0"
---
```

### 决策 7：`GLOBAL_SKILL_MAP` 不需要

不需要额外的映射表。`getSkillTemplates()` 返回的条目已经包含 `dirName`，技能生成管线直接用 `entry.dirName` 创建目录。

### 决策 8：附属文件与模板放同目录（方案 9）

**做法：** 附属文件直接从 `src/core/templates/assets/<skillName>/` 搬到 `src/core/templates/workflows/<dirName>/` 同级目录。
删除整个 `src/core/templates/assets/` 层。

```
src/core/templates/workflows/
├── apeworkflow-brainstorming.ts
├── visual-companion.md              ← 附属文件
├── scripts/
│   └── plan-document-reviewer-prompt.md
├── apeworkflow-subagent-driven-development.ts
├── implementer-prompt.md
└── ...
```

**复制逻辑：** 不再需要运行时 `copyAttachedFiles()` 函数。
`generateWorkspaceAgentSkills()` 在生成 SKILL.md 后，用 `cp -r {workflowsDir}/{dirName}/* {skillsDir}/{dirName}/` 把同目录下的附属文件一起复制过去。

**为什么：**
- 设计文档中附属文件路径策略反复修改了 3 次（`design.md:422-463`），说明 `dist/assets/` 解包逻辑是多余的中间层
- 附属文件本质上是 SKILL.md 的一部分，同目录存储天然一致
- 构建时自动复制到 `dist/core/templates/workflows/`，npm publish 自动包含
- 省去 `copyAttachedFiles()` 整个运行时函数和硬编码映射

**影响文件变动：**
- 修改的文件从 6 个变为 **5 个**（删 `skills.ts` 中的附属文件复制逻辑，增加同目录复制逻辑）
- 新增的文件从 15 个变为 **15 个**（14 个 TS 模板 + 附属文件与模板放同一目录）
- 删除 `src/core/templates/assets/` 目录（不需要了）

### 决策 9：workflowId 使用字面量类型

**做法：** `SkillTemplateEntry` 的 `workflowId` 从 `string` 改为 `WorkflowId` 字面量联合类型：

```typescript
type WorkflowId = 'explore' | 'new' | 'continue' | 'apply' | 'ff' | 'sync'
  | 'archive' | 'bulk-archive' | 'verify' | 'onboard' | 'propose';

interface SkillTemplateEntry {
  template: SkillTemplate;
  dirName: string;
  workflowId: WorkflowId;  // 不是 string
}
```

**为什么：**
- 新增技能时打错 workflowId 字母，编译期就会报错而非运行时静默失败
- `getSkillTemplates(workflowFilter)` 的 filter 参数可以用 `readonly WorkflowId[]` 精确类型
- 零成本高回报

### 决策 10：feedback.ts 删除

**做法：** 删除 `src/core/templates/workflows/feedback.ts` 和对应的 `skill-templates.ts` export。

**为什么：**
- 已创建但从未接入任何管线（不在 `getSkillTemplates()` 数组、不在 `SKILL_NAMES`、没有调用方）
- 是孤儿代码，增加认知负担
- 如果未来需要，`git log` 中可以找到

### 决策 11：本次不做 Registry 重构

**做法：** 现有 11 个工作流技能的硬编码数组保持不变。14 个新技能也按同样模式硬编码。

**为什么：**
- 本次目标是"先融进来"，不是"重构管线"
- 14 个一次性导入的技能不值得为它们重构现有 11 个技能的数组
- 重构工作量不小且易引入回归 bug，后续另起 change 做

### 决策 12：init.ts cleanup 加安全守卫

**做法：** 在 `init.ts` 的 `removeSkillDirs()` 中增加 `isApeWorkflowManagedSkillDir()` 检查，与 `skills.ts` 的 `removeManagedWorkflowSkillDirs()` 行为一致。

**不做全局提取：** 直接修改 `init.ts` 中一处检查即可，不需要提取 shared 函数。

**为什么：** 这是一个真实的安全漏洞——当前 `init.ts` 无条件删除目录，不检查是否 ApeWorkflow 生成。合并后影响面更大。改动小（加一个检查），风险低。

## 转换流程（自动化 + 手动）

**自动处理步骤：**
1. 读取原始 SKILL.md（14 个文件）
2. 解析 YAML frontmatter（`---` 分隔符之间）
3. 提取 body（frontmatter 之后的内容）
4. 执行 superpowers → apeworkflow 替换（37 处）
5. name 加 `apeworkflow-` 前缀
6. body 中 `` ` `` → `` \` ``, `${` → `$\{`
7. 生成 TS 代码框架（小文件内联 / 大文件函数式）

**手动处理步骤：**
1. 审查反引号转义完整性
2. 确认 superpowers 引用全部替换
3. 确认大文件使用独立函数模式
4. 运行 `pnpm run build` 编译
5. 运行 `pnpm test` 验证
6. 抽样验证生成内容正确性

## 影响文件汇总

```
需新增的文件（15 个）：
  src/core/templates/workflows/apeworkflow-*.ts（14 个 TS 模板）
  src/core/templates/workflows/<dirName>/*.附属文件（8 个技能的附属文件，与模板同级）

需修改的文件（6 个 → 含以下新决策）：
  src/core/profiles.ts              ← 新增 ALL_GLOBAL_SKILLS
  src/core/shared/skill-generation.ts ← 双通道逻辑 + workflowId 字面量类型
  src/core/shared/tool-detection.ts  ← SKILL_NAMES 拆分
  src/core/shared/index.ts           ← 导出新常量
  src/core/templates/skill-templates.ts ← 14 个 export + 删除 feedback.ts export
  src/core/workspace/skills.ts       ← 附属文件同目录复制 + 清理过滤

需删除的文件（1 个）：
  src/core/templates/workflows/feedback.ts    ← 孤儿技能，删除

无需修改的文件（新增）：
  src/core/init.ts          ← 只需在 removeSkillDirs() 加一个 isApeWorkflowManagedSkillDir() 检查
  src/core/profile-sync-drift.ts
  src/commands/workflow/instructions.ts
  原有 11 个 TS 模板文件（已有前缀不变）

不修改：
  src/core/templates/assets/  ← 整个目录不需要了，附属文件与模板放同目录
  现有 11 个技能的硬编码数组 ← 本次不做 Registry 重构
```
