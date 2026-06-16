import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Command } from 'commander';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const initiativeCommandMocks = vi.hoisted(() => ({
  reportUserVisibleError: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/cli/error-handling.js', () => ({
  reportUserVisibleError: initiativeCommandMocks.reportUserVisibleError,
}));

import { registerInitiativeCommand } from '../../src/commands/initiative.js';
import {
  getGlobalDataDir,
  INITIATIVE_FILE_NAMES,
  registerContextStore,
  writeContextStoreMetadataState,
} from '../../src/core/index.js';

describe('initiative command registration', () => {
  let tempDir: string;
  let originalEnv: NodeJS.ProcessEnv;
  let originalCwd: string;
  let globalDataDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-initiative-command-reg-'));
    originalEnv = { ...process.env };
    originalCwd = process.cwd();
    process.env = {
      ...process.env,
      XDG_DATA_HOME: path.join(tempDir, 'data-home'),
      XDG_CONFIG_HOME: path.join(tempDir, 'config-home'),
      OPEN_SPEC_INTERACTIVE: '0',
      APEWORKFLOW_TELEMETRY: '0',
    };
    process.chdir(tempDir);
    globalDataDir = getGlobalDataDir({ env: process.env });
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    initiativeCommandMocks.reportUserVisibleError.mockClear();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    process.env = originalEnv;
    logSpy.mockRestore();
    errorSpy.mockRestore();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function mkdir(relativePath: string): string {
    const dir = path.join(tempDir, relativePath);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  function initiativeRoot(storeRoot: string, id: string): string {
    return path.join(storeRoot, 'initiatives', id);
  }

  function parseLoggedJson(): any {
    const raw = logSpy.mock.calls.at(-1)?.[0];
    expect(typeof raw).toBe('string');
    return JSON.parse(raw as string);
  }

  async function setupRegisteredStore(id = 'team-context'): Promise<string> {
    const storeRoot = mkdir(`stores/${id}`);
    await registerContextStore({
      id,
      localPath: storeRoot,
      globalDataDir,
    });
    return storeRoot;
  }

  async function runInitiative(args: string[]): Promise<void> {
    const program = new Command();
    program.exitOverride();
    registerInitiativeCommand(program);
    await program.parseAsync(['initiative', ...args], { from: 'user' });
  }

  it('会在进程内创建、列出和展示 initiative JSON 输出', async () => {
    const storeRoot = await setupRegisteredStore('team-context');

    await runInitiative([
      'create',
      'launch-billing-flow',
      '--store',
      'team-context',
      '--title',
      'Launch Billing Flow',
      '--summary',
      'Coordinate billing launch work.',
      '--json',
    ]);

    const createPayload = parseLoggedJson();
    expect(createPayload.context_store).toEqual({
      id: 'team-context',
      root: expect.any(String),
      source: 'registry',
    });
    expect(createPayload.initiative).toEqual(
      expect.objectContaining({
        id: 'launch-billing-flow',
        title: 'Launch Billing Flow',
        summary: 'Coordinate billing launch work.',
        root: expect.any(String),
      })
    );
    expect(createPayload.created_files).toEqual([...INITIATIVE_FILE_NAMES]);
    expect(createPayload.status).toEqual([]);
    expect(fs.existsSync(initiativeRoot(storeRoot, 'launch-billing-flow'))).toBe(true);

    logSpy.mockClear();
    await runInitiative(['list', '--store', 'team-context', '--json']);
    const listPayload = parseLoggedJson();
    expect(listPayload.context_store).toEqual({
      id: 'team-context',
      root: expect.any(String),
      source: 'registry',
    });
    expect(listPayload.initiatives.map((initiative: any) => initiative.id)).toEqual([
      'launch-billing-flow',
    ]);

    logSpy.mockClear();
    await runInitiative(['show', 'launch-billing-flow', '--store', 'team-context', '--json']);
    const showPayload = parseLoggedJson();
    expect(showPayload.context_store).toEqual({
      id: 'team-context',
      root: expect.any(String),
    });
    expect(showPayload.initiative).toEqual(
      expect.objectContaining({
        id: 'launch-billing-flow',
        title: 'Launch Billing Flow',
        summary: 'Coordinate billing launch work.',
        metadata_path: expect.any(String),
      })
    );
  });

  it('会输出 human 形式的 list 和 show，并打印多 store 的诊断匹配', async () => {
    await runInitiative(['list']);
    expect(logSpy.mock.calls.map((call) => String(call[0])).join('\n')).toContain(
      'No initiatives found because no context stores are registered.'
    );

    logSpy.mockClear();

    const platformRoot = await setupRegisteredStore('platform');
    const financeRoot = await setupRegisteredStore('finance');

    for (const store of ['platform', 'finance']) {
      await runInitiative([
        'create',
        'billing-launch',
        '--store',
        store,
        '--title',
        'Billing Launch',
        '--summary',
        `Coordinate ${store} billing launch work.`,
      ]);
      logSpy.mockClear();
    }

    await runInitiative(['list', '--store', 'platform']);
    expect(logSpy.mock.calls.map((call) => String(call[0])).join('\n')).toContain(
      'ApeWorkflow initiatives in platform (1)'
    );

    logSpy.mockClear();
    await runInitiative(['list']);
    expect(logSpy.mock.calls.map((call) => String(call[0])).join('\n')).toContain(
      'ApeWorkflow initiatives (2 across 2 stores)'
    );

    logSpy.mockClear();
    errorSpy.mockClear();
    await runInitiative(['show', 'billing-launch']);
    const humanError = errorSpy.mock.calls.map((call) => String(call[0])).join('\n');
    expect(humanError).toContain('Error: Initiative \'billing-launch\' exists in multiple context stores.');
    expect(humanError).toContain('Matches:');
    expect(humanError).toContain('finance');
    expect(humanError).toContain('platform');

    expect(fs.existsSync(initiativeRoot(platformRoot, 'billing-launch'))).toBe(true);
    expect(fs.existsSync(initiativeRoot(financeRoot, 'billing-launch'))).toBe(true);
  });

  it('会在 JSON 模式下返回 create 失败的结构化状态', async () => {
    await setupRegisteredStore('team-context');

    await runInitiative([
      'create',
      'launch-billing-flow',
      '--store',
      'team-context',
      '--title',
      'Launch Billing Flow',
      '--json',
    ]);

    const payload = parseLoggedJson();
    expect(payload.status[0]).toEqual(
      expect.objectContaining({
        code: 'initiative_summary_required',
        target: 'initiative.summary',
      })
    );
    expect(initiativeCommandMocks.reportUserVisibleError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        commandPath: 'initiative:create',
      })
    );
  });
});
