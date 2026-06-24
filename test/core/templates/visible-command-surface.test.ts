import { describe, expect, it } from 'vitest';

import {
  VISIBLE_COMMAND_IDS,
  getVisibleCommandEntries,
  renderVisibleAdditionalCommandTable,
  renderVisibleCommandReference,
  renderVisibleCoreCommandTable,
  renderVisibleNextStep,
} from '../../../src/core/templates/visible-command-surface.js';

describe('visible-command-surface', () => {
  it('exports only the eight visible commands', () => {
    expect(VISIBLE_COMMAND_IDS).toEqual([
      'explore',
      'propose',
      'apply',
      'verify',
      'archive',
      'onboard',
      'bulk-archive',
      'feedback',
    ]);
  });

  it('exports the visible command entries in the same order', () => {
    expect(getVisibleCommandEntries().map((entry) => entry.id)).toEqual([
      'explore',
      'propose',
      'apply',
      'archive',
      'verify',
      'onboard',
      'bulk-archive',
      'feedback',
    ]);
    expect(getVisibleCommandEntries().map((entry) => entry.description)).toEqual([
      'Think through problems before implementation',
      'Create a change and generate all planning artifacts',
      'Implement tasks from an existing change',
      'Archive a completed change',
      'Verify implementation matches planning artifacts',
      'Walk through the complete workflow with a real example',
      'Archive multiple completed changes at once',
      'Submit feedback about ApeWorkflow',
    ]);
  });

  it('renders the core command table exactly', () => {
    expect(renderVisibleCoreCommandTable()).toBe(`**Core workflow**

| Command | What it does |
|---|---|
| \`/ape:explore\` | Think through problems before implementation |
| \`/ape:propose\` | Create a change and generate all planning artifacts |
| \`/ape:apply\` | Implement tasks from an existing change |
| \`/ape:archive\` | Archive a completed change |`);
  });

  it('renders the additional command table exactly', () => {
    expect(renderVisibleAdditionalCommandTable()).toBe(`**Additional commands**

| Command | What it does |
|---|---|
| \`/ape:verify\` | Verify implementation matches planning artifacts |
| \`/ape:onboard\` | Walk through the complete workflow with a real example |
| \`/ape:bulk-archive\` | Archive multiple completed changes at once |
| \`/ape:feedback\` | Submit feedback about ApeWorkflow |`);
  });

  it('renders the combined reference exactly', () => {
    expect(renderVisibleCommandReference()).toBe(`**Core workflow**

| Command | What it does |
|---|---|
| \`/ape:explore\` | Think through problems before implementation |
| \`/ape:propose\` | Create a change and generate all planning artifacts |
| \`/ape:apply\` | Implement tasks from an existing change |
| \`/ape:archive\` | Archive a completed change |

**Additional commands**

| Command | What it does |
|---|---|
| \`/ape:verify\` | Verify implementation matches planning artifacts |
| \`/ape:onboard\` | Walk through the complete workflow with a real example |
| \`/ape:bulk-archive\` | Archive multiple completed changes at once |
| \`/ape:feedback\` | Submit feedback about ApeWorkflow |`);
  });

  it('renders a visible next-step prompt exactly', () => {
    expect(renderVisibleNextStep('propose')).toBe('`/ape:propose`');
  });
});
