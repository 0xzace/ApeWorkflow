import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const validateCommandMocks = vi.hoisted(() => ({
  select: vi.fn(),
  getActiveChangeIds: vi.fn(),
  getSpecIds: vi.fn(),
}));

vi.mock('@inquirer/prompts', () => ({
  select: validateCommandMocks.select,
}));

vi.mock('../../src/utils/item-discovery.js', () => ({
  getActiveChangeIds: validateCommandMocks.getActiveChangeIds,
  getSpecIds: validateCommandMocks.getSpecIds,
}));

import { ValidateCommand } from '../../src/commands/validate.js';

describe('validate command interactive entrypoint', () => {
  let tempDir: string;
  let originalEnv: NodeJS.ProcessEnv;
  let originalCwd: string;
  let originalStdinTTY: boolean | undefined;
  let originalExitCode: typeof process.exitCode;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // 中文注释：这里同时准备真实文件和交互 mock，覆盖 validate 的交互、unknown 和 bulk 路径。
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-validate-command-'));
    originalEnv = { ...process.env };
    originalCwd = process.cwd();
    originalStdinTTY = (process.stdin as NodeJS.ReadStream & { isTTY?: boolean }).isTTY;
    originalExitCode = process.exitCode;
    delete process.env.OPEN_SPEC_INTERACTIVE;
    delete process.env.CI;
    (process.stdin as NodeJS.ReadStream & { isTTY?: boolean }).isTTY = true;
    process.chdir(tempDir);
    process.exitCode = undefined;
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    validateCommandMocks.select.mockReset();
    validateCommandMocks.getActiveChangeIds.mockReset();
    validateCommandMocks.getSpecIds.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    process.chdir(originalCwd);
    (process.stdin as NodeJS.ReadStream & { isTTY?: boolean }).isTTY = originalStdinTTY;
    process.exitCode = originalExitCode;
    errorSpy.mockRestore();
    logSpy.mockRestore();
    fs.rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  function writeValidSpec(specId: string): void {
    const specDir = path.join(tempDir, 'apeworkflow', 'specs', specId);
    fs.mkdirSync(specDir, { recursive: true });
    fs.writeFileSync(
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
      ].join('\n')
    );
  }

  function writeValidChange(changeId: string): void {
    const changeSpecDir = path.join(tempDir, 'apeworkflow', 'changes', changeId, 'specs', 'auth');
    fs.mkdirSync(changeSpecDir, { recursive: true });
    fs.writeFileSync(
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
      ].join('\n')
    );
    fs.writeFileSync(path.join(tempDir, 'apeworkflow', 'changes', changeId, 'proposal.md'), '# Change\n');
  }

  it('会在交互模式下选择 all 并批量校验 changes + specs', async () => {
    writeValidChange('add-auth');
    writeValidSpec('auth');
    validateCommandMocks.select.mockResolvedValueOnce('all');
    validateCommandMocks.getActiveChangeIds.mockResolvedValue(['add-auth']);
    validateCommandMocks.getSpecIds.mockResolvedValue(['auth']);

    await new ValidateCommand().execute(undefined, { json: true });

    const payload = JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string);
    expect(payload.version).toBe('1.0');
    expect(payload.items).toHaveLength(2);
    expect(payload.summary.totals).toEqual({ items: 2, passed: 2, failed: 0 });
    expect(validateCommandMocks.getActiveChangeIds).toHaveBeenCalled();
    expect(validateCommandMocks.getSpecIds).toHaveBeenCalled();
  });

  it('会在交互模式下继续选择单个 item', async () => {
    writeValidChange('add-auth');
    writeValidSpec('auth');
    validateCommandMocks.select
      .mockResolvedValueOnce('one')
      .mockResolvedValueOnce({ type: 'spec', id: 'auth' });
    validateCommandMocks.getActiveChangeIds.mockResolvedValue(['add-auth']);
    validateCommandMocks.getSpecIds.mockResolvedValue(['auth']);

    await new ValidateCommand().execute(undefined, { strict: true });

    expect(validateCommandMocks.select).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        message: 'What would you like to validate?',
      })
    );
    expect(validateCommandMocks.select).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        message: 'Pick an item',
      })
    );
    expect(process.exitCode).toBe(0);
  });

  it('会在无法匹配 item 时给出提示', async () => {
    validateCommandMocks.getActiveChangeIds.mockResolvedValue(['alpha']);
    validateCommandMocks.getSpecIds.mockResolvedValue(['beta']);

    await new ValidateCommand().execute('alpah', {});

    expect(errorSpy).toHaveBeenCalledWith("Unknown item 'alpah'");
    expect(errorSpy).toHaveBeenCalledWith('Did you mean: alpha, beta?');
    expect(process.exitCode).toBe(1);
  });

  it('会在 item 同时命中 change 和 spec 时拒绝歧义', async () => {
    validateCommandMocks.getActiveChangeIds.mockResolvedValue(['shared']);
    validateCommandMocks.getSpecIds.mockResolvedValue(['shared']);

    await new ValidateCommand().execute('shared', {});

    expect(errorSpy).toHaveBeenCalledWith(
      "Ambiguous item 'shared' matches both a change and a spec."
    );
    expect(process.exitCode).toBe(1);
  });
});
