---
name: "APE: Help"
description: List all available ApeWorkflow commands and their current status
category: Workflow
tags: [workflow, help, discovery]
---

List all available ApeWorkflow commands. Show current active changes.

## Command Reference

**Core workflow**

| Command | What it does | Status |
|---|---|---|
| `/ape:onboard` | Guided onboarding - complete ApeWorkflow cycle with narration | Stable |
| `/ape:explore` | Think through problems before or during work (explore mode) | Stable |
| `/ape:propose` | Create a change and generate all artifacts, then refine through brainstorming | Stable |
| `/ape:apply` | Implement tasks from a change | Stable |
| `/ape:verify` | Verify implementation matches artifacts before archiving | Experimental |
| `/ape:archive` | Archive a completed change | Stable |
| `/ape:bulk-archive` | Archive multiple completed changes at once | Experimental |
| `/ape:feedback` | Submit feedback about ApeWorkflow | Stable |

## Active Changes

Run `apeworkflow list --json` to see active changes:

```bash
apeworkflow list --json
```

This shows:
- Change names
- Schema being used (spec-driven, workspace-planning, etc.)
- Artifact completion status
- Which changes are ready for apply/verify/archive

## Quick Tips

- **New to ApeWorkflow?** Start with `/ape:onboard`
- **Want to think first?** Use `/ape:explore`
- **Need to implement something?** Use `/ape:propose` to create a change
- **Want to resume old work?** Check `apeworkflow list` for active changes, then `/ape:apply <name>`
