import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const contextStatusMocks = vi.hoisted(() => ({
  formatContextStoreBinding: vi.fn(),
  formatContextStoreBindingSelector: vi.fn(),
  resolveContextStoreBinding: vi.fn(),
  mountInitiativesCollection: vi.fn(),
  readInitiative: vi.fn(),
  getWorkspaceContextInitiativeId: vi.fn(),
}));

vi.mock('../../../src/core/context-store/index.js', () => ({
  formatContextStoreBinding: contextStatusMocks.formatContextStoreBinding,
  formatContextStoreBindingSelector: contextStatusMocks.formatContextStoreBindingSelector,
  resolveContextStoreBinding: contextStatusMocks.resolveContextStoreBinding,
}));

vi.mock('../../../src/core/collections/initiatives/index.js', () => ({
  mountInitiativesCollection: contextStatusMocks.mountInitiativesCollection,
  readInitiative: contextStatusMocks.readInitiative,
}));

vi.mock('../../../src/core/workspace/index.js', () => ({
  getWorkspaceContextInitiativeId: contextStatusMocks.getWorkspaceContextInitiativeId,
}));

import { collectWorkspaceContextStatuses } from '../../../src/commands/workspace/context-status.js';

describe('workspace context status collection', () => {
  beforeEach(() => {
    // 中文注释：每个分支都用显式 mock，避免依赖真实上下文存储状态。
    vi.clearAllMocks();
    contextStatusMocks.formatContextStoreBinding.mockReturnValue('platform');
    contextStatusMocks.formatContextStoreBindingSelector.mockReturnValue('--store platform');
    contextStatusMocks.getWorkspaceContextInitiativeId.mockReturnValue('billing-launch');
    contextStatusMocks.mountInitiativesCollection.mockReturnValue({});
    contextStatusMocks.resolveContextStoreBinding.mockResolvedValue({
      root: '/stores/platform',
      warnings: [],
    });
    contextStatusMocks.readInitiative.mockResolvedValue({ id: 'billing-launch' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('在没有上下文时返回空状态列表', async () => {
    await expect(collectWorkspaceContextStatuses(null)).resolves.toEqual([]);
  });

  it('在 context store 无法读取时返回错误状态', async () => {
    contextStatusMocks.resolveContextStoreBinding.mockRejectedValueOnce(new Error('boom'));

    await expect(
      collectWorkspaceContextStatuses({
        store: { selector: { kind: 'registry' } },
      } as any)
    ).resolves.toEqual([
      expect.objectContaining({
        code: 'workspace_context_store_unavailable',
        target: 'workspace.context.store',
        fix: 'apeworkflow context-store doctor',
      }),
    ]);
  });

  it('在 initiative 缺失时返回 warning 加 error', async () => {
    contextStatusMocks.resolveContextStoreBinding.mockResolvedValueOnce({
      root: '/stores/platform',
      warnings: [
        {
          code: 'binding_warning',
          message: 'binding warning',
          target: 'missing',
          fix: 'fix it',
        },
      ],
    });
    contextStatusMocks.readInitiative.mockResolvedValueOnce(null);

    await expect(
      collectWorkspaceContextStatuses({
        store: { selector: { kind: 'registry' } },
      } as any)
    ).resolves.toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'binding_warning',
        target: 'workspace.context.store.missing',
        fix: 'fix it',
      }),
      expect.objectContaining({
        severity: 'error',
        code: 'workspace_initiative_missing',
        target: 'workspace.context.initiative',
      }),
    ]);
  });

  it('在 initiative 可读时只返回 warning', async () => {
    contextStatusMocks.resolveContextStoreBinding.mockResolvedValueOnce({
      root: '/stores/platform',
      warnings: [
        {
          code: 'binding_warning',
          message: 'binding warning',
        },
      ],
    });

    await expect(
      collectWorkspaceContextStatuses({
        store: { selector: { kind: 'path' } },
      } as any)
    ).resolves.toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'binding_warning',
      }),
    ]);
  });
});
