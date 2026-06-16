import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  setChangeCommand,
} from '../../../src/commands/workflow/set-change.js';

describe('set change command — JSON 路径', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let originalExitCode: typeof process.exitCode;

  beforeEach(() => {
    originalExitCode = process.exitCode;
    process.exitCode = undefined;
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    process.exitCode = originalExitCode;
  });

  // --- initiative 为空 ---

  it('在 initiative 为空字符串时抛出错误', async () => {
    await setChangeCommand('test-change', { initiative: '', json: true });

    const payload = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(payload.change).toBeNull();
    expect(payload.status[0].message).toContain('Pass --initiative <id>');
    expect(process.exitCode).toBe(1);
  });

  it('在 initiative 仅为空格时抛出错误', async () => {
    await setChangeCommand('test-change', { initiative: '   ', json: true });

    const payload = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(payload.change).toBeNull();
    expect(process.exitCode).toBe(1);
  });

  it('在 initiative 有效但未提供 name 时抛出缺参错误', async () => {
    await setChangeCommand(undefined, { initiative: 'team-alpha', json: true });

    const payload = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(payload.change).toBeNull();
    expect(payload.status[0].message).toContain('Missing required argument <name>');
    expect(process.exitCode).toBe(1);
  });
});
