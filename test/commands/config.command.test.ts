import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Command } from 'commander';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { getGlobalConfig, getGlobalConfigPath } from '../../src/core/global-config.js';
import { registerConfigCommand } from '../../src/commands/config.js';

describe('config command actions', () => {
  let tempDir: string;
  let originalEnv: NodeJS.ProcessEnv;
  let originalExitCode: typeof process.exitCode;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // 中文注释：这里覆盖 config 的子命令动作，使用临时配置目录避免污染全局状态。
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-config-command-'));
    originalEnv = { ...process.env };
    originalExitCode = process.exitCode;
    process.env = {
      ...process.env,
      XDG_CONFIG_HOME: tempDir,
    };
    process.exitCode = undefined;
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    process.exitCode = originalExitCode;
    logSpy.mockRestore();
    errorSpy.mockRestore();
    fs.rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  async function runConfig(args: string[]): Promise<void> {
    const program = new Command();
    program.exitOverride();
    registerConfigCommand(program);
    await program.parseAsync(['config', ...args], { from: 'user' });
  }

  it('会走通 list/get/set/unset/reset/edit 的主路径', async () => {
    // 中文注释：这里顺序执行多个子命令，尽量一次覆盖 config.ts 的主要动作分支。
    await runConfig(['list', '--json']);
    expect(JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string)).toEqual(
      expect.objectContaining({
        featureFlags: {},
      })
    );

    await runConfig(['set', 'featureFlags.demo', 'true', '--allow-unknown']);
    expect(JSON.parse(fs.readFileSync(getGlobalConfigPath(), 'utf-8')).featureFlags).toEqual({
      demo: true,
    });

    await runConfig(['get', 'featureFlags.demo']);
    expect(logSpy.mock.calls.at(-1)?.[0]).toBe('true');

    await runConfig(['unset', 'featureFlags.demo']);
    expect(logSpy.mock.calls.at(-1)?.[0]).toContain('Unset featureFlags.demo');

    await runConfig(['reset', '--all', '-y']);
    expect(JSON.parse(fs.readFileSync(getGlobalConfigPath(), 'utf-8')).featureFlags).toEqual({});

    process.env.EDITOR = 'true';
    delete process.env.VISUAL;
    const configPath = getGlobalConfigPath();
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    await runConfig(['edit']);
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it('会在没有编辑器时拒绝 edit', async () => {
    delete process.env.EDITOR;
    delete process.env.VISUAL;

    await runConfig(['edit']);

    expect(errorSpy).toHaveBeenCalledWith('Error: No editor configured');
    expect(process.exitCode).toBe(1);
  });

  it('会输出 human-readable 的 list 结果', async () => {
    // 中文注释：这里覆盖 list 的非 JSON 输出，确保 profile/settings 说明行都能走到。
    const { saveGlobalConfig } = await import('../../src/core/global-config.js');

    saveGlobalConfig({ featureFlags: {}, profile: 'custom', delivery: 'skills', workflows: ['explore'] });

    await runConfig(['list']);

    expect(logSpy.mock.calls.map((call) => call[0])).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Profile settings:'),
        expect.stringContaining('profile: custom (explicit)'),
        expect.stringContaining('delivery: skills (explicit)'),
        expect.stringContaining('workflows: explore (explicit)'),
      ])
    );
  });

  it('会拒绝未支持的 config scope', async () => {
    // 中文注释：这里覆盖 preAction 的 scope 校验分支。
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => undefined) as never);

    await runConfig(['--scope', 'project', 'path']);

    expect(errorSpy).toHaveBeenCalledWith('Error: Project-local config is not yet implemented');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
