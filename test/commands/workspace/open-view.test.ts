import { describe, expect, it } from 'vitest';

import {
  assertWorkspaceOpenSupportedOptions,
  buildWorkspaceOpenJsonPayload,
} from '../../../src/commands/workspace/open-view.js';
import { parseWorkspacePreferredOpenerValue } from '../../../src/core/workspace/index.js';

describe('workspace open view helpers', () => {
  it('会拒绝不支持的 open 选项', () => {
    expect(() =>
      assertWorkspaceOpenSupportedOptions({
        store: 'team-context',
      } as any)
    ).toThrow(/only with --initiative/u);

    expect(() =>
      assertWorkspaceOpenSupportedOptions({
        prepareOnly: true,
      } as any)
    ).toThrow(/preview output is reserved/u);

    expect(() =>
      assertWorkspaceOpenSupportedOptions({
        change: 'add-billing',
      } as any)
    ).toThrow(/change-scoped open belongs to future workspace change planning/u);
  });

  it('会构建 workspace open 的 JSON receipt', () => {
    const payload = buildWorkspaceOpenJsonPayload({
      selected: {
        name: 'platform',
        root: '/workspaces/platform',
      },
      initiative: {
        store: 'team-context',
        storeRoot: '/stores/team-context',
        id: 'launch-billing-flow',
        title: 'Launch Billing Flow',
        root: '/stores/team-context/launch-billing-flow',
        storePath: '/stores/team-context',
        metadataPath: '/stores/team-context/launch-billing-flow/initiative.yaml',
      } as any,
      workspaceContext: {
        store: {
          selector: {
            kind: 'path',
            path: '/stores/team-context',
          },
        },
      } as any,
      generated: {
        agentsPath: '/workspaces/platform/.codex/agents',
        codeWorkspacePath: '/workspaces/platform/platform.code-workspace',
      },
      openedRoots: [
        {
          kind: 'link',
          name: 'api',
          path: '/repos/api',
        },
        {
          kind: 'workspace',
          path: '/workspaces/platform',
        },
      ] as any,
      skipped: [
        {
          kind: 'link',
          name: 'docs',
          path: '/repos/docs',
          reason: 'missing',
        },
      ] as any,
      opener: parseWorkspacePreferredOpenerValue('editor'),
      warnings: [],
    } as any);

    expect(payload.schema_version).toBe(1);
    expect(payload.workspace).toEqual({
      name: 'platform',
      root: '/workspaces/platform',
    });
    expect(payload.context?.context_store).toEqual(
      expect.objectContaining({
        id: 'team-context',
        root: '/stores/team-context',
      })
    );
    expect(payload.advisory_edit_boundaries.allowed_edit_roots).toEqual(['/repos/api']);
    expect(payload.opener.label).toBe('VS Code editor');
    expect(payload.skipped_roots).toEqual([
      {
        kind: 'link',
        name: 'docs',
        path: '/repos/docs',
        reason: 'missing',
      },
    ]);
  });

  it('会构建不带 initiative 的 workspace open JSON receipt', () => {
    // 中文注释：这里覆盖没有 initiative 的分支，确认上下文和协调根路径会回到空值。
    const payload = buildWorkspaceOpenJsonPayload({
      selected: {
        name: 'platform',
        root: '/workspaces/platform',
      },
      initiative: null,
      workspaceContext: null,
      generated: {
        agentsPath: '/workspaces/platform/.codex/agents',
        codeWorkspacePath: '/workspaces/platform/platform.code-workspace',
      },
      openedRoots: [
        {
          kind: 'link',
          name: 'api',
          path: '/repos/api',
        },
        {
          kind: 'workspace',
          path: '/workspaces/platform',
        },
      ] as any,
      skipped: [] as any,
      opener: parseWorkspacePreferredOpenerValue('editor'),
      warnings: [],
    } as any);

    expect(payload.context).toBeNull();
    expect(payload.advisory_edit_boundaries.allowed_edit_roots).toEqual(['/repos/api']);
    expect(payload.advisory_edit_boundaries.coordination_roots).toEqual([]);
    expect(payload.opener.label).toBe('VS Code editor');
  });
});
