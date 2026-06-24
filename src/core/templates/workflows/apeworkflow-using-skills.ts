/**
 * Skill Template: apeworkflow-using-skills
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';

export function getUsingSkillsSkillTemplate(): SkillTemplate {
  return {
    name: 'apeworkflow-using-skills',
    description: 'Use when starting any conversation - establishes how to find and use the relevant skills before responding',
    instructions: `# Using Skills

## Instruction Priority

ApeWorkflow skills override default system prompt behavior, but **user instructions always take precedence**:

1. **User's explicit instructions** (CLAUDE.md, GEMINI.md, AGENTS.md, direct requests) -- highest priority
2. **ApeWorkflow skills** -- override default system behavior where they conflict
3. **Default system prompt** -- lowest priority

If CLAUDE.md, GEMINI.md, or AGENTS.md says "don't use TDD" and a skill says "always use TDD," follow the user's instructions. The user is in control.

## How to Access Skills

**In Claude Code:** Use the \`Skill\` tool. When you invoke a skill, its content is loaded and presented to you--follow it directly. Never use the Read tool on skill files.

**In Copilot CLI:** Use the \`skill\` tool. Skills are auto-discovered from installed plugins. The \`skill\` tool works the same as Claude Code's \`Skill\` tool.

**In Gemini CLI:** Skills activate via the \`activate_skill\` tool. Gemini loads skill metadata at session start and activates the full content on demand.

**In other environments:** Check your platform's documentation for how skills are loaded.

## Platform Adaptation

Skills use Claude Code tool names. Non-CC platforms: see \`references/copilot-tools.md\` (Copilot CLI), \`references/codex-tools.md\` (Codex) for tool equivalents. Gemini CLI users get the tool mapping loaded automatically via GEMINI.md.

# Using Skills

## The Rule

**Invoke relevant or requested skills BEFORE responding to meaningful tasks.** The skill-checking strategy should respect the project's \`skills.loadPolicy\` config:

- **\`smart\` (default):** Check for skills when the user request involves development, debugging, testing, or any structured methodology. A simple factual question ("what's the version of X") does NOT need a skill check. A question about code structure, file organization, or implementation approach SHOULD be checked.
- **\`strict\`:** Check for skills before every response or action. Use this when you want maximum discipline.

If no \`skills.loadPolicy\` is configured, default to **smart** — check for skills on any development-related request, but skip the check for simple factual questions, greetings, or casual conversation.

When in doubt, a quick check is better than missing a relevant skill. If an invoked skill turns out to be wrong for the situation, you don't need to use it.

\`\`\`dot
digraph skill_flow {
    "User message received" [shape=doublecircle];
    "Might any skill apply?" [shape=diamond];
    "Invoke Skill tool" [shape=box];
    "Announce: 'Using [skill] to [purpose]'" [shape=box];
    "Has checklist?" [shape=diamond];
    "Create TodoWrite todo per item" [shape=box];
    "Follow skill exactly" [shape=box];
    "Respond (including clarifications)" [shape=doublecircle];

    "User message received" -> "Might any skill apply?";
    "Might any skill apply?" -> "Invoke Skill tool" [label="yes, development-related"];
    "Might any skill apply?" -> "Respond (including clarifications)" [label="no, factual/chit-chat"];
    "Invoke Skill tool" -> "Announce: 'Using [skill] to [purpose]'";
    "Announce: 'Using [skill] to [purpose]'" -> "Has checklist?";
    "Has checklist?" -> "Create TodoWrite todo per item" [label="yes"];
    "Has checklist?" -> "Follow skill exactly" [label="no"];
    "Create TodoWrite todo per item" -> "Follow skill exactly";
}
\`\`\`

## Red Flags

These thoughts mean STOP--you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Factual questions (e.g., "what's the version?") are fine. But any development-related request should check for skills. |
| "I need more context first" | If context requires methodology (debugging, TDD, etc.), check skills first. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first if exploration is development-related. |
| "I can check git/files quickly" | Files lack conversation context. If the work involves methodology, check skills. |
| "Let me gather information first" | Skills tell you HOW to gather information for development tasks. |
| "This doesn't need a formal skill" | If a skill exists for this methodology, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "This doesn't count as a task" | Any implementation action = task. Check for skills. |
| "The skill is overkill" | Simple things become complex. Use the skill. |
| "I'll just do this one thing first" | A single small action can have unexpected complexity. Check. |
| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
| "I know what that means" | Knowing the concept != using the skill. Invoke it. |

## Skill Priority

When multiple skills could apply, use this order:

1. **Process skills first** - these determine HOW to approach the task
2. **Implementation skills second** (frontend-design, mcp-builder) - these guide execution

"Let's build X" -> use the relevant process skill first, then implementation skills.
"Fix this bug" -> debugging first, then domain-specific skills.

## Skill Types

**Rigid** (TDD, debugging): Follow exactly. Don't adapt away discipline.

**Flexible** (patterns): Adapt principles to context.

The skill itself tells you which.

## User Instructions

Instructions say WHAT, not HOW. "Add X" or "Fix Y" doesn't mean skip workflows.
`,
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}

export function getApeUsingSkillsCommandTemplate(): CommandTemplate {
  return {
    name: 'APE: Using Skills',
    description: 'Find and apply skills to enhance your workflow capabilities',
    category: 'Methodology',
    tags: ['methodology', 'skills'],
    content: getUsingSkillsSkillTemplate().instructions,
  };
}
