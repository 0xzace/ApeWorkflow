## 1. P0: 修复安装 bug

- 1.1 修复 copyAttachedFiles 静默吞错，添加错误日志
- 1.2 确认 prompt 文件为什么没被复制，修复根因
- 1.3 验证安装后所有 prompt 文件存在

## 2. P0: 消除命令/Skill 镜像

- 2.1 修改 apply-change.ts, archive-change.ts, explore.ts 使命令模板从 Skill 模板单源生成
- 2.2 验证 apeworkflow update 生成的命令和 Skill 内容一致
- 2.3 删除 manual 同步的双份维护

## 3. P1: 清理硬编码路由表

- 3.1 删除 apply.md 中的硬编码路由表（功能开发/缺陷修复/重构/文档）
- 3.2 删除 archive.md 中的硬编码路由表
- 3.3 删除 verify.md 中的硬编码路由表
- 3.4 验证命令文件不再包含路由表

## 4. P1: 统一变更选择策略

- 4.1 修改 archive.md 和 verify.md 的变更选择逻辑，添加 auto-select
- 4.2 与 apply.md 保持一致：单变更时 auto-select，多变更时 AskUserQuestion
- 4.3 验证三个命令行为一致

## 5. P1: Workspace Planning 回退

- 5.1 修改 apply.md、archive.md、verify.md 中 workspace-planning guard
- 5.2 添加回退建议（/ape:explore + /ape:propose 两步法）
- 5.3 不再卡死

## 6. P1: 添加 /ape:help

- 6.1 创建 .claude/commands/ape/help.md
- 6.2 列出所有 /ape:* 命令，标注用途和状态（稳定/实验性）
- 6.3 添加当前活跃变更列表

## 7. P2: 归档日期碰撞自动解决

- 7.1 修改 archive 逻辑，检测日期碰撞时自动添加后缀
- 7.2 后缀策略: YYYY-MM-DD-<name>-<n>，n 从 1 递增
- 7.3 同时修复 bulk-archive 的同样问题

## 8. P2: Skill 元循环消除

- 8.1 修改 using-skills，添加"已在命令中加载时跳过检查"的标记
- 8.2 验证 /ape:apply 不会触发递归 Skill 调用

## 9. P2: Delta Spec 同步引导

- 9.1 在 archive.md 中添加 delta spec 说明（什么是、为什么推荐 sync）
- 9.2 在 bulk-archive 中增强冲突解析的用户可见性

## 10. P2: 成本意识

- 10.1 在 apply.md 添加：执行前显示预计子 agent 调用次数
- 10.2 提示"subagent-driven 每任务约 3 次调用"

## 11. P3: CLAUDE.md

- 11.1 创建 CLAUDE.md，说明 ApeWorkflow 工作流
- 11.2 包含快速开始、命令参考、常用路径

## 12. 验证

- 12.1 运行 apeworkflow init + apeworkflow update 验证安装
- 12.2 创建测试变更验证所有修复
- 12.3 验证 /ape:help 输出正确
- 12.4 验证归档日期碰撞自动解决
