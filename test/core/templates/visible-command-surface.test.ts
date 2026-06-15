import { describe, expect, it } from 'vitest';

import {
  VISIBLE_COMMAND_IDS,
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

  it('renders the core command table exactly', () => {
    expect(renderVisibleCoreCommandTable()).toBe(`**Core workflow**

| Command | What it does |
|---|---|
| \`/ape:explore\` | Think through problems before or during work |
| \`/ape:propose\` | Create a change and generate all artifacts |
| \`/ape:apply\` | Implement tasks from a change |
| \`/ape:archive\` | Archive a completed change |`);
  });

  it('renders the additional command table exactly', () => {
    expect(renderVisibleAdditionalCommandTable()).toBe(`**Additional commands**

| Command | What it does |
|---|---|
| \`/ape:verify\` | Verify implementation matches artifacts |
| \`/ape:onboard\` | Learn the ApeWorkflow workflow |
| \`/ape:bulk-archive\` | Archive multiple completed changes |
| \`/ape:feedback\` | Submit feedback about ApeWorkflow |`);
  });

  it('renders the combined reference exactly', () => {
    expect(renderVisibleCommandReference()).toBe(`**Core workflow**

| Command | What it does |
|---|---|
| \`/ape:explore\` | Think through problems before or during work |
| \`/ape:propose\` | Create a change and generate all artifacts |
| \`/ape:apply\` | Implement tasks from a change |
| \`/ape:archive\` | Archive a completed change |

**Additional commands**

| Command | What it does |
|---|---|
| \`/ape:verify\` | Verify implementation matches artifacts |
| \`/ape:onboard\` | Learn the ApeWorkflow workflow |
| \`/ape:bulk-archive\` | Archive multiple completed changes |
| \`/ape:feedback\` | Submit feedback about ApeWorkflow |`);
  });

  it('renders a visible next-step prompt exactly', () => {
    expect(renderVisibleNextStep('propose')).toBe('`/ape:propose`');
  });
});
