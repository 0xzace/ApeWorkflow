import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const packMocks = vi.hoisted(() => ({
  execFileSync: vi.fn((cmd: string, args: string[]) => {
    if (cmd === 'npm' && args[0] === 'pack' && args.includes('--json')) {
      return JSON.stringify([{ filename: 'apeworkflow-9.9.9.tgz' }]);
    }
    if (cmd === 'npm' && args[0] === 'pack') {
      return 'apeworkflow-9.9.9.tgz\n';
    }
    if (cmd === process.execPath && args.at(-1) === '--version') {
      return '9.9.9';
    }
    return '';
  }),
}));

vi.mock('child_process', () => ({
  execFileSync: packMocks.execFileSync,
}));

describe('pack version check script', () => {
  let tempDir: string;
  let originalCwd: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // 中文注释：脚本会读取当前目录 package.json，所以这里切到临时工程目录。
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-pack-check-'));
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'pack-check', version: '9.9.9' }, null, 2)
    );
    originalCwd = process.cwd();
    process.chdir(tempDir);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(originalCwd);
    logSpy.mockRestore();
    errorSpy.mockRestore();
    fs.rmSync(tempDir, { recursive: true, force: true });
    vi.resetModules();
  });

  it('校验打包后 CLI 版本并输出成功信息', async () => {
    await import('../../scripts/pack-version-check.mjs');

    expect(packMocks.execFileSync).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('✅ pack-version-check: OK');
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
