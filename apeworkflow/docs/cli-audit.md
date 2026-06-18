# ApeWorkflow CLI 用户体验问题分析报告

> 生成日期：2026-06-17
> 范围：`.claude/commands/ape/`（8 个命令）、`.claude/skills/`（21 个 Skill）、`src/core/templates/workflows/`（模板源）
> 验证方式：实际调用 CLI、审查源代码、检查文件安装逻辑

---

## 问题总览

| # | 优先级 | 问题 | 影响范围 | 类型 |
|---|--------|------|----------|------|
| 1 | **P0** | Prompt 模板文件未安装，subagent 三层验证不可用 | 所有实现用户 | Bug |
| 2 | **P0** | 命令与 Skill 完全镜像重复 | 所有用户 | 设计 |
| 3 | **P1** | 任务路由中英双语分裂，两套路由永远对不上 | 实现阶段用户 | Bug |
| 4 | **P1** | Verify 的路由表是幻觉，CLI 不返回 | 验证用户 | Bug |
| 5 | **P1** | 变更选择策略矛盾（auto-select vs 必须手动） | 多变更用户 | 设计 |
| 6 | **P1** | Workspace Planning 检测到但不提供任何回退方案 | 多仓库用户 | 设计 |
| 7 | **P1** | 缺少命令发现入口（无 `/ape:help`） | 所有用户 | 缺失 |
| 8 | **P2** | Artifact 链路最小单位过重（7 文件+2 Skill） | 所有用户 | 设计 |
| 9 | **P2** | 归档日期碰撞无自动解决 | 高频用户 | Bug |
| 10 | **P2** | Skill 元循环调用风险 | 所有用户 | 设计 |
| 11 | **P2** | Delta Spec 同步是黑盒体验 | Specs 用户 | 设计 |
| 12 | **P2** | 无成本意识（无 token 消耗预期管理） | 所有用户 | 缺失 |
| 13 | **P3** | 无项目级入口（CLAUDE.md 缺失） | 新加入者 | 缺失 |

---

## P0: 致命

### 1. Prompt 模板文件未安装

**证据链**

`apeworkflow-subagent-driven-development/SKILL.md` 第 130-132 行声明了三个 prompt 模板文件：

```markdown
- `implementer-prompt.md` - Dispatch implementer subagent
- `spec-reviewer-prompt.md` - Dispatch spec compliance reviewer subagent
- `code-quality-reviewer-prompt.md` - Dispatch code quality reviewer subagent
```

但在已安装的 `.claude/skills/apeworkflow-subagent-driven-development/` 目录中，**只有 `SKILL.md` 一个文件**。三个 prompt 文件全部缺失。

**模板源存在，安装逻辑也应复制，但实际未安装**

- 文件存在于源模板目录：`src/core/templates/workflows/apeworkflow-subagent-driven-development/{implementer,spec-reviewer,code-quality-reviewer}-prompt.md`
- 安装逻辑 `skills.ts:293-318` 的 `copyAttachedFiles()` 会复制所有非 `.ts` 文件
- 已安装的 SKILL.md 标记 `generatedBy: "25.6.17.2"`，与 package.json 版本一致，说明安装流程执行过

**Brainstorming 的 visual companion 同样未安装**

- `apeworkflow-brainstorming/SKILL.md` 第 175 行引用 `brainstorming/visual-companion.md`
- 该文件存在于模板源：`src/core/templates/workflows/apeworkflow-brainstorming/visual-companion.md`
- 同样未安装到 `.claude/skills/apeworkflow-brainstorming/`

**用户影响**

用户调用 `/ape:apply` → 进入 subagent-driven-development 流程 → AI 尝试读取不存在的 prompt 文件 → 直接报错或完全跳过 review 环节。subagent 的"三层验证"（implementer + spec reviewer + code reviewer）**不可用**。

同时，`/ape:propose` 的 brainstorming 阶段也无法使用 visual companion，降级行为对用户透明——用户不知道质量降低了。

**根因推测**

`copyAttachedFiles` 的 try-catch 静默吞了错误（`skills.ts:316-318`）：

```typescript
} catch {
  // No attached files or directory doesn't exist — this is fine
}
```

如果目录读取时遇到权限问题、符号链接问题、或 glob 匹配问题，错误被静默吞掉，用户永远不知道文件缺失。

---

### 2. 命令与 Skill 完全镜像重复

**证据链**

`src/core/templates/workflows/apply-change.ts` 最后一行：

```typescript
export function getApeApplyCommandTemplate(): CommandTemplate {
  return {
    name: 'APE: Apply',
    description: '...',
    category: 'Workflow',
    tags: ['workflow', 'artifacts', 'experimental'],
    content: getApplyChangeSkillTemplate().instructions,  // ← 直接引用 Skill 内容
  };
}
```

这意味着：`/ape:apply` 命令内容 = `apeworkflow-apply-change` Skill 内容 = **同一份字符串**。

同样的模式存在于：

| 命令文件 | 对应 Skill | 关系 |
|---------|-----------|------|
| `.claude/commands/ape/apply.md` | `apeworkflow-apply-change/SKILL.md` | 同一份内容 |
| `.claude/commands/ape/archive.md` | `apeworkflow-archive-change/SKILL.md` | 同一份内容 |
| `.claude/commands/ape/explore.md` | `apeworkflow-explore/SKILL.md` | 同一份内容 |
| `.claude/commands/ape/propose.md` | `apeworkflow-propose/SKILL.md` | 高度重叠 |
| `.claude/commands/ape/feedback.md` | `apeworkflow-feedback/SKILL.md` | Skill 是精简版 |

**用户困惑**

```
用户: 我应该用 /ape:apply 还是 Skill: apeworkflow-apply-change？
AI:   没有区别，是同一份内容。
用户: 那为什么有两个？
AI:   一个是 Slash Command 入口，一个是 Skill 入口。功能一样。
```

**元循环调用风险**

`apeworkflow-using-skills` 的规则：

> "Even a 1% chance a skill might apply means that you should invoke the skill to check."

当用户输入 `/ape:apply`：

```
1. AI 加载 .claude/commands/ape/apply.md
2. apply.md 内部说 "用 Skill 工具调用 executing-plans"
3. 但 using-skills 说"先检查有没有 Skill 适用"
4. 检查 → 发现 apply-change 本身也"适用"
5. → 潜在的循环调用
```

实际中，Claude Code 的 skill 加载机制应该会阻止真正的递归，但**语义上是循环的**。

---

## P1: 高

### 3. 任务路由中英双语分裂

**证据链**

通过实际调用 CLI 验证：

```bash
$ apeworkflow instructions apply --change "<name>" --json
```

返回的 `taskTypeRouting`：

```json
{
  "default": ["executing-plans", "test-driven-development", "subagent-driven-development"],
  "taskTypes": {
    "feature": [...],
    "bugfix": [...],
    "refactor": [...],
    "docs": [...]
  }
}
```

但 `apply.md`、`archive.md`、`verify.md` 中内联的硬编码路由表使用的是**中文标签**：

| 硬编码（命令文件） | CLI 实际键名 |
|---|---|
| `功能开发` | `feature` |
| `缺陷修复` | `bugfix` |
| `重构` | `refactor` |
| `文档` | `docs` |

更深层的矛盾：

- `apply.md` 明确说：*"Route selection is controlled by the active schema's taskTypeRouting. **Do not inline a static task route table here.**"*
- 但三条命令（apply/archive/verify）都内联了完全相同的硬编码路由表
- 硬编码的是中文，CLI 返回的是英文

**用户影响**

AI 收到 CLI 返回的 `taskTypes: { feature: [...], bugfix: [...] }`，但命令里写的是"功能开发 → executing-plans → test-driven-development"。两套路由系统**永远对不上**。硬编码的路由表是死代码。

---

### 4. Verify 的路由表是幻觉

**证据链**

实际调用 `apeworkflow instructions verify --json`，返回的 key：

```
['changeName', 'changeDir', 'schemaName', 'contextFiles', 'state',
 'missingArtifacts', 'hasIncompleteTasks', 'instruction']
```

**没有 `taskTypeRouting`**。

源代码 `instructions.ts:542-545`：

```typescript
if (verifyPhase?.taskTypeRouting) {
  // ...
}
```

`spec-driven` 模式的 schema 定义中**没有 `verify` phase 配置**，所以 `verifyPhase` 为 `undefined`，`taskTypeRouting` 永远不返回。

**用户影响**

`verify.md` 第 153-178 行的完整任务类型路由表（功能开发/缺陷修复/重构/文档的 verify 路由链）**完全不可执行**。AI 运行后会发现 CLI 没有返回路由表，这部分逻辑走不通。

---

### 5. 变更选择策略矛盾

**证据链**

| 命令 | 无变更名时行为 | 来源行 |
|------|---------------|--------|
| `/ape:apply` | **Auto-select if only one** | `apply.md:18-19` |
| `/ape:archive` | **Do NOT guess. Always prompt.** | `archive.md:21` |
| `/ape:verify` | **Do NOT guess. Always prompt.** | `verify.md:22` |

同一套操作（选定变更），一个自动选，一个必须手动。

**用户场景**

```
用户: /ape:apply
AI:   Using change: add-auth  (auto-selected, only one active)

用户: /ape:archive
AI:   Which change? [show list with AskUserQuestion]
```

**设计矛盾**：apply 认为"只有一个变更时自动选是合理的"，archive/verify 认为"永远不能猜"。这个分歧没有理由。

---

### 6. Workspace Planning 是死胡同

**证据链**

apply.md、archive.md、verify.md 都有相同的 guard：

```
If status reports actionContext.mode: "workspace-planning" and allowedEditRoots is empty:
  → explain and STOP before editing files.
```

实际测试确认：在 repo-local 模式下，`actionContext` 返回 `mode: "repo-local"`，说明 workspace-planning 是一个**已实现但当前不可用**的路径。

**用户影响**

如果用户在 workspace 模式下触发 `/ape:apply`：

1. AI 检测到 `workspace-planning` + `allowedEditRoots: []`
2. AI 说"不支持"然后停下来
3. **没有回退方案**
4. 用户被困住

---

### 7. 缺少命令发现入口

**证据链**

```
已存在的命令:
  /ape:onboard      新手引导（11 阶段）
  /ape:propose      创建变更
  /ape:explore      探索模式
  /ape:apply        实现变更
  /ape:verify       验证变更
  /ape:archive      归档变更
  /ape:bulk-archive 批量归档
  /ape:feedback     提交反馈

缺失的命令:
  /ape:help         ← 没有命令发现
  /ape:list         ← 没有活跃变更列表
  /ape:status       ← 没有变更状态查看
  /ape:continue     ← 有模板但无命令
  /ape:ff           ← 有模板但无命令
```

CLI 本身有 `apeworkflow show`、`apeworkflow validate`，但没有对应的 slash command。

`src/core/templates/workflows/continue-change.ts` 和 `ff-change.ts` 存在于模板源，但没有对应的 `.claude/commands/ape/` 文件。

---

## P2: 中

### 8. Artifact 链路最小单位过重

**证据链**

实际验证依赖链（`apeworkflow status --json`）：

```
proposal (ready)
  ├── design    → blocked (need: proposal)
  ├── specs     → blocked (need: proposal)
  └── tasks     → blocked (need: proposal)

tasks (done)
  └── plans     → blocked (need: tasks)
```

最小可执行路径：`proposal → tasks → plans`，但 `/ape:propose` 的完整流程：

```
1. apeworkflow new change        → 创建目录
2. apeworkflow status            → 获取构建顺序
3. apeworkflow instructions proposal  → 创建 proposal.md
4. apeworkflow instructions specs     → 创建 specs/
5. apeworkflow instructions design    → 创建 design.md
6. apeworkflow instructions tasks     → 创建 tasks.md
7. ★ Brainstorming Skill             → 润色三个文件
8. ★ Writing-plans Skill             → 生成 plans/
9. /ape:apply                      → 执行
```

**"改个变量名"也需要经过 7 个文件 + 2 个隐式 Skill。**

---

### 9. 归档日期碰撞无自动解决

**证据链**

```bash
mv "<changeRoot>" "<changesDir>/archive/YYYY-MM-DD-<name>"
```

如果当天已有一个同名归档：

- `mv` 失败
- 错误提示："wait until a different date"
- **没有** `YYYY-MM-DD-<name>-2` 或时间戳后缀的自动解决

`archive.md` 给出的选项：
```
1. Rename the existing archive
2. Delete the existing archive if it's a duplicate
3. Wait until a different date to archive
```

全是手动操作。

**高频场景**：用户一天内修复 → 归档 → 发现遗漏 → 重新修复 → 再归档 → **失败**。

---

### 10. Skill 元循环调用风险

**证据链**

`apeworkflow-using-skills` 的规则：

> "Even a 1% chance a skill might apply means that you should invoke the skill to check."

> "Use the relevant process skill first, then implementation skills."

但 `/ape:apply` 本身就是用 Skill 工具调用的，且内部也会调度多个 Skill：

```
/ape:apply (Skill)
  ├── executing-plans (Skill)
  │     └── subagent-driven-development (Skill)
  │           ├── TDD (Skill)
  │           ├── requesting-code-review (Skill)
  │           └── receiving-code-review (Skill)
  └── finishing-a-development-branch (Skill)
```

每层 Skill 都遵循 `using-skills` 的规则"先检查有没有 Skill"。语义上是**嵌套的 Skill 自我检查循环**。

---

### 11. Delta Spec 同步是黑盒体验

**证据链**

`archive.md` 的 delta spec 同步流程：

```
1. 检查是否有 delta specs
2. 对比 main spec，确定 adds/modifications/removals/renames
3. 显示摘要
4. 用户选: "Sync now (recommended)" / "Archive without syncing"
5. 如果 sync → 用 subagent 调用 sync-specs
```

**问题**：

- 用户不理解"delta spec"是什么——没有解释文档
- "Sync now (recommended)" 是推荐但没解释为什么
- 用户大概率永远选 skip，因为他们不知道 skip 的后果
- Bulk archive 的冲突检测更复杂——需要读 delta specs、搜索代码库、判断实现状态，但这些对用户完全不可见

---

### 12. 无成本意识

**证据链**

`subagent-driven-development/SKILL.md` 明确列出了成本：

> **Cost**: More subagent invocations (implementer + 2 reviewers per task)

但没有任何地方：

- 告诉用户"这个操作预计多少 token"
- 给出不同路径的成本对比（subagent-driven vs inline）
- 警告用户"7 个任务 × 3 reviewer = 21 次调用"

`/ape:onboard` 说 "~15-20 minutes"，但没提 token 成本。

---

## P3: 低

### 13. 无项目级入口（CLAUDE.md 缺失）

**证据链**

```bash
$ ls CLAUDE.md
# 不存在
```

Skills 和 Commands 只在对 AI 可见的 `.claude/` 目录中，人类用户看不到。

`apeworkflow init --tools claude` 会安装 skills，但不会创建 CLAUDE.md 来说明"这是什么"。

**影响**：

- 新加入开发者不知道这里使用 ApeWorkflow
- 团队中用 VS Code / Copilot 的同事没有入口了解工作流
- 没有任何 markdown 文档说明"ApeWorkflow 是什么"

---

## 附录 A: 已验证的技术事实

### 模板文件安装逻辑

```typescript
// src/core/workspace/skills.ts:293-318
async function copyAttachedFiles(sourceWorkflowsDir, targetSkillDir, dirName) {
  const srcDir = path.join(sourceWorkflowsDir, dirName);
  // Skip only skill template TS files (the skill definition itself)
  if (/^apeworkflow-.*\.ts$/.test(entry.name)) continue;
  // Copy everything else
  await fs.copyFile(srcPath, dstPath);
} catch {
  // No attached files — this is fine  ← 静默吞错
}
```

### 命令-Skill 镜像关系

```typescript
// src/core/templates/workflows/apply-change.ts (最后)
export function getApeApplyCommandTemplate(): CommandTemplate {
  return {
    ...
    content: getApplyChangeSkillTemplate().instructions,  // ← 直接复用
  };
}
```

### CLI 任务路由实际返回

```json
{
  "taskTypeRouting": {
    "default": ["executing-plans", "test-driven-development", "subagent-driven-development"],
    "taskTypes": {
      "feature": ["executing-plans", "test-driven-development", "subagent-driven-development"],
      "bugfix": ["systematic-debugging", "test-driven-development", "executing-plans"],
      "refactor": ["executing-plans", "test-driven-development", "subagent-driven-development"],
      "docs": ["writing-skills"]
    }
  }
}
```

### CLI 依赖图

```
artifact 依赖链 (spec-driven):
  proposal ──▶ design
  proposal ──▶ specs
  proposal ──▶ tasks ──▶ plans  ← applyRequires: plans

schema:
  - spec-driven       (proposal → specs → design → tasks → plans)
  - workspace-planning (相同结构，不同 actionContext)
```

### 安装文件清单

```
.claude/commands/ape/ (8 个):
  apply.md, archive.md, bulk-archive.md, explore.md,
  feedback.md, onboard.md, propose.md, verify.md

.claude/skills/ (21 个):
  apply-change, archive-change, brainstorming, dispatching-parallel-agents,
  executing-plans, explore, feedback, finishing-a-development-branch,
  propose, receiving-code-review, requesting-code-review,
  subagent-driven-development, sync-specs, systematic-debugging,
  test-driven-development, using-git-worktrees, using-skills,
  verification-before-completion, writing-plans, writing-skills

缺失的已安装文件 (模板存在但未安装):
  - apeworkflow-subagent-driven-development/implementer-prompt.md
  - apeworkflow-subagent-driven-development/spec-reviewer-prompt.md
  - apeworkflow-subagent-driven-development/code-quality-reviewer-prompt.md
  - apeworkflow-brainstorming/visual-companion.md
  - apeworkflow-brainstorming/spec-document-reviewer-prompt.md
```

---

## 附录 B: 问题间关系图

```
命令/Skill 镜像重复 (P0-2)
  ├── 元循环调用风险 (P2-10)
  └── 维护成本高（改一处忘另一处）

任务路由分裂 (P1-3) + Verify 幻觉 (P1-4)
  └── 根因：命令行内联硬编码，CLI 返回动态 schema
  └── 修复：删除命令文件中的路由表，只依赖 CLI 返回

Prompt 文件缺失 (P0-1)
  ├── subagent 三层验证不可用
  ├── brainstorming visual companion 不可用
  └── 根因：copyAttachedFiles 静默吞错

变更选择矛盾 (P1-5)
  └── 与 P1-7 关联：没有 /ape:help 让用户知道"为什么"

Workspace Planning 死胡同 (P1-6)
  └── 与 P1-7 关联：缺少 continue/ff 等已实现未暴露的命令

Artifact 链路过重 (P2-8)
  └── 加剧新手门槛（结合 P3-13 无文档）

归档日期碰撞 (P2-9)
  └── 与 P2-11 关联：批量归档时冲突更复杂

成本意识缺失 (P2-12)
  └── subagent-driven-development 最重（每任务 3 次调用）
  └── 与 P2-8 关联：链路越长成本越高
```

---

## 附录 C: 建议修复优先级

| 阶段 | 修复项 | 预计工作量 |
|------|--------|-----------|
| **紧急** | 修复 `copyAttachedFiles` 的错误处理（日志/告警） | 1h |
| **紧急** | 确认 prompt 文件为什么没被复制 | 1h |
| **紧急** | 删除命令文件中的硬编码路由表（P1-3, P1-4） | 2h |
| **短期** | 统一变更选择策略（auto vs manual） | 2h |
| **短期** | 实现 `/ape:help` | 2h |
| **短期** | Workspace Planning 添加回退方案 | 3h |
| **中期** | 命令-Skill 镜像的去重方案（单源 vs 双源） | 4h |
| **中期** | 归档日期碰撞自动解决（后缀策略） | 2h |
| **中期** | Delta Spec 同步的用户引导 | 3h |
| **中期** | 成本提示（apply 前显示预计调用次数） | 3h |
| **长期** | Artifact 链路的"最小变更"模式 | 8h+ |
| **长期** | 添加 CLAUDE.md 项目级入口 | 1h |
