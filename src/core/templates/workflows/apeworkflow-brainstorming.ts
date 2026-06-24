/**
 * Skill Template: apeworkflow-brainstorming
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';

export function getBrainstormingSkillTemplate(): SkillTemplate {
  return {
    name: 'apeworkflow-brainstorming',
    description: 'Use when you need to refine proposal.md, design.md, and tasks.md (outline only) through collaborative dialogue before writing the implementation plan files.',
    instructions: `# Brainstorming Ideas Into Refinements

Refine \`proposal.md\`, \`design.md\`, and \`tasks.md\` through collaborative dialogue, then hand off to \`writing-plans\`.
Treat \`tasks.md\` as the task outline only; the checkboxed execution steps live in \`plans/YYYY-MM-DD-<feature-name>.md\`.

Start by reading the current change artifacts and project context. Ask questions one at a time to fill gaps, surface trade-offs, and capture any requirement updates back into the artifacts. When the artifact set is coherent, invoke \`writing-plans\`.

<HARD-GATE>
Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until \`proposal.md\`, \`design.md\`, and \`tasks.md\` have been refined and handed off to \`writing-plans\`.
</HARD-GATE>

## Checklist

Use the **full 7-step** checklist for meaningful changes (features, refactors, multi-file work). Use the **lightweight** mode for trivial changes (typos, single-line fixes, simple renames, minor formatting).

### Full Checklist (default)

You MUST create a task for each of these items and complete them in order:

1. **Explore project context** - check files, docs, recent commits, and the current change artifacts
2. **Offer visual companion** (if topic will involve visual questions) - this is its own message, not combined with a clarifying question. See the Visual Companion section below
3. **Ask clarifying questions** - one at a time, understand purpose, constraints, and success criteria
4. **Propose 2-3 approaches** - with trade-offs and your recommendation when there is still a meaningful choice
5. **Update the change artifacts** - patch \`proposal.md\`, \`design.md\`, and \`tasks.md\` with the clarified requirements, dependencies, and scope changes; keep \`tasks.md\` as a plain task outline
6. **Reconcile the artifacts** - make sure the three files agree with each other and with the current understanding
7. **Transition to implementation planning** - invoke \`writing-plans\` to create the detailed implementation plan

### Lightweight Checklist (for trivial changes)

For changes that are clearly small (single file, single function, obvious fix), use this reduced checklist:

1. **Quick context check** - glance at the existing artifacts (just verify they're coherent, no deep dive)
2. **Confirm scope** - one question to confirm the change is appropriate (e.g., "Should I rename this variable in the whole function or just one place?")
3. **Update artifacts minimally** - patch only what needs changing (skip reconciliation unless scope is unclear)
4. **Hand off** - invoke \`writing-plans\`

Use lightweight mode when ALL of these are true:
- The change affects at most 1-2 files
- The fix is obvious (typo, formatting, simple rename, add missing validation)
- There's no architectural decision to make
- There are no cross-cutting concerns
- The user has described exactly what they want

If ANY condition is ambiguous, fall back to the full checklist.

## Process Flow

\`\`\`dot
digraph brainstorming {
    "Explore project context" [shape=box];
    "Visual questions ahead?" [shape=diamond];
    "Offer Visual Companion\n(own message, no other content)" [shape=box];
    "Ask clarifying questions" [shape=box];
    "Propose 2-3 approaches" [shape=box];
    "Update proposal/design/tasks" [shape=box];
    "Reconcile artifacts" [shape=box];
    "Invoke writing-plans skill" [shape=doublecircle];

    "Explore project context" -> "Visual questions ahead?";
    "Visual questions ahead?" -> "Offer Visual Companion\n(own message, no other content)" [label="yes"];
    "Visual questions ahead?" -> "Ask clarifying questions" [label="no"];
    "Offer Visual Companion\n(own message, no other content)" -> "Ask clarifying questions";
    "Ask clarifying questions" -> "Propose 2-3 approaches";
    "Propose 2-3 approaches" -> "Update proposal/design/tasks";
    "Update proposal/design/tasks" -> "Reconcile artifacts";
    "Reconcile artifacts" -> "Invoke writing-plans skill";
}
\`\`\`

**The terminal state is invoking writing-plans.** Do NOT invoke frontend-design, mcp-builder, or any other implementation skill. The ONLY skill you invoke after brainstorming is writing-plans.

## The Process

**Understanding the idea:**

- Read the current \`proposal.md\`, \`design.md\`, and \`tasks.md\` first
- Before asking detailed questions, assess scope: if the request describes multiple independent subsystems (e.g., "build a platform with chat, file storage, billing, and analytics"), flag this immediately. Don't spend questions refining details of a project that needs to be decomposed first
- If the project is too large for a single change, help the user decompose it into sub-projects: what are the independent pieces, how do they relate, and what order should they be built? Then refine the first sub-project through the normal brainstorming flow
- For appropriately-scoped changes, ask questions one at a time to refine the idea
- Prefer multiple choice questions when possible, but open-ended is fine too
- Only one question per message - if a topic needs more exploration, break it into multiple questions
- Focus on understanding: purpose, constraints, success criteria, and dependency order

**Exploring approaches:**

- Propose 2-3 different approaches with trade-offs
- Present options conversationally with your recommendation and reasoning
- Lead with your recommended option and explain why

**Updating the artifacts:**

- Patch \`proposal.md\` with the clarified what/why and any scope changes
- Patch \`design.md\` with the clarified how, dependencies, and boundaries
- Patch \`tasks.md\` with the corrected execution order, dependencies, and task breakdown as plain bullets or numbered items
- If a clarification changes one artifact, update the others so they stay consistent

**Reconciliation:**

- Re-read the three artifacts together and check that they agree
- Make dependency order explicit where it matters
- Remove ambiguity before handing off to \`writing-plans\`
- Do not create a separate design doc in this skill

## Key Principles

- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Easier to answer than open-ended when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all refinements
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Incremental validation** - Update the artifacts as understanding improves
- **Be flexible** - Go back and clarify when something doesn't make sense

## What You Might Do

Depending on what the user brings, you might:

**Refine the problem space**
- Ask clarifying questions that emerge from what they said
- Challenge assumptions
- Reframe the problem
- Find analogies

**Refine the change artifacts**
- Tighten scope in \`proposal.md\`
- Adjust architecture or boundaries in \`design.md\`
- Reorder or split work in \`tasks.md\`

**Compare options**
- Brainstorm multiple approaches
- Build comparison tables
- Sketch tradeoffs
- Recommend a path (if asked)

**Visualize**
\`\`\`
┌─────────────────────────────────────────┐
│     Use ASCII diagrams liberally        │
├─────────────────────────────────────────┤
│                                         │
│      ┌────────┐         ┌────────┐      │
│      │ State  │────────▶│ State  │      │
│      │   A    │         │   B    │      │
│      └────────┘         └────────┘      │
│                                         │
│   System diagrams, state machines,      │
│   data flows, architecture sketches,    │
│   dependency graphs, comparison tables  │
│                                         │
└─────────────────────────────────────────┘
\`\`\`

**Surface risks and unknowns**
- Identify what could go wrong
- Find gaps in understanding
- Suggest spikes or investigations

## What You Don't Have To Do

- Follow a script
- Ask the same questions every time
- Produce a separate design doc
- Reach a conclusion before the artifacts are coherent
- Stay on topic if a tangent is valuable
- Be brief (this is thinking time)

## Visual Companion

A browser-based companion for showing mockups, diagrams, and visual options during brainstorming. Available as a tool — not a mode. Accepting the companion means it's available for questions that benefit from visual treatment; it does NOT mean every question goes through the browser.

**Offering the companion:** When you anticipate that upcoming questions will involve visual content (mockups, layouts, diagrams), offer it once for consent:
> "Some of what we're working on might be easier to explain if I can show it to you in a web browser. I can put together mockups, diagrams, comparisons, and other visuals as we go. This feature is still new and can be token-intensive. Want to try it? (Requires opening a local URL)"

**This offer MUST be its own message.** Do not combine it with clarifying questions, context summaries, or any other content. The message should contain ONLY the offer above and nothing else. Wait for the user's response before continuing. If they decline, proceed with text-only brainstorming.

**Per-question decision:** Even after the user accepts, decide FOR EACH QUESTION whether to use the browser or the terminal. The test: **would the user understand this better by seeing it than reading it?**

- **Use the browser** for content that IS visual — mockups, wireframes, layout comparisons, architecture diagrams, side-by-side visual designs
- **Use the terminal** for content that is text — requirements questions, conceptual choices, tradeoff lists, A/B/C/D text options, scope decisions

A question about a UI topic is not automatically a visual question. "What does personality mean in this context?" is a conceptual question — use the terminal. "Which wizard layout works better?" is a visual question — use the browser.

If they agree to the companion, read the detailed guide before proceeding:
\`brainstorming/visual-companion.md\`
`,
    license: 'MIT',
    compatibility: '',
    metadata: { author: 'apeworkflow', version: '1.0' },
  };
}

export function getApeBrainstormingCommandTemplate(): CommandTemplate {
  return {
    name: 'APE: Brainstorming',
    description: 'Start brainstorming — explore ideas and design collaboratively',
    category: 'Methodology',
    tags: ['methodology', 'brainstorming', 'design'],
    content: getBrainstormingSkillTemplate().instructions,
  };
}
