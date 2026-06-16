import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { newChangeCommand } from '../../../src/commands/workflow/new-change.js';

// ---------------------------------------------------------------------------
// 扩展测试：newChangeCommand 的集成路径
// ---------------------------------------------------------------------------

describe('new change command', () => {
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
    await newChangeCommand(undefined, { json: true });

    expect(logSpy).toHaveBeenCalled();
    const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(payload.change).toBeNull();
    expect(payload.status[0].message).toContain('Missing required argument <name>');
    expect(process.exitCode).toBe(1);
  });

  // --- 名称校验 ---

  describe('名称校验', () => {
    it('拒绝包含空格的名称', async () => {
      await newChangeCommand('my change', { json: true });
      const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(payload.change).toBeNull();
      expect(process.exitCode).toBe(1);
    });

    it('拒绝以大写字母开头的名称', async () => {
      await newChangeCommand('MyChange', { json: true });
      const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(payload.change).toBeNull();
      expect(process.exitCode).toBe(1);
    });

    it('拒绝以连字符开头的名称', async () => {
      await newChangeCommand('-bad-name', { json: true });
      const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(payload.change).toBeNull();
      expect(process.exitCode).toBe(1);
    });

    it('拒绝以连字符结尾的名称', async () => {
      await newChangeCommand('bad-name-', { json: true });
      const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(payload.change).toBeNull();
      expect(process.exitCode).toBe(1);
    });

    it('拒绝包含连续连字符的名称', async () => {
      await newChangeCommand('bad--name', { json: true });
      const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(payload.change).toBeNull();
      expect(process.exitCode).toBe(1);
    });
  });

  // --- initiative 选择器校验 ---

  describe('initiative 选择器校验', () => {
    it('同时提供 initiative 和 store 时应通过校验', async () => {
      // 这会因找不到 planning home 而失败，但不应是 initiative 选择器错误
      await newChangeCommand('test-change', {
        initiative: 'some-initiative',
        store: 'some-store',
        json: true,
      });
      const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(payload.change).toBeNull();
      // 错误应该是 planning home 相关的，而非 initiative selector
      expect(payload.status[0].message).not.toContain('initiative');
    });
  });

  // --- 非法 initiative 指令选择器 ---

  describe('非法 initiative 指令选择器', () => {
    it('同时提供 initiative 和 storePath 时应通过基础校验（后续因 planning home 失败）', async () => {
      // assertInitiativeSelectorsHaveReference 只检查 store/storePath 在没有 initiative 时
      // 这里 initiative 存在，所以通过校验，但会因为找不到 planning home 失败
      await newChangeCommand('test-change', {
        initiative: 'some-initiative',
        storePath: '/some/path',
        json: true,
      });
      const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(payload.change).toBeNull();
      // 错误应为 planning home 相关
      expect(payload.status[0].code).toBe('invalid_context_store_path');
    });
  });
});
