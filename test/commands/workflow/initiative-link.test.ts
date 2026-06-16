import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InitiativeResolutionError } from '../../../src/core/collections/initiatives/index.js';
import {
  assertInitiativeReference,
  assertInitiativeSelectorsHaveReference,
  assertRepoLocalInitiativeLinkPlanningHome,
  formatInitiativeLink,
  printJson,
  sameInitiativeLink,
  statusFromError,
} from '../../../src/commands/workflow/initiative-link.js';

describe('workflow initiative link helpers', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('格式化 initiative 并输出 JSON', () => {
    // 中文注释：这里直接覆盖最小输出函数，保证 JSON 包装逻辑有回归测试。
    expect(formatInitiativeLink({ store: 'platform', id: 'billing-launch' })).toBe(
      'platform/billing-launch'
    );
    expect(sameInitiativeLink(
      { store: 'platform', id: 'billing-launch' },
      { store: 'platform', id: 'billing-launch' }
    )).toBe(true);
    expect(sameInitiativeLink(
      { store: 'platform', id: 'billing-launch' },
      { store: 'platform', id: 'other' }
    )).toBe(false);
    expect(sameInitiativeLink(
      { store: 'platform', id: 'billing-launch' },
      { store: 'other', id: 'billing-launch' }
    )).toBe(false);
    // left 为 undefined 时返回 false
    expect(sameInitiativeLink(undefined, { store: 'platform', id: 'billing-launch' })).toBe(false);

    printJson({ ok: true });
    expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify({ ok: true }, null, 2));
  });

  it('把错误转换为命令状态', () => {
    const resolutionError = new InitiativeResolutionError('bad initiative', 'initiative_bad', {
      target: 'initiative.id',
      fix: 'apeworkflow initiative show demo',
      details: { demo: true },
    });

    expect(statusFromError(resolutionError)).toEqual({
      severity: 'error',
      code: 'initiative_bad',
      message: 'bad initiative',
      target: 'initiative.id',
      fix: 'apeworkflow initiative show demo',
      details: { demo: true },
    });
    expect(statusFromError(new Error('plain failure'))).toEqual({
      severity: 'error',
      code: 'change_error',
      message: 'plain failure',
    });
  });

  it('校验 initiative 参数', () => {
    expect(() => assertInitiativeSelectorsHaveReference({ store: 'platform' })).toThrow(
      'Pass --initiative when using --store or --store-path.'
    );
    expect(() => assertInitiativeSelectorsHaveReference({ initiative: '   ' })).toThrow(
      'Pass --initiative <id> to link a change to an initiative.'
    );
    expect(() => assertInitiativeReference('   ')).toThrow(
      'Pass --initiative <id> to set a change initiative link.'
    );
    expect(() => assertRepoLocalInitiativeLinkPlanningHome({ kind: 'workspace' } as any)).toThrow(
      'Initiative links are supported only for repo-local changes.'
    );
  });
});
