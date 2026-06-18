## MODIFIED Requirements

### Requirement: CLI Returns Complete Routing

The `apeworkflow instructions <phase> --change <name> --json` command SHALL return a `taskTypeRouting` object containing:
- `default`: the default skill chain when task type is not recognized
- `taskTypes`: a map from task type key to skill chain array

#### Scenario: Verify phase returns routing

- **WHEN** an AI agent calls `apeworkflow instructions verify --json`
- **THEN** the response includes `taskTypeRouting.default` and `taskTypeRouting.taskTypes`
- **AND** `taskTypeRouting.taskTypes` contains keys: `feature`, `bugfix`, `refactor`, `docs`

#### Scenario: Archive phase returns routing

- **WHEN** an AI agent calls `apeworkflow instructions archive --json`
- **THEN** the response includes the same routing structure

### Requirement: Templates Reference CLI Routing

All workflow template files (Skill templates AND command templates) SHALL reference the CLI for routing information, NOT embed routing tables directly.

#### Scenario: Verify template uses CLI directive

- **WHEN** an AI agent reads `apeworkflow-verify-change/SKILL.md` or `.claude/commands/ape/verify.md`
- **THEN** the file instructs the agent to use `apeworkflow instructions verify --change <name> --json` to get routing
- **AND** the file contains NO hardcoded mapping like `功能开发 → [skill chain]` or `feature → [skill chain]`

#### Scenario: Archive template uses CLI directive

- **WHEN** an AI agent reads `apeworkflow-archive-change/SKILL.md` or `.claude/commands/ape/archive.md`
- **THEN** the file instructs the agent to use `apeworkflow instructions archive --change <name> --json` to get routing
- **AND** the file contains NO hardcoded mapping like `功能开发 → [skill chain]` or `feature → [skill chain]`

### Requirement: No Hardcoded TaskTypeRouting in Templates

Template source files SHALL NOT contain a `taskRoutingBlock` or any variable that maps task type names to skill chains.

#### Scenario: verify-change.ts has no routing block

- **WHEN** reading `src/core/templates/workflows/verify-change.ts`
- **THEN** it does NOT define a variable named `taskRoutingBlock` or equivalent
- **AND** the file does not contain any Chinese routing keys

#### Scenario: archive-change.ts has no routing block

- **WHEN** reading `src/core/templates/workflows/archive-change.ts`
- **THEN** it does NOT define a variable named `taskRoutingBlock` or equivalent
- **AND** the file does not contain any Chinese routing keys

### Requirement: Installed Skills Match CLI Output

After `npm install -g @0xzace/apeworkflow`, the installed `.claude/skills/` files SHALL not contain any task routing tables.

#### Scenario: No routing tables in installed skills

- **WHEN** checking `.claude/skills/apeworkflow-verify-change/SKILL.md` and `.claude/skills/apeworkflow-archive-change/SKILL.md`
- **THEN** they contain a directive to call `apeworkflow instructions <phase> --json` for routing
- **AND** they do NOT contain any markdown table, list, or section that maps task types to skill chains

### Requirement: Consistent Task Type Keys

The task type keys used in `schema.yaml` SHALL be the only task type keys anywhere in the project: `feature`, `bugfix`, `refactor`, `docs`. No other files shall define their own set of task type keys (Chinese or otherwise).

#### Scenario: No stray key definitions in project

- **WHEN** searching all `.ts` template files under `src/core/templates/workflows/`
- **THEN** no file defines task type keys other than `feature`, `bugfix`, `refactor`, `docs`
- **AND** no file contains Chinese task type keys
