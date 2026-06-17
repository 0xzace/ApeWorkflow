---
name: "APE: Apply"
description: Keep the ApeWorkflow apply shell and route task execution through methodology skills (Experimental)
category: Workflow
tags: [workflow, artifacts, experimental]
---

Keep the ApeWorkflow apply shell and route task execution through methodology skills.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `apeworkflow list --json` to get available changes and use the **AskUserQuestion tool** to let the user select

   Always announce: "Using change: <name>" and how to override (e.g., `/ape:apply <other>`).

2. **Check status to understand the shell context**
   ```bash
   apeworkflow status --change "<name>" --json
   ```
   Parse the JSON to understand:
   - `schemaName`: The workflow being used (e.g., "spec-driven")
   - `planningHome`, `changeRoot`, and `actionContext`: planning scope and edit constraints
   - Which artifact contains the implementation plan and detailed plan file(s) (typically the files under `plans/`; check status for others)

3. **Get apply instructions and load the task list**

   ```bash
   apeworkflow instructions apply --change "<name>" --json
   ```

   This returns:
   - `contextFiles`: artifact ID -> array of concrete file paths (varies by schema - could be proposal/specs/design/tasks or spec/tests/implementation/docs)
   - Progress (total, complete, remaining)
   - Task list with status
   - Dynamic instruction based on current state

   **Handle states:**
   - If `state: "blocked"` (missing artifacts): show message, suggest using apeworkflow-continue-change
   - If `state: "all_done"`: congratulate, suggest archive
   - Otherwise: proceed to implementation

   **Workspace guard:** If status JSON reports `actionContext.mode: "workspace-planning"` and `allowedEditRoots` is empty, explain that full workspace apply is not supported in this slice. Treat linked repos and folders as read-only context, ask the user to select an affected area through an explicit implementation workflow, and STOP before editing files.

4. **Read context files**

   Read every file path listed under `contextFiles` from the apply instructions output.
   The files depend on the schema being used:
   - **spec-driven**: proposal, specs, design, and the detailed plan file(s) under `plans/`
   - Other schemas: follow the contextFiles from CLI output

   The detailed plan file(s) under `plans/` are the implementation source of truth.

5. **Dispatch by task type**

   For each pending task, use the task type to choose the methodology Skill chain, then let that Skill chain do the concrete implementation work.

   **Task type routing**

   Run `apeworkflow instructions apply --change "<name>" --json` to get the routing table.
   Use `taskTypeRouting` from the JSON output:
   - `taskTypeRouting.default`: fallback skill chain when task type is unrecognized
   - `taskTypeRouting.taskTypes.<type>`: skill chain for the specific task type

   ## 任务类型路由

   从 CLI 输出动态读取。运行 `apeworkflow instructions apply --change "<name>" --json`，
   使用返回 JSON 中的 `taskTypeRouting` 字段。示例：

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

   ### 统一规则
   - `apply` 阶段只负责根据任务类型分发到对应方法论 Skill
   - `verify` 阶段先提供验证证据，再进入 review
   - `archive` 阶段先收尾，再确认归档

   **Shell rule**: this command only owns selection, loading, routing, progress tracking, and pause/completion output. It does not describe or perform the detailed development steps itself.

6. **Show current progress**

   Display:
   - Schema being used
   - Progress: "N/M tasks complete"
   - Remaining tasks overview
   - Dynamic instruction from CLI

7. **On completion or pause, show status**

   Display:
   - Tasks completed this session
   - Overall progress: "N/M tasks complete"
   - If all done: suggest archive
   - If paused: explain why and wait for guidance

**Output During Implementation**

```
## Implementing: <change-name> (schema: <schema-name>)

Working on task 3/7: <task description>
[...implementation happening...]
✓ Task complete

Working on task 4/7: <task description>
[...implementation happening...]
✓ Task complete
```

**Output On Completion**

```
## Implementation Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 7/7 tasks complete ✓

### Completed This Session
- [x] Task 1
- [x] Task 2
...

All tasks complete! Ready to archive this change.
```

**Output On Pause (Issue Encountered)**

```
## Implementation Paused

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 4/7 tasks complete

### Issue Encountered
<description of the issue>

**Options:**
1. <option 1>
2. <option 2>
3. Other approach

What would you like to do?
```

**Guardrails**
- Keep going through tasks until done or blocked
- Always read context files before starting (from the apply instructions output)
- If task is ambiguous, pause and ask before implementing
- If implementation reveals issues, pause and suggest artifact updates
- Keep code changes minimal and scoped to each task
- Update task checkbox immediately after completing each task
- Pause on errors, blockers, or unclear requirements - don't guess
- Use contextFiles from CLI output, don't assume specific file names

**Fluid Workflow Integration**

This skill supports the "actions on a change" model:

- **Can be invoked anytime**: Before all artifacts are done (if tasks exist), after partial implementation, interleaved with other actions
- **Allows artifact updates**: If implementation reveals design issues, suggest updating artifacts - not phase-locked, work fluidly
