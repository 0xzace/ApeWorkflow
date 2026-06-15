export const VISIBLE_COMMAND_IDS = [
  'explore',
  'propose',
  'apply',
  'verify',
  'archive',
  'onboard',
  'bulk-archive',
  'feedback',
] as const;

export type VisibleCommandId = (typeof VISIBLE_COMMAND_IDS)[number];

type VisibleCommandGroup = 'core' | 'additional';

interface VisibleCommandEntry {
  id: VisibleCommandId;
  group: VisibleCommandGroup;
  description: string;
}

// 单一来源：所有用户可见命令都从这里分组派生，避免不同表格各自维护列表。
const VISIBLE_COMMANDS: readonly VisibleCommandEntry[] = [
  { id: 'explore', group: 'core', description: 'Think through problems before or during work' },
  { id: 'propose', group: 'core', description: 'Create a change and generate all artifacts' },
  { id: 'apply', group: 'core', description: 'Implement tasks from a change' },
  { id: 'archive', group: 'core', description: 'Archive a completed change' },
  { id: 'verify', group: 'additional', description: 'Verify implementation matches artifacts' },
  { id: 'onboard', group: 'additional', description: 'Learn the ApeWorkflow workflow' },
  { id: 'bulk-archive', group: 'additional', description: 'Archive multiple completed changes' },
  { id: 'feedback', group: 'additional', description: 'Submit feedback about ApeWorkflow' },
] as const;

const CORE_VISIBLE_COMMAND_IDS: readonly VisibleCommandId[] = VISIBLE_COMMANDS
  .filter((command) => command.group === 'core')
  .map((command) => command.id);

const ADDITIONAL_VISIBLE_COMMAND_IDS: readonly VisibleCommandId[] = VISIBLE_COMMANDS
  .filter((command) => command.group === 'additional')
  .map((command) => command.id);

function renderCommandRows(commandIds: readonly VisibleCommandId[]): string {
  return commandIds
    .map((commandId) => {
      const command = VISIBLE_COMMANDS.find((entry) => entry.id === commandId);
      return `| \`/ape:${commandId}\` | ${command?.description ?? ''} |`;
    })
    .join('\n');
}

function renderCommandTable(title: string, commandIds: readonly VisibleCommandId[]): string {
  return [
    `**${title}**`,
    '',
    '| Command | What it does |',
    '|---|---|',
    renderCommandRows(commandIds),
  ].join('\n');
}

export function renderVisibleCoreCommandTable(): string {
  return renderCommandTable('Core workflow', CORE_VISIBLE_COMMAND_IDS);
}

export function renderVisibleAdditionalCommandTable(): string {
  return renderCommandTable('Additional commands', ADDITIONAL_VISIBLE_COMMAND_IDS);
}

export function renderVisibleCommandReference(): string {
  return [renderVisibleCoreCommandTable(), '', renderVisibleAdditionalCommandTable()].join('\n');
}

export function renderVisibleNextStep(commandId: VisibleCommandId): string {
  return `\`/ape:${commandId}\``;
}
