import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const validateMocks = vi.hoisted(() => ({
  select: vi.fn(),
  getActiveChangeIds: vi.fn(),
  getSpecIds: vi.fn(),
  isInteractive: vi.fn(),
  resolveNoInteractive: vi.fn(),
}));

vi.mock('@inquirer/prompts', () => ({
  select: validateMocks.select,
}));

vi.mock('../../src/utils/item-discovery.js', () => ({
  getActiveChangeIds: validateMocks.getActiveChangeIds,
  getSpecIds: validateMocks.getSpecIds,
}));

vi.mock('../../src/utils/interactive.js', () => ({
  isInteractive: validateMocks.isInteractive,
  resolveNoInteractive: validateMocks.resolveNoInteractive,
}));

describe('validate command branch coverage', () => {
  let originalExitCode: typeof process.exitCode;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // 中文注释：这里只补 validate 的分支，不走真实文件系统校验。
    originalExitCode = process.exitCode;
    process.exitCode = undefined;
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    validateMocks.select.mockReset();
    validateMocks.getActiveChangeIds.mockReset();
    validateMocks.getSpecIds.mockReset();
    validateMocks.isInteractive.mockReset();
    validateMocks.resolveNoInteractive.mockReset();
    validateMocks.resolveNoInteractive.mockReturnValue(false);
  });

  afterEach(() => {
    errorSpy.mockRestore();
    process.exitCode = originalExitCode;
    vi.clearAllMocks();
  });

  it('会在交互式 one 选择但没有项目时直接退出', async () => {
    validateMocks.isInteractive.mockReturnValue(true);
    validateMocks.select.mockResolvedValueOnce('one');
    validateMocks.getActiveChangeIds.mockResolvedValue([]);
    validateMocks.getSpecIds.mockResolvedValue([]);

    const { ValidateCommand } = await import('../../src/commands/validate.js');

    await new ValidateCommand().execute(undefined, {});

    expect(errorSpy).toHaveBeenCalledWith('No items found to validate.');
    expect(process.exitCode).toBe(1);
  });

  it('会在未知条目时给出建议', async () => {
    validateMocks.isInteractive.mockReturnValue(false);
    validateMocks.getActiveChangeIds.mockResolvedValue(['alpha', 'beta']);
    validateMocks.getSpecIds.mockResolvedValue(['gamma']);

    const { ValidateCommand } = await import('../../src/commands/validate.js');

    await new ValidateCommand().execute('alph', {});

    expect(errorSpy).toHaveBeenCalledWith("Unknown item 'alph'");
    expect(
      errorSpy.mock.calls.some((call) => String(call[0]).includes('Did you mean:'))
    ).toBe(true);
    expect(process.exitCode).toBe(1);
  });

  it('会拒绝同时命中 change 和 spec 的条目', async () => {
    validateMocks.isInteractive.mockReturnValue(false);
    validateMocks.getActiveChangeIds.mockResolvedValue(['shared']);
    validateMocks.getSpecIds.mockResolvedValue(['shared']);

    const { ValidateCommand } = await import('../../src/commands/validate.js');

    await new ValidateCommand().execute('shared', {});

    expect(errorSpy).toHaveBeenCalledWith(
      "Ambiguous item 'shared' matches both a change and a spec."
    );
    expect(process.exitCode).toBe(1);
  });

  it('会在批量校验没有项目时输出空结果', async () => {
    validateMocks.isInteractive.mockReturnValue(false);
    validateMocks.getActiveChangeIds.mockResolvedValue([]);
    validateMocks.getSpecIds.mockResolvedValue([]);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { ValidateCommand } = await import('../../src/commands/validate.js');

    await new ValidateCommand().execute(undefined, {
      all: true,
      json: true,
      noInteractive: true,
    });

    const payload = JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string);
    expect(payload.summary.totals).toEqual({ items: 0, passed: 0, failed: 0 });
    expect(payload.items).toEqual([]);
    expect(process.exitCode).toBe(0);
    logSpy.mockRestore();
  });
});
