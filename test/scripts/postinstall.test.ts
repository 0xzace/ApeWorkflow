import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

describe('postinstall script', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    // 中文注释：把脚本放到独立临时目录里执行，避免并行测试互相污染全局 console。
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-postinstall-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function runPostinstall(extraEnv: NodeJS.ProcessEnv = {}): string {
    return execFileSync(process.execPath, [path.join(originalCwd, 'scripts/postinstall.js')], {
      cwd: tempDir,
      env: { ...process.env, ...extraEnv },
      encoding: 'utf8',
    });
  }

  it('在 CI 环境中静默跳过', () => {
    const output = runPostinstall({ CI: '1' });

    expect(output).toBe('');
  });

  it('在 dist 存在且未禁用时输出提示', () => {
    const output = runPostinstall({
      CI: '',
      APEWORKFLOW_NO_COMPLETIONS: '',
    });

    expect(output).toContain("apeworkflow completion install");
  });
});
