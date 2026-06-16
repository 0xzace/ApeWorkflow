import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ShowCommand } from '../../src/commands/show.js';
import { ChangeCommand } from '../../src/commands/change.js';
import { SpecCommand } from '../../src/commands/spec.js';
import * as itemDiscovery from '../../src/utils/item-discovery.js';

vi.mock('../../src/utils/item-discovery.js', () => ({
  // 中文注释：这里固定候选集合，方便覆盖 show 命令的查找、歧义和提示分支。
  getActiveChangeIds: vi.fn(),
  getSpecIds: vi.fn(),
}));

describe('show command entrypoint', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let originalExitCode: typeof process.exitCode;
  let originalEnv: NodeJS.ProcessEnv;
  const restoreSpies: Array<() => void> = [];

  beforeEach(() => {
    // 中文注释：这里只覆盖最稳定的空参数分支，确保提示文本不会回退。
    originalExitCode = process.exitCode;
    originalEnv = { ...process.env };
    process.exitCode = undefined;
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    logSpy.mockRestore();
    while (restoreSpies.length > 0) {
      restoreSpies.pop()?.();
    }
    process.exitCode = originalExitCode;
    process.env = originalEnv;
  });

  it('在非交互模式且没有参数时输出帮助提示', async () => {
    process.env.OPEN_SPEC_INTERACTIVE = '0';

    await new ShowCommand().execute(undefined, {});

    expect(errorSpy).toHaveBeenCalledWith('Nothing to show. Try one of:');
    expect(process.exitCode).toBe(1);
  });

  it('在显式指定 change 类型时会直接调用 change show', async () => {
    vi.mocked(itemDiscovery.getActiveChangeIds).mockResolvedValue(['alpha']);
    const spy = vi.spyOn(ChangeCommand.prototype, 'show').mockResolvedValue();
    restoreSpies.push(() => spy.mockRestore());

    await new ShowCommand().execute('alpha', { type: 'change' });

    expect(spy).toHaveBeenCalledWith('alpha', { type: 'change' });
    expect(process.exitCode).toBeUndefined();
  });

  it('在显式指定 spec 类型时会直接调用 spec show', async () => {
    vi.mocked(itemDiscovery.getSpecIds).mockResolvedValue(['spec-a']);
    const spy = vi.spyOn(SpecCommand.prototype, 'show').mockResolvedValue();
    restoreSpies.push(() => spy.mockRestore());

    await new ShowCommand().execute('spec-a', { type: 'spec', json: true });

    expect(spy).toHaveBeenCalledWith('spec-a', { type: 'spec', json: true });
    expect(process.exitCode).toBeUndefined();
  });

  it('当 item 同时命中 change 和 spec 时会报歧义错误', async () => {
    vi.mocked(itemDiscovery.getActiveChangeIds).mockResolvedValue(['shared']);
    vi.mocked(itemDiscovery.getSpecIds).mockResolvedValue(['shared']);

    await new ShowCommand().execute('shared', {});

    expect(errorSpy).toHaveBeenCalledWith(
      "Ambiguous item 'shared' matches both a change and a spec."
    );
    expect(errorSpy).toHaveBeenCalledWith(
      'Pass --type change|spec, or use: apeworkflow change show / apeworkflow spec show'
    );
    expect(process.exitCode).toBe(1);
  });

  it('当 item 不存在时会给出相似项提示', async () => {
    vi.mocked(itemDiscovery.getActiveChangeIds).mockResolvedValue(['alpha']);
    vi.mocked(itemDiscovery.getSpecIds).mockResolvedValue(['beta']);

    await new ShowCommand().execute('alpah', {});

    expect(errorSpy).toHaveBeenCalledWith("Unknown item 'alpah'");
    expect(errorSpy).toHaveBeenCalledWith('Did you mean: alpha, beta?');
    expect(process.exitCode).toBe(1);
  });

  it('会忽略与当前类型无关的 flags', async () => {
    vi.mocked(itemDiscovery.getActiveChangeIds).mockResolvedValue(['alpha']);
    const spy = vi.spyOn(ChangeCommand.prototype, 'show').mockResolvedValue();
    restoreSpies.push(() => spy.mockRestore());

    await new ShowCommand().execute('alpha', { type: 'change', requirements: true });

    expect(errorSpy).toHaveBeenCalledWith(
      'Warning: Ignoring flags not applicable to change: requirements'
    );
    expect(spy).toHaveBeenCalledWith('alpha', { type: 'change', requirements: true });
  });
});
