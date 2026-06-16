import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const showCommandMocks = vi.hoisted(() => ({
  select: vi.fn(),
  getActiveChangeIds: vi.fn(),
  getSpecIds: vi.fn(),
}));

vi.mock('@inquirer/prompts', () => ({
  select: showCommandMocks.select,
}));

vi.mock('../../src/utils/item-discovery.js', () => ({
  getActiveChangeIds: showCommandMocks.getActiveChangeIds,
  getSpecIds: showCommandMocks.getSpecIds,
}));

import { ShowCommand } from '../../src/commands/show.js';
import { ChangeCommand } from '../../src/commands/change.js';
import { SpecCommand } from '../../src/commands/spec.js';

describe('show command interactive entrypoint', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let originalEnv: NodeJS.ProcessEnv;
  let originalStdinTTY: boolean | undefined;
  let originalExitCode: typeof process.exitCode;
  const restoreSpies: Array<() => void> = [];

  beforeEach(() => {
    // 中文注释：这里专门覆盖交互分支，所以把 TTY 和选择器都固定住。
    originalEnv = { ...process.env };
    originalStdinTTY = (process.stdin as NodeJS.ReadStream & { isTTY?: boolean }).isTTY;
    originalExitCode = process.exitCode;
    delete process.env.OPEN_SPEC_INTERACTIVE;
    delete process.env.CI;
    (process.stdin as NodeJS.ReadStream & { isTTY?: boolean }).isTTY = true;
    process.exitCode = undefined;
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    showCommandMocks.select.mockReset();
    showCommandMocks.getActiveChangeIds.mockReset();
    showCommandMocks.getSpecIds.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    (process.stdin as NodeJS.ReadStream & { isTTY?: boolean }).isTTY = originalStdinTTY;
    process.exitCode = originalExitCode;
    errorSpy.mockRestore();
    while (restoreSpies.length > 0) {
      restoreSpies.pop()?.();
    }
    vi.restoreAllMocks();
  });

  it('会在未传 item 时先选择类型，再进入 change 展示', async () => {
    showCommandMocks.select
      .mockResolvedValueOnce('change')
      .mockResolvedValueOnce('alpha');
    showCommandMocks.getActiveChangeIds.mockResolvedValue(['alpha']);
    const showSpy = vi.spyOn(ChangeCommand.prototype, 'show').mockResolvedValue();
    restoreSpies.push(() => showSpy.mockRestore());

    await new ShowCommand().execute(undefined, {});

    expect(showCommandMocks.select).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        message: 'What would you like to show?',
      })
    );
    expect(showCommandMocks.select).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        message: 'Pick a change',
      })
    );
    expect(showSpy).toHaveBeenCalledWith('alpha', {});
  });

  it('会在未传 item 时提示 spec 为空', async () => {
    showCommandMocks.select.mockResolvedValueOnce('spec');
    showCommandMocks.getSpecIds.mockResolvedValue([]);

    await new ShowCommand().execute(undefined, {});

    expect(errorSpy).toHaveBeenCalledWith('No specs found.');
    expect(process.exitCode).toBe(1);
  });
});
