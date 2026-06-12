# Proposal: Merge superpowers-5.1.0 Skills as TypeScript Templates

## Intent

将 superpowers-5.1.0 的 14 个 Skill（约 3200 行 Markdown）转换为 ApeWorkflow TypeScript 模板格式，统一放入 `src/core/templates/workflows/`，通过现有技能生成管线与 ApeWorkflow 自带的 11 个技能一起分发到各 Agent 的技能目录。

**原则：** 先融进来，后续优化流程。所有技能保持与 ApeWorkflow 原有技能一致的设计风格。

## Background

ApeWorkflow 的技能体系全部由 TypeScript 模板运行时生成（`src/core/templates/workflows/*.ts`）。superpowers-5.1.0 的技能是静态 Markdown 文件（14 个，3207 行），覆盖开发方法论。两者互补但需要统一分发机制。

**为什么需要合并：**
- 方法论技能（brainstorming, TDD, systematic-debugging 等）是 AI 代理的实用知识
- 当前 ApeWorkflow 只有 11 个面向工作流的技能，缺少方法论指导
- 统一格式后，所有 25 个技能通过同一管线分发，管理成本更低
- 抹掉 superpowers 命名痕迹，形成一致的 apeworkflow 品牌

## Scope

**In scope:**

- 将 superpowers 全部 14 个 SKILL.md 转换为 `src/core/templates/workflows/` 下的 TS 模板文件
- **统一命名：** 所有 25 个技能统一 `apeworkflow-` 前缀。原有 11 个技能已有前缀不变，14 个新技能加 `apeworkflow-` 前缀
- 抹掉技能内容中所有 `superpowers` 相关命名（共 37 处引用），替换为 `apeworkflow-` 或通用描述
- 修改 `getSkillTemplates()` 合并两类模板，返回 25 个技能
- 修改 `generateWorkspaceAgentSkills()` / `updateWorkspaceAgentSkills()` 统一分发
- 修改 `removeManagedWorkflowSkillDirs()` 只清理工作流技能（全局技能不被误删）
- 处理附属文件（scripts, references, examples）的同步逻辑
- 更新 `skill-templates.ts` 的导出
- 拆分 `SKILL_NAMES` 为 `WORKFLOW_SKILL_NAMES` + `GLOBAL_SKILL_NAMES`

**Out of scope:**

- 优化技能之间的调用流程（如 superpowers → ApeWorkflow 的衔接）
- 新增 profile 配置或过滤机制
- 自动检测 superpowers 技能
- 修改 superpowers 上游内容（本次转换一次性操作，后续优化另起 change）
- 附属文件的运行时更新（附属文件随 npm 包发布，技能生成时从 dist/assets/ 复制）

## 命名规则

```
原有（superpowers）       →  统一后（apeworkflow）
─────────────────────────────────────────────────
superpowers:testing...   →  apeworkflow-testing...
docs/superpowers/specs/          →  apeworkflow/specs/
docs/superpowers/plans/<file>.md →  apeworkflow/changes/<name>/plans/[序号]<file>.md
~/.config/superpowers/   →  本地 .worktrees/
"Superpowers works..."   →  "This works..."
using-superpowers        →  apeworkflow-using-skills
```

## 核心风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| 37 处 superpowers 引用替换遗漏 | 残留超 powers 痕迹 | 每个技能任务列出精确替换位置；Phase 4 用 grep 全量验证 |
| 附属文件路径转换不一致 | AI agent 读不到附属文件 | 统一方案 C：附属文件打包到 dist/assets/，生成管线从那里读取 |
| 反引号转义错误导致 TS 编译失败 | 大技能文件（writing-skills 655 行）编译错误 | 自动生成时转义；Phase 4 跑 pnpm build 验证 |
| 全局技能被 profile 切换误删 | 用户切换 profile 后方法论技能消失 | 通过 `workflowId` 判断过滤；`getManagedWorkspaceSkillEntries()` 只返回有 workflowId 的条目 |
| `SKILL_NAMES` 与 entries 不同步 | 检测逻辑与实际不一致 | 拆分为 WORKFLOW_SKILL_NAMES + GLOBAL_SKILL_NAMES，各自独立维护 |

## Approach

1. 14 个技能各创建一个 `src/core/templates/workflows/apeworkflow-<name>.ts` 文件
2. 解析原始 SKILL.md 的 frontmatter（name, description）和 body（instructions）
3. **同时抹掉所有 superpowers 命名：**
   - `superpowers:<skill>` → `apeworkflow-<skill>`（17 处技能引用）
   - `docs/superpowers/` → `apeworkflow/`（7 处路径）
   - `~/.config/superpowers/` → 去掉或替换（4 处）
   - "Superpowers" 文本 → "ApeWorkflow" 或通用描述（5 处）
   - `skills/<skill>/` 路径 → `<skill>/`（附属文件路径简化）
4. 用 template literal 包裹 body，转义所有 `` ` ``
5. 修改 `getSkillTemplates()` 双通道合并：11 个工作流按筛选 + 14 个全局无条件返回
6. 修改 workspace skills 管线统一分发
7. 附属文件打包到 `src/core/templates/assets/`，生成时从 `dist/assets/` 读取

## 架构设计：双通道技能管线

```
┌─────────────────────────────────────────────────────────────┐
│                    双通道技能管线                             │
│                                                             │
│  通道 1: 工作流技能 (11 个)                                  │
│  ALL_WORKFLOWS → CORE_WORKFLOWS → getSkillTemplates(ids)   │
│  → 随 profile 启用/禁用                                      │
│  → 有 /ape:* 命令行                                          │
│                                                             │
│  通道 2: 全局技能 (14 个)                                    │
│  ALL_GLOBAL_SKILLS → getSkillTemplates()                    │
│  → 始终存在，不受 profile 影响                                │
│  → 无命令行，纯 SKILL.md                                     │
│                                                             │
│  getSkillTemplates(ids) 返回 = 通道1(按筛选) + 通道2(全量)    │
└─────────────────────────────────────────────────────────────┘
```

**关键原则：**
- `ALL_WORKFLOWS` 保持 11 个不变
- 新增 `ALL_GLOBAL_SKILLS` 包含 14 个方法论技能
- `WORKFLOW_TO_SKILL_DIR` 只映射 11 个工作流技能
- 全局技能通过 `getSkillTemplates()` 直接访问，不需要额外映射
- 方法论技能不加入 profile 选择器 UI

## SkillTemplateEntry 类型设计

```typescript
interface SkillTemplateEntry {
  template: SkillTemplate;
  dirName: string;
  workflowId?: string;  // 工作流技能有，全局技能无
}

// 判断类型用 workflowId，不用多余的 scope 字段
function isWorkflowEntry(e: SkillTemplateEntry): boolean {
  return e.workflowId !== undefined;
}
function isGlobalEntry(e: SkillTemplateEntry): boolean {
  return e.workflowId === undefined;
}
```

用 `workflowId` 做天然区分，避免新增冗余字段导致现有条目也需要手动设置 `scope`。
