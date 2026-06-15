# Design: 命令展示面收敛

> **Status:** Draft
> **Date:** 2026-06-15
> **Topic:** 只收敛文档/引导里展示的命令，并统一到共享可见集合

## 1. 背景

ApeWorkflow 当前同时存在两类命令展示来源：

1. 工作流文档和引导文案中的命令列表、速查表、next-step 提示
2. 实际 CLI 命令、命令生成文件、shell completion 和内部路由

现在需要收敛的只是第 1 类：文档/引导里展示给用户看的命令，不改第 2 类。

当前用户确认的可见命令只有 8 个：

- `explore`
- `propose`
- `apply`
- `verify`
- `archive`
- `onboard`
- `bulk-archive`
- `feedback`

以下命令仍然保留在内部能力里，但不再出现在默认文档/引导展示面：

- `new`
- `continue`
- `ff`
- `sync`

方法论相关命令仍然可以单独调用，但它们不应继续出现在用户可见的命令说明、速查表和引导提示中。

## 2. 目标

1. 所有用户可见的命令展示都只来自同一份共享的可见命令集合
2. `onboard`、速查表、next-step 提示、正文里的命令引用都统一收敛到这份集合
3. 用户可见文案中不再展示 `new`、`continue`、`ff`、`sync`
4. 不修改实际 CLI 命令、命令文件、shell completion、命令生成逻辑
5. 不改变现有工作流执行行为，只改变文案展示

## 3. 非目标

- 不删除任何实际命令
- 不修改 `src/cli/index.ts` 的命令注册
- 不修改 `src/core/completions/command-registry.ts`
- 不修改命令生成器和命令适配器
- 不改工作流阶段路由逻辑
- 不重构与该展示面无关的模板内容

## 4. 范围定义

### 4.1 受影响的内容

以下内容属于“文档/引导里展示的命令”：

- `onboard` 里的命令速查表
- `onboard` 里的 Additional commands 段落
- `onboard` 里的退出/暂停时 next-step 提示
- 各工作流模板正文里的命令引用
- 任何会直接展示给用户的命令名、命令列表、命令说明

### 4.2 不受影响的内容

以下内容保持不变：

- 实际 `/ape:*` 命令是否存在
- 命令生成到工具目录后的文件内容
- shell completion 可见命令
- CLI help / commander 注册本身
- profile 和工作流安装逻辑
- 兼容性检测和命令文件计数逻辑

## 5. 设计

### 5.1 共享可见命令集合

系统应提供一份共享的“可见命令集合”，只包含 8 个用户可见命令。

这份集合是所有用户可见文案的唯一来源，不允许在各个模板文件里分别手写不同的命令清单。

### 5.2 文案渲染方式

所有需要展示命令的文案都应从共享集合渲染，而不是直接拼接硬编码字符串。

渲染结果至少覆盖以下形式：

- 命令表格
- 项目符号列表
- `Prompt:` 里的下一步提示
- 需要引用命令名称的正文片段

### 5.3 模板消费方式

`onboard` 以及各工作流模板应只消费共享渲染结果，不再自己维护命令名列表。

如果某处需要显示“可继续做什么”，只能从共享集合中挑选可见命令。

如果某处原本写着 `new`、`continue`、`ff`、`sync`，应改成不显示这些命令名的表达方式。

### 5.4 保留边界

实际命令仍然存在，且仍可被直接调用。

本次收敛只影响用户可见文案，不影响用户在命令行里输入这些命令后的执行结果。

## 6. 文件影响面

### 6.1 主要修改文件

- `src/core/templates/workflows/onboard.ts`
- `src/core/templates/workflows/explore.ts`
- `src/core/templates/workflows/propose.ts`
- `src/core/templates/workflows/new-change.ts`
- `src/core/templates/workflows/continue-change.ts`
- `src/core/templates/workflows/ff-change.ts`
- `src/core/templates/workflows/sync-specs.ts`
- `src/core/templates/workflows/apply-change.ts`
- `src/core/templates/workflows/verify-change.ts`
- `src/core/templates/workflows/archive-change.ts`
- `src/core/templates/workflows/feedback.ts`

### 6.2 新增或调整的共享层

- 新增一个共享可见命令定义来源
- 新增一个共享文案渲染入口，供模板复用

### 6.3 明确不变的文件

- `src/cli/index.ts`
- `src/core/completions/command-registry.ts`
- `src/core/command-generation/*`
- `src/core/shared/tool-detection.ts`
- `src/core/profile-sync-drift.ts`

## 7. 行为细则

### 7.1 `onboard`

`onboard` 中的命令速查表只显示 8 个可见命令。

`Additional commands` 段落中不再列出 `new`、`continue`、`ff`、`sync`。

用户退出或想查看命令时看到的 next-step，也只能引用这 8 个命令。

### 7.2 工作流正文

工作流正文中凡是会直接展示命令名的地方，都要改成来自共享可见集合的内容。

如果某段原本通过例子提醒用户用 `new`、`continue`、`ff`、`sync`，需要改写成不暴露这些命令名的版本。

### 7.3 方法论相关展示

方法论命令仍然可用，但不进入默认展示面。

如果文案需要表达“先做思考/计划/验证”，应优先用自然语言描述流程，不再把隐藏命令作为默认提示展示给用户。

## 8. 数据流

1. 模板或引导需要展示命令
2. 模板读取共享可见命令集合
3. 共享集合渲染出表格、列表或提示文本
4. 模板将渲染结果插入最终文案
5. 用户只看到这份统一后的展示面

这条链路不经过命令生成、completion 注册或 CLI 路由。

## 9. 错误处理

这次不增加运行时错误分支。

如果某个模板还在直接拼接隐藏命令名，应该在测试中暴露，而不是在运行时容错。

如果共享集合和模板消费出现不一致，以测试失败为准，避免隐藏命令进入用户可见文案。

## 10. 测试

### 10.1 集合测试

- 可见命令集合只包含 8 个命令
- 集合内不得出现 `new`、`continue`、`ff`、`sync`
- 集合内命令必须唯一

### 10.2 文案测试

- `onboard` 速查表只展示 8 个命令
- `onboard` 的 Additional commands 不包含隐藏命令
- `onboard` 的 next-step 不引用隐藏命令
- 各工作流模板正文不再包含隐藏命令的可见展示

### 10.3 回归测试

- `feedback`、`explore`、`propose` 等会引用命令名的模板，必须使用共享渲染结果
- 不允许新的硬编码命令列表出现在用户可见文案里

## 11. 验收标准

- [ ] 所有用户可见的命令展示都来自同一份共享可见集合
- [ ] `onboard` 中只展示 8 个可见命令
- [ ] 文档/引导里不再展示 `new`、`continue`、`ff`、`sync`
- [ ] CLI 命令、命令文件、completion、内部路由保持不变
- [ ] 相关测试通过

## 12. 结论

本次改动只收敛文档/引导里的命令展示，不收缩实际命令能力。

最终效果是：用户看到的命令更少、更一致，但内部工作流和方法论能力仍然保留。
