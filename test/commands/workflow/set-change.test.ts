import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setChangeCommand } from '../../../src/commands/workflow/set-change.js';

// ---------------------------------------------------------------------------
// 扩展测试：setChangeCommand 的集成路径
// ---------------------------------------------------------------------------

describe('set change command', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let originalExitCode: typeof process.exitCode;

  beforeEach(() => {
    originalExitCode = process.exitCode;
    process.exitCode = undefined;
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    process.exitCode = originalExitCode;
  });

  // --- 缺参错误 ---

  it('在缺少名称时返回 JSON 错误状态', async () => {
    await setChangeCommand(undefined, { json: true });

    expect(logSpy).toHaveBeenCalled();
    const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(payload.change).toBeNull();
    expect(payload.status[0].message).toContain('Missing required argument <name>');
    expect(process.exitCode).toBe(1);
  });

  // --- initiative 指令选择器校验 ---

  describe('initiative 指令选择器校验', () => {
    it('同时提供 initiative 和 storePath 时应通过基础校验（后续因 planning home 失败）', async () => {
      // assertInitiativeReference 检查 initiative 是否为空，但不检查 storePath
      // 所以通过校验，但会因为 planning home 失败
      await setChangeCommand('test-change', {
        initiative: 'some-initiative',
        storePath: '/some/path',
        json: true,
      });
      const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(payload.change).toBeNull();
      expect(payload.status[0].code).toBe('change_error');
    });
  });

  // --- 名称校验 ---

  describe('名称校验', () => {
    it('拒绝包含空格的变更名', async () => {
      await setChangeCommand('my change', { json: true });
      const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(payload.change).toBeNull();
      expect(process.exitCode).toBe(1);
    });
  });
});
