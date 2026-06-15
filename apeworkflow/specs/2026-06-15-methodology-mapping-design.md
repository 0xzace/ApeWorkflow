# Design: 方法论技能映射

> **Status:** Approved
> **Date:** 2026-06-15
> **Topic:** 按任务类型将方法论技能映射到工作流阶段

## 1. 背景

ApeWorkflow 已经具备两类能力：

1. 产品级工作流阶段
   - `explore`
   - `propose`
   - `apply`
   - `verify`
   - `archive`

2. 方法论技能
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

当前问题不是缺少能力，而是缺少“阶段内怎么推荐、按什么顺序推荐”的统一规则。

---

## 2. 目标

1. 保留现有 5 个主工作流阶段，不新增主流程入口
2. 为每个阶段提供默认方法论推荐顺序
3. 根据任务类型调整阶段内的方法论顺序
4. 支持 4 类任务类型：`功能开发`、`缺陷修复`、`重构`、`文档`
5. 任务类型无法识别时，直接报错并要求用户选择类型
6. 方法论技能仍可单独调用，不强制只能通过主流程使用

---

## 3. 非目标

- 不增加新的主工作流阶段
- 不把 14 个方法论技能拆成 14 个主流程入口
- 不改变现有工作流名称
- 不做自动降级任务类型
- 不做最近一次任务类型回填
- 不引入与本需求无关的新能力

---

## 4. 总体设计

系统采用“阶段层 + 任务类型层”的双层映射。

- 阶段层固定主流程顺序
- 任务类型层只覆盖每个阶段内部的方法论推荐顺序
- 用户始终先进入工作流阶段，再由任务类型决定该阶段内的方法论顺序

这个设计保留了主流程的稳定性，也保留了不同任务类型的执行差异。

---

## 5. 阶段职责

### 5.1 `explore`

- 负责问题澄清、范围收敛、上下文理解
- 负责帮助用户先把问题问清楚

### 5.2 `propose`

- 负责把想法变成可执行计划
- 负责形成后续执行所需的结构化材料

### 5.3 `apply`

- 负责按计划实施
- 负责把计划转为可验证的产出

### 5.4 `verify`

- 负责确认实现与预期一致
- 负责在完成前形成验证证据

### 5.5 `archive`

- 负责收尾和归档
- 负责把开发周期完整闭环

---

## 6. 任务类型规则

### 6.1 `功能开发`

- `explore`：`using-skills -> brainstorming`
- `propose`：`writing-plans -> using-git-worktrees -> dispatching-parallel-agents`
- `apply`：`executing-plans -> test-driven-development -> subagent-driven-development`
- `verify`：`verification-before-completion -> requesting-code-review -> receiving-code-review`
- `archive`：`finishing-a-development-branch -> verification-before-completion`

### 6.2 `缺陷修复`

- `explore`：`using-skills -> brainstorming`
- `propose`：`systematic-debugging -> writing-plans -> using-git-worktrees`
- `apply`：`systematic-debugging -> test-driven-development -> executing-plans`
- `verify`：`verification-before-completion -> requesting-code-review -> receiving-code-review`
- `archive`：`finishing-a-development-branch -> verification-before-completion`

### 6.3 `重构`

- `explore`：`using-skills -> brainstorming`
- `propose`：`writing-plans -> using-git-worktrees -> dispatching-parallel-agents`
- `apply`：`executing-plans -> test-driven-development -> subagent-driven-development`
- `verify`：`verification-before-completion -> requesting-code-review -> receiving-code-review`
- `archive`：`finishing-a-development-branch -> verification-before-completion`

### 6.4 `文档`

- `explore`：`using-skills -> brainstorming`
- `propose`：`writing-plans`
- `apply`：`writing-skills`
- `verify`：`verification-before-completion`
- `archive`：`finishing-a-development-branch -> verification-before-completion`

### 6.5 统一规则

- `explore` 阶段始终先做路由，再做澄清
- `verify` 阶段始终先做验证，再做 review
- `archive` 阶段始终先做收尾，再做归档确认

---

## 7. 数据流

1. 用户先明确任务类型
2. 系统进入主阶段序列
3. 每到一个阶段，系统读取该阶段的默认方法论列表
4. 系统按任务类型覆盖该阶段的推荐顺序
5. 系统输出该阶段对应的方法论顺序

如果任务类型无法识别，流程停止，不进入后续阶段。

---

## 8. 错误处理

- 任务类型缺失时，流程必须停止
- 任务类型无法识别时，流程必须停止
- 系统必须提示用户在 `功能开发`、`缺陷修复`、`重构`、`文档` 中选择一个类型
- 系统不允许静默降级到默认类型
- 系统不允许沿用最近一次任务类型

---

## 9. 兼容性要求

- 现有 5 个主阶段保持不变
- 方法论技能保持可独立调用
- 不要求用户只能通过主流程调用方法论技能
- 不新增主流程入口

---

## 10. 质量要求

- `apply` 阶段必须按任务类型选择推荐顺序
- 新功能默认倾向 `test-driven-development`
- 缺陷修复默认倾向 `systematic-debugging`
- `verify` 阶段必须先提供验证证据
- `archive` 阶段必须确认收尾完成

---

## 11. 风险与约束

### 11.1 风险

- 用户需要适应任务类型先行的入口方式
- 方法论推荐过多时，阶段输出会变长
- 文档任务如果强行加入 review，会增加不必要成本

### 11.2 约束

- 保持主流程简洁
- 保持任务类型规则明确
- 保持文档任务的轻量性
- 不引入自动猜测任务类型的逻辑

---

## 12. 验收标准

### 12.1 结构验收

- 主流程仍然是 5 个阶段
- 每个阶段都有明确的方法论推荐顺序
- 4 类任务类型都有独立规则

### 12.2 功能验收

- `功能开发`、`缺陷修复`、`重构`、`文档` 都能映射到阶段顺序
- `文档` 任务走完整 5 阶段，但执行和验证保持轻量
- 任务类型无法识别时，系统会直接报错并要求用户选择

### 12.3 兼容性验收

- 方法论技能仍可单独调用
- 主阶段名称保持不变
- 不新增新的主流程入口

---

## 13. 结论

本需求的目标不是增加更多工作流，而是让已有工作流和方法论技能形成稳定的阶段内顺序规则。

最终结果应是：

- 主流程保持稳定
- 任务类型决定阶段内方法论顺序
- 文档任务保持完整流程但执行轻量
- 任务类型无法识别时直接停止并要求用户选择
