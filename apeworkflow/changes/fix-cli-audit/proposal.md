# Why

ApeWorkflow CLI 的用户体验存在 13 个经过代码验证的问题，从致命 bug（prompt 文件未安装）到设计缺陷（命令/Skill 镜像重复、任务路由分裂），覆盖了从新用户发现到日常使用的全链路。

这份变更修复所有 13 个问题。

# What Changes

- 修复 `copyAttachedFiles` 静默吞错，确保 prompt 文件正确安装（P0-1）
- 消除命令与 Skill 的镜像重复，提供单源维护方案（P0-2）
- 删除命令文件中的硬编码任务路由表，统一依赖 CLI 返回（P1-3）
- 清理 verify.md 中不可执行的幻觉路由表（P1-4）
- 统一变更选择策略（apply/archive/verify 一致）（P1-5）
- 为 Workspace Planning 添加回退方案（P1-6）
- 添加 `/ape:help` 命令发现入口（P1-7）
- 提供"轻量模式"降低最小变更单位（P2-8）
- 归档日期碰撞自动解决（P2-9）
- 消除 Skill 元循环调用风险（P2-10）
- Delta Spec 同步的用户引导（P2-11）
- 成本意识提示（P2-12）
- 添加 CLAUDE.md 项目级入口（P3-13）

# Capabilities

### New Capabilities
- `cli-audit-fix`: 修复 P0+P1 致命/高优先级问题
- `lite-change-mode`: 降低最小变更单位的 artifact 负担
- `archive-self-heal`: 归档日期碰撞自动解决
- `cost-estimation`: 操作前成本提示
- `cli-discovery`: `/ape:help` 命令发现

### Modified Capabilities
- `skill-discovery`: 消除命令/Skill 镜像，统一来源
- `task-routing`: 删除硬编码路由表，依赖 CLI 动态返回
- `change-selection`: 统一 auto-select 策略
- `delta-spec-sync`: 添加用户引导说明

# Impact

- `src/core/workspace/skills.ts`: 修复 copyAttachedFiles 错误处理
- `src/core/templates/workflows/*.ts`: 去重命令/Skill 模板
- `.claude/commands/ape/*.md`: 删除硬编码路由表，添加 /ape:help
- 新增 CLAUDE.md
- 新增 lite-change 模板和配置
