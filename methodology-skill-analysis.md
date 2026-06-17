# ApeWorkflow 方法论技能缺失分析

## 说明

本文档基于以下三个 ClaudeCode 会话记录整理：

- `/Users/acez/.claude/projects/-Users-acez-Documents-TIENS-TestToDo/5af1ae27-6aad-4403-aa44-eb4fce56c176.jsonl`
- `/Users/acez/.claude/projects/-Users-acez-Documents-TIENS-TestToDo/6e354eb8-5eea-4272-bb76-e2a96b3f9675.jsonl`
- `/Users/acez/.claude/projects/-Users-acez-Documents-TIENS-TestToDo/17ac5f45-81cc-4377-b168-020f217db1c0.jsonl`

分析目标：

1. 说明为什么在这些会话里，没有看到 `apeworkflow-brainstorming`、`apeworkflow-writing-plans`、`apeworkflow-test-driven-development` 作为独立方法论技能被调用。
2. 区分“读取技能文本”“在对话里讨论技能”“真正激活技能”三种不同状态。
3. 给出可复核的证据和原因分类。

## 结论摘要

这三段会话里，方法论技能没有形成稳定、显式的独立调用链，主要原因不是“完全不知道这些技能存在”，而是以下三类因素叠加：

1. 入口被 `/ape:explore` 吸收，导致 brainstorming 被内嵌到探索流程里。
2. 部分会话只是在“读取 skill 文本”或“引用 skill 说明”，没有真正通过技能机制激活。
3. 有一段会话被 `502 Bad Gateway` 和用户中断打断，根本没走到可以切换技能的稳定阶段。
4. 进入实现阶段后，实际执行路径更像“artifact 驱动 + 构建修复”，而不是 TDD 的“先测试后实现”。

## 三个会话的实际表现

### 1. `5af1ae27-6aad-4403-aa44-eb4fce56c176`

#### 发生了什么

- 会话从 `/ape:explore 实现ToDo` 开始。
- 先检查目录、ApeWorkflow 配置、现有 change。
- 中途确实读取了 `apeworkflow-explore` 与 `apeworkflow-writing-plans` 的技能文本。
- 随后在 explore 语境下继续提问、梳理范围、询问功能深度和技术栈。
- 这段会话里可以看到“思考”和“问答”，但没有看到独立的 `apeworkflow-brainstorming` 或 `apeworkflow-writing-plans` 激活链。

#### 关键现象

- `brainstorming` 被 explore 吞并。
- `writing-plans` 只表现为“读取文本”，不是“技能激活”。
- `TDD` 没有进入，因为还停留在探索与规划阶段。

#### 证据索引

- explore 入口：[`5af1...jsonl#L7`](/Users/acez/.claude/projects/-Users-acez-Documents-TIENS-TestToDo/5af1ae27-6aad-4403-aa44-eb4fce56c176.jsonl#L7)
- 读取 explore skill：[`5af1...jsonl#L40`](/Users/acez/.claude/projects/-Users-acez-Documents-TIENS-TestToDo/5af1ae27-6aad-4403-aa44-eb4fce56c176.jsonl#L40)
- 读取 skill 文本而非激活：[`5af1...jsonl#L44-L45`](/Users/acez/.claude/projects/-Users-acez-Documents-TIENS-TestToDo/5af1ae27-6aad-4403-aa44-eb4fce56c176.jsonl#L44)
- 在 explore 内继续规划：[`5af1...jsonl#L46-L52`](/Users/acez/.claude/projects/-Users-acez-Documents-TIENS-TestToDo/5af1ae27-6aad-4403-aa44-eb4fce56c176.jsonl#L46)

### 2. `6e354eb8-5eea-4272-bb76-e2a96b3f9675`

#### 发生了什么

- 同样从 `/ape:explore 实现ToDo` 开始。
- 先加载了 `apeworkflow-using-skills` 的启动上下文。
- 之后在 explore 过程中还未进入明确规划或实现，就遇到了连续 `502 Bad Gateway`。
- 随后会话被用户中断。

#### 关键现象

- 这个会话不属于“技能没用”，而属于“流程没跑稳”。
- 在运行时失败和中断之后，没有足够连续上下文去进入 brainstorming / writing-plans / TDD 的后续链路。

#### 证据索引

- explore 入口：[`6e354...jsonl#L5-L6`](/Users/acez/.claude/projects/-Users-acez-Documents-TIENS-TestToDo/6e354eb8-5eea-4272-bb76-e2a96b3f9675.jsonl#L5)
- 连续 `502`：[`6e354...jsonl#L25-L34`](/Users/acez/.claude/projects/-Users-acez-Documents-TIENS-TestToDo/6e354eb8-5eea-4272-bb76-e2a96b3f9675.jsonl#L25)
- 用户中断：[`6e354...jsonl#L39`](/Users/acez/.claude/projects/-Users-acez-Documents-TIENS-TestToDo/6e354eb8-5eea-4272-bb76-e2a96b3f9675.jsonl#L39)

### 3. `17ac5f45-81cc-4377-b168-020f217db1c0`

#### 发生了什么

- 这段会话一开始仍然是 `/ape:explore 实现ToDo`。
- 先完成了大量项目现状探查。
- 用户确认后，开始批量创建 `proposal.md`、多个 `spec.md`、`design.md`、`tasks.md`。
- 之后进入实现阶段，按 tasks 逐步构建 Next.js 项目。
- 最后是构建错误修复、类型修复、运行时修复，而不是严格的 TDD 循环。

#### 关键现象

- brainstorm 仍然被 explore 吸收，没有单独切出。
- `writing-plans` 没有作为显式技能调用出现，而是直接生成了规划产物。
- `TDD` 没有以“先写失败测试，再实现”的形式出现，而是以“修构建、修类型、修运行时”推进。

#### 证据索引

- 用户确认开始规划：[`17ac...jsonl#L70`](/Users/acez/.claude/projects/-Users-acez-Documents-TIENS-TestToDo/17ac5f45-81cc-4377-b168-020f217db1c0.jsonl#L70)
- 直接生成规划产物：[`17ac...jsonl#L72-L75`](/Users/acez/.claude/projects/-Users-acez-Documents-TIENS-TestToDo/17ac5f45-81cc-4377-b168-020f217db1c0.jsonl#L72)
- 确认任务文件已完成：[`17ac...jsonl#L109-L110`](/Users/acez/.claude/projects/-Users-acez-Documents-TIENS-TestToDo/17ac5f45-81cc-4377-b168-020f217db1c0.jsonl#L109)
- 进入实现指令流：[`17ac...jsonl#L124-L127`](/Users/acez/.claude/projects/-Users-acez-Documents-TIENS-TestToDo/17ac5f45-81cc-4377-b168-020f217db1c0.jsonl#L124)
- 直接写代码文件：[`17ac...jsonl#L156-L160`](/Users/acez/.claude/projects/-Users-acez-Documents-TIENS-TestToDo/17ac5f45-81cc-4377-b168-020f217db1c0.jsonl#L156)

## 原因分类

### 一、入口原因

#### 1. `explore` 本身吞并了方法论

`/ape:explore` 的定义是“思考模式”，而不是固定 workflow。  
在这三段会话里，`explore` 实际承担了以下职责：

- 看项目现状
- 收集约束
- 提问题
- 确认范围
- 讨论方案

这些职责本身与 `brainstorming` 有重叠，所以对话层面看起来像“已经做了 brainstorming”，但技能层面没有形成独立切换。

#### 2. 会话入口不是“方法论技能入口”

实际入口是命令 `/ape:explore`，不是直接调用：

- `apeworkflow-brainstorming`
- `apeworkflow-writing-plans`
- `apeworkflow-test-driven-development`

所以系统行为更像“在 explore 里做规划”，而不是“先激活方法论技能，再进入下一阶段”。

### 二、流程原因

#### 1. `brainstorming` 被内嵌到 explore

在记录里可以看到：

- 先问功能深度
- 再问技术栈
- 再做架构对比
- 再确认规划方向

这些都属于 brainstorming 的活动，但它们是在 explore 的话术里完成的，不是通过独立技能切换完成的。

#### 2. `writing-plans` 被 artifact 生成流程替代

在 `17ac` 里，用户确认“立即开始创建变更规划”后，流程直接进入：

- `proposal.md`
- `specs/*.md`
- `design.md`
- `tasks.md`

这里表现出来的是“开始产出规划文档”，而不是显式调用 `writing-plans` 再按其规则规划文件结构、粒度和任务切分。

#### 3. `TDD` 被实现期的修复流程替代

从记录看，实际实现顺序是：

- 先生成页面和组件
- 再遇到 build / type error
- 再修复错误
- 再重新 build

这条路径不是严格的测试驱动开发。  
也就是说，行为上更接近“边做边修”或“构建驱动修复”，而不是“先写失败测试，再写最小实现”。

### 三、运行时原因

#### 1. `6e354` 受到外部故障干扰

这段会话的前半段连续出现：

- `502 Bad Gateway`
- retry

这会让任何原本可能进入的技能切换都失去连续上下文。

#### 2. 用户中断打断了技能链

在 `6e354` 中，用户明确中断了流程。  
这意味着会话没有机会继续走到更明确的规划或实现阶段。

### 四、认知原因

#### 1. “读取技能文本”不等于“调用技能”

`5af1` 中出现了读取 skill 文件内容的行为，但那只是查看规则文本，仍然不等于通过技能系统进入该方法论。

#### 2. “在对话里谈到某个技能”不等于“技能已执行”

记录里能看到对 `writing-plans`、`explore`、`proposal`、`tasks` 的讨论，但这些只是内容层面的提及。  
是否真正调用技能，要看技能机制是否被触发，而不是看文本里是否出现技能名。

## 技能与行为的对照

| 方法论技能 | 记录中的对应行为 | 是否独立调用 |
|---|---|---|
| `apeworkflow-brainstorming` | 在 explore 中问范围、问技术栈、做方案比较 | 否，表现为 explore 内嵌思考 |
| `apeworkflow-writing-plans` | 直接生成 proposal/spec/design/tasks | 否，表现为文档产出流程 |
| `apeworkflow-test-driven-development` | 直接写实现、修 build/type/runtime error | 否，表现为实现驱动修复 |

## 为什么看起来像“没用技能”

从输出表现看，最容易产生“没用技能”的原因有三点：

1. 输出风格已经接近 brainstorming，所以容易误认为已经显式调用了 brainstorming。
2. 规划产物一次性生成，所以容易误认为已经进入 writing-plans。
3. 实现过程中大量修复 build / type / runtime 错误，所以容易误认为是在按测试驱动推进。

实际上，这些都更像是**行为上接近**，但**机制上没有显式切换**。

## 最终结论

这三个会话没有把 `apeworkflow-brainstorming`、`apeworkflow-writing-plans`、`apeworkflow-test-driven-development` 做成清晰的独立调用链，根本原因是：

1. 当时的 `explore` 入口把思考和澄清吸收掉了，导致 `brainstorming` 没有作为独立的补充阶段出现。
2. 规划阶段被直接写 artifact 的流程替代，导致 `writing-plans` 没有作为独立的详细计划阶段出现。
3. 实现阶段被构建错误修复牵引，导致 TDD 没有作为独立工作方式出现。
4. `6e354` 还叠加了运行时异常和中断，进一步削弱了流程连续性。

如果后续要让方法论技能在日志里更明确，主流程应当写清楚：

- explore 只负责探索与澄清
- propose 负责生成 `proposal.md`、`design.md`、`tasks.md`
- propose 中嵌入 `brainstorming`，用来补充需求探索和澄清，并回写到 `proposal.md`、`design.md`、`tasks.md`
- `brainstorming` 的最后一步是 `writing-plans`
- `writing-plans` 负责产出 `apeworkflow/changes/<name>/plans/YYYY-MM-DD-<feature-name>.md`
- `apply` 负责按 `plans/` 文件执行开发任务
- `verify` 和 `archive` 继续走后段主流程
