import { describe, expect, it } from 'vitest';

import {
  getPreferredWorkspaceSkillAgentId,
  parseSetupOpenerOption,
  parseWorkspaceAgentOverride,
  resolveWorkspaceOpenOpener,
  resolveWorkspaceOpenOpenerOverride,
} from '../../../src/commands/workspace/opener-selection.js';
import { parseWorkspacePreferredOpenerValue } from '../../../src/core/workspace/index.js';

describe('workspace opener selection helpers', () => {
  it('会解析 setup opener 和 agent override', async () => {
    expect(parseSetupOpenerOption(undefined)).toBeUndefined();
    expect(parseSetupOpenerOption('editor')).toEqual(parseWorkspacePreferredOpenerValue('editor'));
    expect(() => parseSetupOpenerOption('bad-opener')).toThrow(/Unsupported workspace opener/u);

    expect(parseWorkspaceAgentOverride('claude')).toEqual(
      parseWorkspacePreferredOpenerValue('claude')
    );
    expect(() => parseWorkspaceAgentOverride('editor')).toThrow(/Unsupported workspace agent/u);
  });

  it('会解析 opener override 并尊重已保存的 preferred opener', async () => {
    expect(
      resolveWorkspaceOpenOpenerOverride({
        agent: 'codex-cli',
      } as any)
    ).toEqual(parseWorkspacePreferredOpenerValue('codex-cli'));

    expect(
      resolveWorkspaceOpenOpenerOverride({
        editor: true,
      } as any)
    ).toEqual(parseWorkspacePreferredOpenerValue('editor'));

    expect(() =>
      resolveWorkspaceOpenOpenerOverride({
        agent: 'codex-cli',
        editor: true,
      } as any)
    ).toThrow(/not both/u);

    await expect(
      resolveWorkspaceOpenOpener(
        {
          preferred_opener: parseWorkspacePreferredOpenerValue('editor'),
        },
        {}
      )
    ).resolves.toEqual(parseWorkspacePreferredOpenerValue('editor'));
  });

  it('会处理 workspace skill agent id 的兼容映射', () => {
    expect(getPreferredWorkspaceSkillAgentId(undefined)).toBeNull();
    expect(getPreferredWorkspaceSkillAgentId(parseWorkspacePreferredOpenerValue('editor'))).toBeNull();
  });
});
