import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ValidateCommand } from '../../src/commands/validate.js';

describe('validate command entrypoint', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let originalExitCode: typeof process.exitCode;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // 中文注释：这里只测非交互提示，避免引入命令行选择器的额外噪音。
    originalExitCode = process.exitCode;
    originalEnv = { ...process.env };
    process.exitCode = undefined;
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    process.exitCode = originalExitCode;
    process.env = originalEnv;
  });

  it('在非交互模式且没有参数时输出帮助提示', async () => {
    process.env.OPEN_SPEC_INTERACTIVE = '0';

    await new ValidateCommand().execute(undefined, {});

    expect(errorSpy).toHaveBeenCalledWith('Nothing to validate. Try one of:');
    expect(process.exitCode).toBe(1);
  });

  it('会校验单个 spec 并输出 JSON 结果', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'apeworkflow-validate-spec-'));
    const specDir = path.join(tempRoot, 'apeworkflow', 'specs', 'auth');
    const specPath = path.join(specDir, 'spec.md');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const originalCwd = process.cwd();

    try {
      // 中文注释：这里放一份最小可通过的 spec，确保 validate.ts 能走到单项校验分支。
      await fs.mkdir(specDir, { recursive: true });
      await fs.writeFile(
        specPath,
        [
          '# User Authentication Spec',
          '',
          '## Purpose',
          'This specification defines the requirements for user authentication in the system.',
          '',
          '## Requirements',
          '',
          '### Requirement: User Authentication',
          'The system SHALL provide secure user authentication.',
          '',
          '#### Scenario: Successful login',
          '- **GIVEN** a user with valid credentials',
          '- **WHEN** they submit the login form',
          '- **THEN** they are authenticated',
          '',
        ].join('\n')
      );

      process.chdir(tempRoot);
      process.exitCode = undefined;

      await new ValidateCommand().execute('auth', { json: true });

      const payload = JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string);
      expect(payload.version).toBe('1.0');
      expect(payload.items).toHaveLength(1);
      expect(payload.items[0].type).toBe('spec');
      expect(payload.items[0].id).toBe('auth');
      expect(payload.items[0].valid).toBe(true);
      expect(payload.summary.totals).toEqual({ items: 1, passed: 1, failed: 0 });
      expect(process.exitCode).toBe(0);

    } finally {
      process.chdir(originalCwd);
      logSpy.mockRestore();
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  it('会批量校验 changes 和 specs 并汇总 JSON 结果', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'apeworkflow-validate-bulk-'));
    const specDir = path.join(tempRoot, 'apeworkflow', 'specs', 'auth');
    const changeSpecDir = path.join(tempRoot, 'apeworkflow', 'changes', 'add-user-auth', 'specs', 'auth');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const originalCwd = process.cwd();

    try {
      // 中文注释：这里同时放入一个 spec 和一个 change，覆盖 validate.ts 的批量路径。
      await fs.mkdir(specDir, { recursive: true });
      await fs.writeFile(
        path.join(specDir, 'spec.md'),
        [
          '# User Authentication Spec',
          '',
          '## Purpose',
          'This specification defines the requirements for user authentication in the system.',
          '',
          '## Requirements',
          '',
          '### Requirement: User Authentication',
          'The system SHALL provide secure user authentication.',
          '',
          '#### Scenario: Successful login',
          '- **GIVEN** a user with valid credentials',
          '- **WHEN** they submit the login form',
          '- **THEN** they are authenticated',
          '',
        ].join('\n')
      );

      await fs.mkdir(changeSpecDir, { recursive: true });
      await fs.writeFile(
        path.join(changeSpecDir, 'spec.md'),
        [
          '# Add User Authentication',
          '',
          '## ADDED Requirements',
          '',
          '### Requirement: User Authentication',
          'The system SHALL provide secure user authentication.',
          '',
          '#### Scenario: Successful login',
          '- **GIVEN** a user with valid credentials',
          '- **WHEN** they submit the login form',
          '- **THEN** they are authenticated',
          '',
        ].join('\n')
      );
      await fs.writeFile(
        path.join(tempRoot, 'apeworkflow', 'changes', 'add-user-auth', 'proposal.md'),
        '# Add User Authentication\n'
      );

      process.chdir(tempRoot);
      process.exitCode = undefined;

      await new ValidateCommand().execute(undefined, {
        all: true,
        json: true,
        noInteractive: true,
      });

      const payload = JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string);
      expect(payload.version).toBe('1.0');
      expect(payload.items).toHaveLength(2);
      expect(payload.summary.totals).toEqual({ items: 2, passed: 2, failed: 0 });
      expect(payload.summary.byType.change).toEqual({ items: 1, passed: 1, failed: 0 });
      expect(payload.summary.byType.spec).toEqual({ items: 1, passed: 1, failed: 0 });
      expect(payload.items.map((item: { id: string; type: string }) => `${item.type}/${item.id}`)).toEqual([
        'change/add-user-auth',
        'spec/auth',
      ]);
      expect(process.exitCode).toBe(0);

    } finally {
      process.chdir(originalCwd);
      logSpy.mockRestore();
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });
});
