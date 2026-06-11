# Supported Tools

ApeWorkflow works with many AI coding assistants. When you run `apeworkflow init`, ApeWorkflow configures selected tools using your active profile/workflow selection and delivery mode.

## How It Works

For each selected tool, ApeWorkflow can install:

1. **Skills** (if delivery includes skills): `.../skills/apeworkflow-*/SKILL.md`
2. **Commands** (if delivery includes commands): tool-specific `ape-*` command files

By default, ApeWorkflow uses the `core` profile, which includes:
- `propose`
- `explore`
- `apply`
- `sync`
- `archive`

You can enable expanded workflows (`new`, `continue`, `ff`, `verify`, `bulk-archive`, `onboard`) via `apeworkflow config profile`, then run `apeworkflow update`.

## Tool Directory Reference

| Tool (ID) | Skills path pattern | Command path pattern |
|-----------|---------------------|----------------------|
| Amazon Q Developer (`amazon-q`) | `.amazonq/skills/apeworkflow-*/SKILL.md` | `.amazonq/prompts/ape-<id>.md` |
| Antigravity (`antigravity`) | `.agent/skills/apeworkflow-*/SKILL.md` | `.agent/workflows/ape-<id>.md` |
| Auggie (`auggie`) | `.augment/skills/apeworkflow-*/SKILL.md` | `.augment/commands/ape-<id>.md` |
| IBM Bob Shell (`bob`) | `.bob/skills/apeworkflow-*/SKILL.md` | `.bob/commands/ape-<id>.md` |
| Claude Code (`claude`) | `.claude/skills/apeworkflow-*/SKILL.md` | `.claude/commands/ape/<id>.md` |
| Cline (`cline`) | `.cline/skills/apeworkflow-*/SKILL.md` | `.clinerules/workflows/ape-<id>.md` |
| CodeBuddy (`codebuddy`) | `.codebuddy/skills/apeworkflow-*/SKILL.md` | `.codebuddy/commands/ape/<id>.md` |
| Codex (`codex`) | `.codex/skills/apeworkflow-*/SKILL.md` | `$CODEX_HOME/prompts/ape-<id>.md`\* |
| ForgeCode (`forgecode`) | `.forge/skills/apeworkflow-*/SKILL.md` | Not generated (no command adapter; use skill-based `/apeworkflow-*` invocations) |
| Continue (`continue`) | `.continue/skills/apeworkflow-*/SKILL.md` | `.continue/prompts/ape-<id>.prompt` |
| CoStrict (`costrict`) | `.cospec/skills/apeworkflow-*/SKILL.md` | `.cospec/apeworkflow/commands/ape-<id>.md` |
| Crush (`crush`) | `.crush/skills/apeworkflow-*/SKILL.md` | `.crush/commands/ape/<id>.md` |
| Cursor (`cursor`) | `.cursor/skills/apeworkflow-*/SKILL.md` | `.cursor/commands/ape-<id>.md` |
| Factory Droid (`factory`) | `.factory/skills/apeworkflow-*/SKILL.md` | `.factory/commands/ape-<id>.md` |
| Gemini CLI (`gemini`) | `.gemini/skills/apeworkflow-*/SKILL.md` | `.gemini/commands/ape/<id>.toml` |
| GitHub Copilot (`github-copilot`) | `.github/skills/apeworkflow-*/SKILL.md` | `.github/prompts/ape-<id>.prompt.md`\*\* |
| iFlow (`iflow`) | `.iflow/skills/apeworkflow-*/SKILL.md` | `.iflow/commands/ape-<id>.md` |
| Junie (`junie`) | `.junie/skills/apeworkflow-*/SKILL.md` | `.junie/commands/ape-<id>.md` |
| Kilo Code (`kilocode`) | `.kilocode/skills/apeworkflow-*/SKILL.md` | `.kilocode/workflows/ape-<id>.md` |
| Kimi CLI (`kimi`) | `.kimi/skills/apeworkflow-*/SKILL.md` | Not generated (no command adapter; use skill-based `/skill:apeworkflow-*` invocations) |
| Kiro (`kiro`) | `.kiro/skills/apeworkflow-*/SKILL.md` | `.kiro/prompts/ape-<id>.prompt.md` |
| Lingma (`lingma`) | `.lingma/skills/apeworkflow-*/SKILL.md` | `.lingma/commands/ape/<id>.md` |
| Mistral Vibe (`vibe`) | `.vibe/skills/apeworkflow-*/SKILL.md` | Not generated (no command adapter; use skill-based `/apeworkflow-*` invocations) |
| OpenCode (`opencode`) | `.opencode/skills/apeworkflow-*/SKILL.md` | `.opencode/commands/ape-<id>.md` |
| Pi (`pi`) | `.pi/skills/apeworkflow-*/SKILL.md` | `.pi/prompts/ape-<id>.md` |
| Qoder (`qoder`) | `.qoder/skills/apeworkflow-*/SKILL.md` | `.qoder/commands/ape/<id>.md` |
| Qwen Code (`qwen`) | `.qwen/skills/apeworkflow-*/SKILL.md` | `.qwen/commands/ape-<id>.toml` |
| RooCode (`roocode`) | `.roo/skills/apeworkflow-*/SKILL.md` | `.roo/commands/ape-<id>.md` |
| Trae (`trae`) | `.trae/skills/apeworkflow-*/SKILL.md` | Not generated (no command adapter; use skill-based `/apeworkflow-*` invocations) |
| Windsurf (`windsurf`) | `.windsurf/skills/apeworkflow-*/SKILL.md` | `.windsurf/workflows/ape-<id>.md` |

\* Codex commands are installed in the global Codex home (`$CODEX_HOME/prompts/` if set, otherwise `~/.codex/prompts/`), not your project directory.

\*\* GitHub Copilot prompt files are recognized as custom slash commands in IDE extensions (VS Code, JetBrains, Visual Studio). Copilot CLI does not currently consume `.github/prompts/*.prompt.md` directly.

## Non-Interactive Setup

For CI/CD or scripted setup, use `--tools` (and optionally `--profile`):

```bash
# Configure specific tools
apeworkflow init --tools claude,cursor

# Configure all supported tools
apeworkflow init --tools all

# Skip tool configuration
apeworkflow init --tools none

# Override profile for this init run
apeworkflow init --profile core
```

**Available tool IDs (`--tools`):** `amazon-q`, `antigravity`, `auggie`, `bob`, `claude`, `cline`, `codex`, `forgecode`, `codebuddy`, `continue`, `costrict`, `crush`, `cursor`, `factory`, `gemini`, `github-copilot`, `iflow`, `junie`, `kilocode`, `kimi`, `kiro`, `lingma`, `opencode`, `pi`, `qoder`, `qwen`, `roocode`, `trae`, `vibe`, `windsurf`

## Workflow-Dependent Installation

ApeWorkflow installs workflow artifacts based on selected workflows:

- **Core profile (default):** `propose`, `explore`, `apply`, `sync`, `archive`
- **Custom selection:** any subset of all workflow IDs:
  `propose`, `explore`, `new`, `continue`, `apply`, `ff`, `sync`, `archive`, `bulk-archive`, `verify`, `onboard`

In other words, skill/command counts are profile-dependent and delivery-dependent, not fixed.

## Generated Skill Names

When selected by profile/workflow config, ApeWorkflow generates these skills:

- `apeworkflow-propose`
- `apeworkflow-explore`
- `apeworkflow-new-change`
- `apeworkflow-continue-change`
- `apeworkflow-apply-change`
- `apeworkflow-ff-change`
- `apeworkflow-sync-specs`
- `apeworkflow-archive-change`
- `apeworkflow-bulk-archive-change`
- `apeworkflow-verify-change`
- `apeworkflow-onboard`

See [Commands](commands.md) for command behavior and [CLI](cli.md) for `init`/`update` options.

## Related

- [CLI Reference](cli.md) — Terminal commands
- [Commands](commands.md) — Slash commands and skills
- [Getting Started](getting-started.md) — First-time setup
