# 测试覆盖率整理文档

## 结论
已执行 `pnpm test:coverage`。

- 测试结果：`137/137` 通过
- 总体语句覆盖率：`80.34%`
- 需要处理的 `0%` 覆盖文件：`5` 个

## 覆盖率分布
- 该文档同步当前低覆盖 runtime 文件，便于继续补单测。

## 需要补单测的文件

### `0%` 覆盖
- [src/core/command-generation/types.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/command-generation/types.ts)
- [src/core/completions/types.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/completions/types.ts)
- [src/core/error-reporting/types.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/error-reporting/types.ts)
- [src/core/templates/types.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/templates/types.ts)
- [src/core/validation/types.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/validation/types.ts)

### `20%` 以下
- 无（当前已无低于 `20%` 的 runtime 文件）

### `20%~49%`
- 无（当前已无低于 `50%` 的 runtime 文件）

### `50%~79%`
- [src/commands/context-store.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/commands/context-store.ts)
- [src/commands/validate.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/commands/validate.ts)
- [src/commands/workspace.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/commands/workspace.ts)
- [src/commands/workspace/open-view.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/commands/workspace/open-view.ts)
- [src/commands/workspace/open-target-selection.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/commands/workspace/open-target-selection.ts)
- [src/commands/workspace/opener-selection.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/commands/workspace/opener-selection.ts)
- [src/core/change-status-policy.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/change-status-policy.ts)
- [src/core/context-store/binding.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/context-store/binding.ts)
- [src/core/context-store/operations.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/context-store/operations.ts)
- [src/core/collections/initiatives/resolution.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/collections/initiatives/resolution.ts)
- [src/core/list.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/list.ts)
- [src/core/validation/validator.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/validation/validator.ts)
- [src/core/parsers/change-parser.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/parsers/change-parser.ts)

### `80%~99%`
- [src/commands/config.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/commands/config.ts)
- [src/utils/change-metadata.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/utils/change-metadata.ts)
- [src/prompts/searchable-multi-select.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/prompts/searchable-multi-select.ts)
- [src/telemetry/index.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/telemetry/index.ts)
- [src/utils/file-system.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/utils/file-system.ts)
- [src/core/completions/installers/bash-installer.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/completions/installers/bash-installer.ts)
- [src/core/workspace/link-input.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/workspace/link-input.ts)
- [src/core/planning-home.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/planning-home.ts)
- [src/core/parsers/requirement-blocks.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/parsers/requirement-blocks.ts)
- [src/utils/change-utils.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/utils/change-utils.ts)
- [src/core/collections/initiatives/operations.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/collections/initiatives/operations.ts)
- [src/core/update.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/update.ts)
- [src/core/workspace/legacy-state.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/workspace/legacy-state.ts)
- [src/core/init.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/init.ts)
- [src/cli/error-handling.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/cli/error-handling.ts)
- [src/commands/workspace/registration.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/commands/workspace/registration.ts)
- [src/core/context-store/foundation.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/context-store/foundation.ts)
- [src/core/completions/installers/powershell-installer.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/completions/installers/powershell-installer.ts)
- [src/core/completions/generators/fish-generator.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/completions/generators/fish-generator.ts)
- [src/core/global-config.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/global-config.ts)
- [src/commands/workspace/open.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/commands/workspace/open.ts)
- [src/core/config-schema.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/config-schema.ts)
- [src/telemetry/config.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/telemetry/config.ts)
- [src/core/workspace/registry.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/workspace/registry.ts)
- [src/core/command-generation/adapters/pi.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/command-generation/adapters/pi.ts)
- [src/core/completions/installers/fish-installer.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/completions/installers/fish-installer.ts)
- [src/core/context-store/registry.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/context-store/registry.ts)
- [src/core/error-reporting/state.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/error-reporting/state.ts)
- [src/core/workspace/openers.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/workspace/openers.ts)
- [src/core/artifact-graph/resolver.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/artifact-graph/resolver.ts)
- [src/core/completions/installers/zsh-installer.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/completions/installers/zsh-installer.ts)
- [src/core/workspace/foundation.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/workspace/foundation.ts)
- [src/commands/workspace/prompt-theme.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/commands/workspace/prompt-theme.ts)
- [src/commands/feedback.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/commands/feedback.ts)
- [src/core/migration.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/migration.ts)
- [src/core/artifact-graph/schema.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/artifact-graph/schema.ts)
- [src/core/error-reporting/github.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/error-reporting/github.ts)
- [src/core/error-reporting/config.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/error-reporting/config.ts)
- [src/core/artifact-graph/instruction-loader.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/artifact-graph/instruction-loader.ts)
- [src/core/artifact-graph/graph.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/artifact-graph/graph.ts)
- [src/core/legacy-cleanup.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/legacy-cleanup.ts)
- [src/ui/ascii-patterns.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/ui/ascii-patterns.ts)
- [src/core/collections/initiatives/schema.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/collections/initiatives/schema.ts)
- [src/core/workspace/open-surface.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/workspace/open-surface.ts)
- [src/core/profile-sync-drift.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/profile-sync-drift.ts)
- [src/core/collections/runtime.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/collections/runtime.ts)
- [src/commands/workspace/setup-prompts.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/commands/workspace/setup-prompts.ts)
- [src/core/shared/skill-generation.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/shared/skill-generation.ts)
- [src/core/shared/tool-detection.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/shared/tool-detection.ts)
- [src/core/completions/generators/zsh-generator.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/core/completions/generators/zsh-generator.ts)
- [src/commands/initiative.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/commands/initiative.ts)
- [src/commands/show.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/commands/show.ts)
- [src/commands/spec.ts](/Users/acez/Documents/TIENS/ApeWorkflow/ApeWorkflow/src/commands/spec.ts)

## 工作量判断
剩余 `0%` 文件均为类型声明文件，当前不产生运行时代码覆盖。

## 优先顺序
- 第一批：`0%` 覆盖文件
- 第二批：`20%` 以下核心命令文件
- 第三批：`50%` 以下流程型文件
- 第四批：`80%~99%` 的收尾文件

## 备注
- 本文档已同步到本次 `pnpm test:coverage` 的最新结果
- 若后续重新运行覆盖率，文件数和百分比会随代码变动而变化
