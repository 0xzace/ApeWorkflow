import { describe, expect, it } from 'vitest';

describe('source entrypoints', () => {
  it('可以加载主入口模块', async () => {
    // 中文注释：直接导入源入口，顺带覆盖 CLI barrel 的模块加载路径。
    const mod = await import('../src/index.js');
    expect(mod).toBeTruthy();
  });
});
