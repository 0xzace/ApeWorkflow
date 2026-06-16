import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Command } from 'commander';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const specCommandMocks = vi.hoisted(() => ({
  isInteractive: vi.fn(),
  getSpecIds: vi.fn(),
  select: vi.fn(),
}));

vi.mock('../../src/utils/interactive.js', () => ({
  isInteractive: specCommandMocks.isInteractive,
}));

vi.mock('../../src/utils/item-discovery.js', () => ({
  getSpecIds: specCommandMocks.getSpecIds,
}));

vi.mock('@inquirer/prompts', () => ({
  select: specCommandMocks.select,
}));

import { SpecCommand, registerSpecCommand } from '../../src/commands/spec.js';

describe('spec command registration', () => {
  let tempDir: string;
  let originalCwd: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let originalExitCode: typeof process.exitCode;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-spec-command-'));
    originalCwd = process.cwd();
    originalExitCode = process.exitCode;
    process.chdir(tempDir);
    process.exitCode = undefined;
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    specCommandMocks.isInteractive.mockReset();
    specCommandMocks.getSpecIds.mockReset();
    specCommandMocks.select.mockReset();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    process.exitCode = originalExitCode;
    logSpy.mockRestore();
    errorSpy.mockRestore();
    fs.rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  function writeSpec(specId: string, requirementCount = 1): void {
    const specDir = path.join(tempDir, 'apeworkflow', 'specs', specId);
    fs.mkdirSync(specDir, { recursive: true });
    const requirements = Array.from({ length: requirementCount }, (_, index) => {
      const number = index + 1;
      return [
        `### Requirement: Requirement ${number}`,
        `Requirement ${number} text`,
        '',
      ].join('\n');
    }).join('\n');
    fs.writeFileSync(
      path.join(specDir, 'spec.md'),
      [
        '## Purpose',
        `Purpose for ${specId}.`,
        '',
        '## Requirements',
        '',
        requirements,
      ].join('\n'),
      'utf-8'
    );
  }

  it('会在交互模式下选择 spec 并展示原文', async () => {
    // 中文注释：这里把交互开关和选择器都 mock 掉，覆盖 show 的交互分支。
    writeSpec('auth');
    specCommandMocks.isInteractive.mockReturnValue(true);
    specCommandMocks.getSpecIds.mockResolvedValue(['auth']);
    specCommandMocks.select.mockResolvedValue('auth');

    const command = new SpecCommand();
    await command.show(undefined, {});

    expect(specCommandMocks.select).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Select a spec to show',
        choices: [{ name: 'auth', value: 'auth' }],
      })
    );
    expect(logSpy.mock.calls.at(-1)?.[0]).toContain('Purpose for auth.');
  });

  it('会拒绝同时使用 requirements 和 requirement', async () => {
    writeSpec('auth');

    const command = new SpecCommand();
    await expect(
      command.show('auth', {
        json: true,
        requirements: true,
        requirement: '1',
      } as any)
    ).rejects.toThrow(/cannot be used together/u);
  });

  it('会输出 long 格式的 spec 列表', async () => {
    writeSpec('auth', 2);
    writeSpec('payment', 1);

    const program = new Command();
    program.exitOverride();
    registerSpecCommand(program);

    await program.parseAsync(['spec', 'list', '--long'], { from: 'user' });

    expect(logSpy.mock.calls.map((call) => call[0])).toEqual(
      expect.arrayContaining([
        'auth: auth [requirements 2]',
      'payment: payment [requirements 1]',
      ])
    );
  });

  it('会输出 spec 列表的 JSON 结果', async () => {
    // 中文注释：这里覆盖 list 的 JSON 分支，确认排序和 requirement 计数都保留。
    writeSpec('payment', 1);
    writeSpec('auth', 2);

    const program = new Command();
    program.exitOverride();
    registerSpecCommand(program);

    await program.parseAsync(['spec', 'list', '--json'], { from: 'user' });

    expect(JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string)).toEqual([
      {
        id: 'auth',
        title: 'auth',
        requirementCount: 2,
      },
      {
        id: 'payment',
        title: 'payment',
        requirementCount: 1,
      },
    ]);
  });

  it('会在交互模式下选择 spec 并输出 JSON', async () => {
    // 中文注释：这里覆盖 show 的 JSON 路径，确保过滤参数不会影响输出结构。
    writeSpec('auth', 2);
    specCommandMocks.isInteractive.mockReturnValue(true);
    specCommandMocks.getSpecIds.mockResolvedValue(['auth']);
    specCommandMocks.select.mockResolvedValue('auth');

    const command = new SpecCommand();
    await command.show(undefined, {
      json: true,
      requirements: true,
    } as any);

    expect(specCommandMocks.select).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Select a spec to show',
      })
    );
    const payload = JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string);
    expect(payload.id).toBe('auth');
    expect(payload.requirementCount).toBe(2);
    expect(payload.requirements).toHaveLength(2);
  });

  it('会在缺少 spec-id 时抛出错误，并在找不到文件时提示路径', async () => {
    specCommandMocks.isInteractive.mockReturnValue(false);

    const command = new SpecCommand();
    await expect(command.show(undefined, {})).rejects.toThrow('Missing required argument <spec-id>');
    await expect(command.show('missing-spec', { json: true })).rejects.toThrow(
      "Spec 'missing-spec' not found at apeworkflow/specs/missing-spec/spec.md"
    );
  });

  it('会在交互模式下选择 spec 并执行 validate 子命令', async () => {
    // 中文注释：这里覆盖 spec validate 的交互分支，确认注册命令的选择器能正常接住。
    writeSpec('auth', 1);
    specCommandMocks.isInteractive.mockReturnValue(true);
    specCommandMocks.getSpecIds.mockResolvedValue(['auth']);
    specCommandMocks.select.mockResolvedValue('auth');

    const program = new Command();
    program.exitOverride();
    registerSpecCommand(program);

    await program.parseAsync(['spec', 'validate'], { from: 'user' });

    expect(specCommandMocks.select).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Select a spec to validate',
      })
    );
  });
});
