# Tasks: Schema-Driven Task Routing

## 1. Zod Schema 与 TypeScript 类型

- 1.1 新增 TaskTypeRoutingSchema Zod 定义
- 1.2 将 ApplyPhaseSchema 重命名为 PhaseConfigSchema（扩展字段）
- 1.3 在 SchemaYamlSchema 中添加 phases 可选字段
- 1.4 导出新增类型（TaskTypeRouting, PhaseConfig）

## 2. Schema 验证

- 2.1 新增 validatePhasesConsistency 函数（验证 phases.requires 引用有效 artifact）
- 2.2 在 parseSchema 中集成 phases 验证
- 2.3 在 test/core/artifact-graph/schema.test.ts 中添加 phases 验证测试

## 3. 后端数据结构扩展

- 3.1 在 ChangeContext 中添加 phases 字段
- 3.2 在 loadChangeContext 中填充 phases（从 schema.phases）
- 3.3 在 shared.ts 的 ApplyInstructions 中添加 taskTypeRouting 可选字段
- 3.4 新增 VerifyInstructions 接口定义
- 3.5 新增 ArchiveInstructions 接口定义

## 4. generateApplyInstructions 增强

- 4.1 从 schema.phases.apply 或 schema.apply（fallback）中提取 taskTypeRouting
- 4.2 将 taskTypeRouting 添加到 generateApplyInstructions 返回对象
- 4.3 在 test/commands/workflow/instructions.test.ts 中验证

## 5. 新增 generateVerifyInstructions

- 5.1 实现 generateVerifyInstructions 函数（复用 loadChangeContext 模式）
- 5.2 从 schema.phases.verify 提取 instruction 和 taskTypeRouting
- 5.3 计算 hasIncompleteTasks（扫描 plans/*.md 的 checkbox）
- 5.4 实现 printVerifyInstructionsText 文本输出函数

## 6. 新增 generateArchiveInstructions

- 6.1 实现 generateArchiveInstructions 函数
- 6.2 从 schema.phases.archive 提取 instruction 和 taskTypeRouting
- 6.3 计算 hasIncompleteTasks, hasIncompleteArtifacts, hasDeltaSpecs
- 6.4 实现 printArchiveInstructionsText 文本输出函数

## 7. 导出与 CLI 注册

- 7.1 在 src/commands/workflow/index.ts 中导出新函数
- 7.2 在 src/cli/index.ts 中注册 instructions verify 命令
- 7.3 在 src/cli/index.ts 中注册 instructions archive 命令
- 7.4 更新 test/commands/workflow/instructions-print.test.ts 验证新打印函数

## 8. Schema YAML 配置

- 8.1 在 schemas/spec-driven/schema.yaml 中添加 phases.apply.taskTypeRouting
- 8.2 在 schemas/spec-driven/schema.yaml 中添加 phases.verify 完整块
- 8.3 在 schemas/spec-driven/schema.yaml 中添加 phases.archive 完整块
- 8.4 在 schemas/workspace-planning/schema.yaml 中同步添加 phases 块

## 9. Markdown 文件精简

- 9.1 精简 .claude/commands/ape/apply.md 的任务路由表
- 9.2 精简 .claude/commands/ape/verify.md 的任务路由表
- 9.3 精简 .claude/commands/ape/archive.md 的任务路由表
- 9.4 精简 .claude/skills/apeworkflow-apply-change/SKILL.md 的任务路由表
- 9.5 精简 .claude/skills/apeworkflow-archive-change/SKILL.md 的任务路由表

## 10. 端到端路由测试

- 10.1 创建 test/commands/workflow/instructions-routing.test.ts
- 10.2 测试: schema 有 phases 时 CLI 返回 taskTypeRouting
- 10.3 测试: 旧 schema (无 phases) 返回 undefined（不报错）
- 10.4 测试: verify 和 archive 新命令正常执行
- 10.5 测试: 空 taskTypes map → 返回 {}
- 10.6 测试: taskTypeRouting 有 default 无 taskTypes → 正常

## 11. 集成验证

- 11.1 运行全量测试确认无回归
- 11.2 手动验证 CLI 命令输出格式（--json 和文本模式）
