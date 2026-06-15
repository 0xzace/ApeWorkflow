# 方法论技能融入工作流需求文档

## 1. 文档目的

本文档定义 ApeWorkflow 中“产品级工作流”与“方法论技能”的融合需求，目标是把现有 14 个方法论技能嵌入到工作流主链路中，形成“主干 workflow + 内置方法论 playbook”的统一工作流体系。

本文档只描述需求，不描述实现细节。

---

## 2. 背景

当前 ApeWorkflow 存在两套并行体系：

1. 产品级 workflow
   - 负责生命周期阶段
   - 例如：`explore`、`propose`、`apply`、`verify`、`archive`

2. 方法论技能
   - 负责阶段内的执行质量
   - 例如：`brainstorming`、`test-driven-development`、`systematic-debugging`

两者目前是分离的，导致以下问题：

- 用户知道要做什么 workflow，但不知道该用哪种方法论
- 方法论技能存在，但没有进入主流程
- `apply` 的执行约束偏弱，容易变成“自由发挥”
- `verify`、`archive` 等后置阶段没有形成强门禁
- `new`、`continue`、`ff`、`sync` 与主流程职责重叠，语义不够清晰

---

## 3. 目标

### 3.1 核心目标

- 将 14 个方法论技能融入工作流主链路
- 保留少量清晰的产品级主干 workflow
- 让每个阶段都有默认方法论策略
- 合并或降级语义重叠的 workflow 入口
- 保持现有使用方式的兼容性

### 3.2 期望结果

- 用户看到的是少量清晰的主入口
- 系统能在不同阶段自动使用合适的方法论
- `apply` 不再只是“做任务”，而是“按方法论做任务”
- `verify` 成为完成前的证据门禁
- `archive` 成为收尾闭环，而不是简单移动目录

---

## 4. 范围

### 4.1 主干 workflow

以下 workflow 作为主干保留：

- `explore`
- `propose`
- `apply`
- `verify`
- `archive`

### 4.2 辅助入口

以下 workflow 作为辅助入口保留：

- `onboard`
- `bulk-archive`
- `feedback`

### 4.3 需要合并或降级的入口

以下 workflow 不再作为主干阶段独立存在：

- `new`
- `continue`
- `ff`
- `sync`

这些入口应从用户可见的保留命令中移除，不再作为独立命令继续提供。

### 4.4 方法论技能

以下 14 个方法论技能需要融入工作流阶段：

- `brainstorming`
- `using-skills`
- `writing-plans`
- `using-git-worktrees`
- `dispatching-parallel-agents`
- `executing-plans`
- `test-driven-development`
- `systematic-debugging`
- `subagent-driven-development`
- `verification-before-completion`
- `requesting-code-review`
- `receiving-code-review`
- `finishing-a-development-branch`
- `writing-skills`

---

## 5. 需求总览

### 5.1 工作流层需求

系统应将产品级 workflow 收敛为清晰的生命周期结构。

主流程应表达以下阶段：

1. 发现与澄清
2. 规划与编排
3. 实施
4. 验证与评审
5. 收尾归档

### 5.2 方法论层需求

系统应为每个主阶段提供默认方法论技能支持，方法论技能应作为 workflow 的内置 playbook，而不是独立孤岛。

### 5.3 兼容性需求

系统应保留旧入口的可用性，确保现有用户可以继续使用已有命令，不因本次重构失去能力。

---

## 6. 工作流新定位

### 6.1 主干 workflow 定位

#### `explore`
- 负责需求澄清、问题收敛、上下文理解
- 作为所有复杂工作进入前的起点

#### `propose`
- 负责把想法变成可实施计划
- 产出 proposal、specs、design、tasks 等规划材料

#### `apply`
- 负责按任务实施
- 负责把计划转为代码修改

#### `verify`
- 负责确认实现与规划一致
- 负责执行验证、review、完成前检查

#### `archive`
- 负责完成后的收尾和归档
- 负责将变更纳入历史记录

### 6.2 辅助入口定位

#### `onboard`
- 负责引导新用户完成一次完整工作流演示

#### `bulk-archive`
- 负责批量归档多个已完成变更

#### `feedback`
- 负责收集并提交产品反馈

### 6.3 已移除入口

以下入口不再保留为用户可见命令：

- `new`
- `continue`
- `ff`
- `sync`

这些入口的职责由主干 workflow 吸收，不再单独暴露。

---

## 7. 方法论技能分层需求

### 7.1 入口与路由层

以下技能应承担“帮助用户找到正确能力”的职责：

- `using-skills`
- `brainstorming`

要求：
- 用户在不清楚下一步时，应能通过这些技能进入正确工作流
- 系统应优先把模糊需求引导到可执行状态

### 7.2 计划层

以下技能应承担“把想法变成计划”的职责：

- `writing-plans`
- `using-git-worktrees`
- `dispatching-parallel-agents`

要求：
- 计划应具备明确的文件边界、任务边界、执行顺序
- 对复杂任务应支持隔离工作区与并行拆分

### 7.3 执行层

以下技能应承担“把计划变成结果”的职责：

- `executing-plans`
- `test-driven-development`
- `systematic-debugging`
- `subagent-driven-development`

要求：
- 执行过程中应保持任务驱动
- 新功能和 bug 修复应优先使用适配的方法论
- 大任务应支持拆分与协作

### 7.4 质量层

以下技能应承担“确认结果正确”的职责：

- `verification-before-completion`
- `requesting-code-review`
- `receiving-code-review`

要求：
- 在完成前必须有验证证据
- review 结果应进入后续动作
- 不能把“看起来完成”当作完成

### 7.5 收尾层

以下技能应承担“结束开发周期”的职责：

- `finishing-a-development-branch`

要求：
- 在归档前完成收尾动作
- 分支状态、验证状态、任务状态应在收尾时对齐

### 7.6 维护与支持层

以下技能应作为支持能力保留：

- `writing-skills`
- `feedback`

要求：
- 这两项不进入主干执行链的核心阶段
- 但仍应保持可独立调用

---

## 8. 阶段与方法论映射

### 8.1 `explore` 阶段

默认方法论：

- `brainstorming`
- `using-skills`

需求：
- 该阶段应帮助用户确认问题、范围、目标
- 该阶段应支持“先问清楚再行动”

### 8.2 `propose` 阶段

默认方法论：

- `writing-plans`
- `using-git-worktrees`
- `dispatching-parallel-agents`

需求：
- 该阶段应形成可执行计划
- 该阶段应在复杂任务下提供更稳的执行准备

### 8.3 `apply` 阶段

默认方法论：

- `executing-plans`
- `test-driven-development`
- `systematic-debugging`
- `subagent-driven-development`

需求：
- 该阶段应按计划逐项执行
- 该阶段应根据任务类型自动选择合适方法论
- 该阶段应支持 bug 修复、功能开发、重构等不同场景

### 8.4 `verify` 阶段

默认方法论：

- `verification-before-completion`
- `requesting-code-review`
- `receiving-code-review`

需求：
- 该阶段应成为完成前的证据门禁
- 该阶段应支持 review 和反馈闭环

### 8.5 `archive` 阶段

默认方法论：

- `finishing-a-development-branch`
- `verification-before-completion`

需求：
- 该阶段应在归档前确认开发周期已完整结束
- 该阶段应避免未验证就归档

---

## 9. 兼容性要求

### 9.1 保留命令清单

系统只保留以下用户可见命令：

- `explore`
- `propose`
- `apply`
- `verify`
- `archive`
- `onboard`
- `bulk-archive`
- `feedback`

### 9.2 移除命令清单

以下命令不再对用户保留：

- `new`
- `continue`
- `ff`
- `sync`

### 9.3 独立调用支持

方法论技能应仍然支持单独调用，不应强制用户只能通过主流程使用。

---

## 10. 行为约束

### 10.1 不允许的行为

- 不允许把 14 个方法论技能直接等同于 14 个主 workflow 阶段
- 不允许把主流程拆成过多入口，导致用户选择成本上升
- 不允许在未验证的情况下宣布完成
- 不允许让 `apply` 继续停留在“自由发挥式执行”

### 10.2 必须满足的行为

- 主流程必须清晰、稳定、可理解
- 方法论必须融入阶段执行
- 阶段切换必须有明确的交接语义
- 收尾动作必须在归档前完成

---

## 11. 质量要求

### 11.1 执行质量

- `apply` 阶段必须有明确的执行策略
- 新功能默认应考虑 `test-driven-development`
- 缺陷修复默认应考虑 `systematic-debugging`

### 11.2 结果质量

- `verify` 阶段必须要求验证证据
- review 结果必须能够推动下一步动作
- 完成声明必须可追溯

### 11.3 交接质量

- 每个方法论技能完成后应有下一步提示
- 不应让方法论对话在完成时断掉

---

## 12. 风险与约束

### 12.1 风险

- 用户对主干 workflow 调整存在认知迁移成本
- 过多方法论提示可能导致输出过长
- 语义重叠入口处理不当会让用户困惑

### 12.2 约束

- 保持对现有用户的兼容性
- 保持主流程简洁
- 保持方法论技能可独立使用
- 不引入与本需求无关的新能力

---

## 13. 验收标准

### 13.1 结构验收

- 主流程能被清晰描述为 5 个阶段
- 方法论技能能清晰映射到对应阶段
- 辅助入口和兼容入口有明确定位

### 13.2 功能验收

- `explore` 阶段能提供澄清和路由能力
- `propose` 阶段能生成可执行计划
- `apply` 阶段能按方法论执行任务
- `verify` 阶段能形成验证与 review 门禁
- `archive` 阶段能完成收尾归档

### 13.3 兼容性验收

- 用户可见命令仅保留指定清单中的 8 个命令
- 方法论技能仍可单独调用
- 已移除的入口不再作为独立命令暴露

---

## 14. 结论

本需求的目标不是增加更多 workflow，而是将现有 workflow 体系整理成更清晰的主干，并让 14 个方法论技能真正进入工作流生命周期。

最终应形成以下产品结构：

- 少量主干 workflow 负责生命周期阶段
- 方法论技能负责阶段内执行策略
- 辅助入口负责教学、批处理、支持能力
- 旧入口保留兼容，逐步收敛到新主流程
