import { describe, expect, it } from 'vitest';

import { resolveEditScope } from '../../src/core/change-status-policy.js';

describe('resolveEditScope', () => {
  it('returns full scope when allowedEditRoots is provided', () => {
    const scope = resolveEditScope({
      mode: 'workspace-planning',
      allowedEditRoots: ['/some/path'],
    });
    expect(scope.mode).toBe('full');
    expect(scope.roots).toEqual(['/some/path']);
  });

  it('returns partial scope with askUser when no edit roots', () => {
    const scope = resolveEditScope({
      mode: 'workspace-planning',
      allowedEditRoots: [],
      availableEditRoots: ['/user/repo'],
    });
    expect(scope.mode).toBe('partial');
    expect(scope.askUser).toBe(true);
  });

  it('returns none mode when no roots available', () => {
    const scope = resolveEditScope({
      mode: 'workspace-planning',
      allowedEditRoots: [],
      availableEditRoots: [],
    });
    expect(scope.mode).toBe('none');
    expect(scope.reason).toBe('no editable roots');
  });

  it('returns full scope for non-workspace mode', () => {
    const scope = resolveEditScope({
      mode: 'repo-local',
      allowedEditRoots: ['/repo'],
    });
    expect(scope.mode).toBe('full');
  });

  it('defaults to repo-local for unknown mode', () => {
    const scope = resolveEditScope({
      mode: 'unknown-mode',
    });
    expect(scope.mode).toBe('full');
    expect(scope.roots).toEqual(['repo-local']);
  });
});
