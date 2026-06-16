import { describe, expect, it } from 'vitest';

import { parseAffectedAreas, validateWorkspaceAffectedAreas, outputForCreatedChange } from '../../../src/commands/workflow/new-change.js';
import { outputForSetChange } from '../../../src/commands/workflow/set-change.js';

// ---------------------------------------------------------------------------
// parseAffectedAreas
// ---------------------------------------------------------------------------

describe('parseAffectedAreas', () => {
  it('解析逗号分隔的区域列表', () => {
    expect(parseAffectedAreas('core,api,ui')).toEqual(['core', 'api', 'ui']);
  });

  it('过滤空值和纯空格', () => {
    expect(parseAffectedAreas('core,, ,api')).toEqual(['core', 'api']);
  });

  it('trim 空格', () => {
    expect(parseAffectedAreas(' core , api ')).toEqual(['core', 'api']);
  });

  it('undefined 返回空数组', () => {
    expect(parseAffectedAreas(undefined)).toEqual([]);
  });

  it('空字符串返回空数组', () => {
    expect(parseAffectedAreas('')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// validateWorkspaceAffectedAreas
// ---------------------------------------------------------------------------

describe('validateWorkspaceAffectedAreas', () => {
  const workspacePlanningHome = {
    kind: 'workspace' as const,
    root: '/tmp/test',
    changesDir: '/tmp/test/apeworkflow/changes',
    defaultSchema: 'workspace-planning',
    workspace: { name: 'platform', links: ['core', 'api', 'ui'] },
  };

  const repoPlanningHome = {
    kind: 'repo' as const,
    root: '/tmp/repo',
    changesDir: '/tmp/repo/apeworkflow/changes',
    defaultSchema: 'spec-driven',
  };

  it('空列表不校验', () => {
    expect(() => validateWorkspaceAffectedAreas(workspacePlanningHome, [])).not.toThrow();
  });

  it('workspace 下有效区域通过', () => {
    expect(() => validateWorkspaceAffectedAreas(workspacePlanningHome, ['core', 'api'])).not.toThrow();
  });

  it('workspace 下无效区域抛出', () => {
    expect(() => validateWorkspaceAffectedAreas(workspacePlanningHome, ['core', 'unknown']))
      .toThrow('Invalid affected area: unknown');
  });

  it('workspace 下全部无效区域抛出', () => {
    expect(() => validateWorkspaceAffectedAreas(workspacePlanningHome, ['foo', 'bar']))
      .toThrow('Invalid affected areas: foo, bar');
  });

  it('repo 下使用 areas 抛出', () => {
    expect(() => validateWorkspaceAffectedAreas(repoPlanningHome, ['core']))
      .toThrow('--areas can only be used when creating a workspace-scoped change');
  });

  it('无 links 的 workspace 下所有区域都无效', () => {
    const emptyLinksHome = {
      kind: 'workspace' as const,
      root: '/tmp/test',
      changesDir: '/tmp/test/apeworkflow/changes',
      defaultSchema: 'workspace-planning',
      workspace: { name: 'empty', links: [] },
    };
    expect(() => validateWorkspaceAffectedAreas(emptyLinksHome, ['core']))
      .toThrow('no registered links');
  });

  it('单区域错误消息不带 s', () => {
    expect(() => validateWorkspaceAffectedAreas(workspacePlanningHome, ['unknown']))
      .toThrow('Invalid affected area: unknown');
  });
});

// ---------------------------------------------------------------------------
// outputForSetChange
// ---------------------------------------------------------------------------

describe('outputForSetChange', () => {
  it('生成包含变更信息的输出', () => {
    const result = outputForSetChange(
      'my-change',
      '/tmp/changes/my-change',
      'spec-driven',
      { store: 'teams', id: 'team-alpha' },
      true
    );

    expect(result.change.id).toBe('my-change');
    expect(result.change.path).toBe('/tmp/changes/my-change');
    expect(result.change.schema).toBe('spec-driven');
    expect(result.change.metadataPath).toBe('/tmp/changes/my-change/.apeworkflow.yaml');
    expect(result.initiative).toEqual({ store: 'teams', id: 'team-alpha' });
    expect(result.updated).toBe(true);
  });

  it('updated 为 false 时正确反映', () => {
    const result = outputForSetChange(
      'my-change',
      '/tmp/changes/my-change',
      'workspace-planning',
      { store: 'platform', id: 'billing' },
      false
    );

    expect(result.updated).toBe(false);
  });

  it('metadataPath 使用 path.join 拼接', () => {
    const result = outputForSetChange(
      'a',
      '/foo/bar/a',
      'default',
      { store: 's', id: 'i' },
      true
    );
    expect(result.change.metadataPath).toBe('/foo/bar/a/.apeworkflow.yaml');
  });
});

// ---------------------------------------------------------------------------
// outputForCreatedChange
// ---------------------------------------------------------------------------

describe('outputForCreatedChange', () => {
  it('生成包含变更信息的输出', () => {
    const result = outputForCreatedChange('feature-auth', '/tmp/changes/feature-auth', 'workspace-planning', undefined);

    expect(result.change.id).toBe('feature-auth');
    expect(result.change.path).toBe('/tmp/changes/feature-auth');
    expect(result.change.schema).toBe('workspace-planning');
    expect(result.change.metadataPath).toBe('/tmp/changes/feature-auth/.apeworkflow.yaml');
    expect(result.initiative).toBeUndefined();
  });

  it('包含 initiative 时正确附加', () => {
    const result = outputForCreatedChange('feature-auth', '/tmp/changes/feature-auth', 'spec-driven', {
      store: 'teams',
      id: 'team-alpha',
    });

    expect(result.initiative).toEqual({ store: 'teams', id: 'team-alpha' });
  });
});
