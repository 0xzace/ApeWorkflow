import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('postinstall script', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // 中文注释：通过环境变量分别覆盖“跳过”和“输出提示”两个分支。
    originalEnv = { ...process.env };
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    logSpy.mockRestore();
    vi.resetModules();
  });

  it('在 CI 环境中静默跳过', async () => {
    process.env.CI = '1';

    await import('../../scripts/postinstall.js');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('在 dist 存在且未禁用时输出提示', async () => {
    delete process.env.CI;
    delete process.env.APEWORKFLOW_NO_COMPLETIONS;

    await import('../../scripts/postinstall.js');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("apeworkflow completion install")
    );
  });
});
