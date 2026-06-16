import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  createInitiative,
  mountInitiativesCollection,
  InitiativeResolutionError,
  initiativeDiagnosticFromError,
  listInitiativeViewReferences,
  parseInitiativeReference,
  resolveSelectedInitiativeViewReference,
  resolveInitiativeViewReference,
  listSelectedInitiativeViewReferences,
} from '../../../../src/core/collections/initiatives/index.js';
import { registerContextStore } from '../../../../src/core/index.js';

describe('initiative resolution diagnostics', () => {
  it('classifies already-exists errors without regex backtracking', () => {
    expect(
      initiativeDiagnosticFromError(
        new Error("Initiative 'billing-launch' already exists at /tmp/store/initiatives/billing-launch")
      )
    ).toEqual(
      expect.objectContaining({
        code: 'initiative_already_exists',
        target: 'initiative.id',
      })
    );

    const diagnostic = initiativeDiagnosticFromError(new Error("Initiative '".repeat(32000)));
    expect(diagnostic.code).toBe('initiative_error');
  });

  it('classifies invalid initiative ids and invalid initiative states', () => {
    const invalidId = initiativeDiagnosticFromError(new Error('Initiative id bad-id is invalid.'));
    expect(invalidId).toEqual(
      expect.objectContaining({
        code: 'invalid_initiative_id',
        target: 'initiative.id',
      })
    );

    const invalidState = initiativeDiagnosticFromError(new Error('Invalid initiative folder state.'));
    expect(invalidState).toEqual(
      expect.objectContaining({
        code: 'invalid_initiative',
        target: 'initiative',
      })
    );
  });

  it('preserves explicit initiative resolution error details', () => {
    const diagnostic = initiativeDiagnosticFromError(
      new InitiativeResolutionError('boom', 'initiative_lookup_failed', {
        target: 'initiative',
        fix: 'rebuild it',
        details: { currentStore: '/tmp/store' } as never,
      })
    );

    expect(diagnostic).toEqual(
      expect.objectContaining({
        code: 'initiative_lookup_failed',
        target: 'initiative',
        fix: 'rebuild it',
      })
    );
    expect(diagnostic.details).toEqual({ currentStore: '/tmp/store' });
  });
});

describe('initiative resolution lookups', () => {
  let tempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-initiative-resolution-'));
    originalEnv = { ...process.env };
    process.env = {
      ...process.env,
      XDG_DATA_HOME: tempDir,
      XDG_CONFIG_HOME: path.join(tempDir, 'config-home'),
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('会解析 initiative 引用并拒绝冲突/非法格式', () => {
    expect(parseInitiativeReference('launch-billing-flow', {})).toEqual({
      initiativeId: 'launch-billing-flow',
      options: {},
    });

    expect(() =>
      parseInitiativeReference('team/launch-billing-flow', {
        store: 'team',
      })
    ).toThrow(/Pass either --initiative <store>\/<id>/u);

    expect(() => parseInitiativeReference('too/many/parts', {})).toThrow(
      /Invalid initiative reference/u
    );
  });

  it('在没有注册 context store 时返回空列表结果', async () => {
    await expect(listInitiativeViewReferences()).resolves.toEqual({
      contextStore: null,
      contextStores: [],
      initiatives: [],
      status: [],
    });
  });

  it('会把缺失的注册 store 映射成 initiative 错误', async () => {
    await expect(
      resolveInitiativeViewReference('launch-billing-flow', {
        store: 'missing-context',
      })
    ).rejects.toThrow(/No context store registry found/u);
  });

  it('会解析注册和路径 initiative store，并列出与读取 initiative', async () => {
    const storeRoot = path.join(tempDir, 'stores', 'team-context');
    fs.mkdirSync(storeRoot, { recursive: true });
    await registerContextStore({
      id: 'team-context',
      localPath: storeRoot,
    });
    await createInitiative({
      collection: mountInitiativesCollection(storeRoot),
      id: 'launch-billing-flow',
      title: 'Launch Billing Flow',
      summary: 'Track the billing launch initiative.',
    });

    const selectedByRegistry = {
      id: 'team-context',
      root: storeRoot,
      source: 'path' as const,
    };

    expect(selectedByRegistry).toEqual(
      expect.objectContaining({
        id: 'team-context',
        root: expect.any(String),
        source: 'path',
      })
    );

    const listed = await listSelectedInitiativeViewReferences(selectedByRegistry);
    expect(listed.initiatives).toEqual([
      expect.objectContaining({
        id: 'launch-billing-flow',
        title: 'Launch Billing Flow',
        store: 'team-context',
      }),
    ]);

    await expect(
      resolveSelectedInitiativeViewReference(selectedByRegistry, 'launch-billing-flow')
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'launch-billing-flow',
        title: 'Launch Billing Flow',
      })
    );

    await expect(
      resolveSelectedInitiativeViewReference(selectedByRegistry, 'missing-initiative')
    ).rejects.toThrow(/was not found in context store 'team-context'/u);

    // 中文注释：这里再补一组直接解析入口，覆盖按注册名和按路径选择 context store 的分支。
    await expect(
      resolveInitiativeViewReference('launch-billing-flow', {
        store: 'team-context',
      })
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'launch-billing-flow',
        title: 'Launch Billing Flow',
        store: 'team-context',
      })
    );

    await expect(
      resolveInitiativeViewReference('launch-billing-flow', {
        storePath: storeRoot,
      })
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'launch-billing-flow',
        title: 'Launch Billing Flow',
        store: 'team-context',
      })
    );
  });
});
