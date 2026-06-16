import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const openTargetMocks = vi.hoisted(() => ({
  selectWorkspaceForCommand: vi.fn(),
  selectedWorkspaceFromRoot: vi.fn(),
  findWorkspaceRoot: vi.fn(),
  listKnownWorkspaceEntries: vi.fn(),
  isInteractive: vi.fn(),
  resolveNoInteractive: vi.fn(),
}));

vi.mock('../../../src/commands/workspace/selection.js', () => ({
  selectWorkspaceForCommand: openTargetMocks.selectWorkspaceForCommand,
  selectedWorkspaceFromRoot: openTargetMocks.selectedWorkspaceFromRoot,
}));

vi.mock('../../../src/core/workspace/index.js', () => ({
  findWorkspaceRoot: openTargetMocks.findWorkspaceRoot,
  listKnownWorkspaceEntries: openTargetMocks.listKnownWorkspaceEntries,
}));

vi.mock('../../../src/utils/interactive.js', () => ({
  isInteractive: openTargetMocks.isInteractive,
  resolveNoInteractive: openTargetMocks.resolveNoInteractive,
}));

describe('workspace open target selection branches', () => {
  let originalCwd: string;

  beforeEach(() => {
    // 中文注释：这里只验证 open target 的分支，不走真实 workspace 扫描。
    vi.resetModules();
    originalCwd = process.cwd();
    openTargetMocks.selectWorkspaceForCommand.mockReset();
    openTargetMocks.selectedWorkspaceFromRoot.mockReset();
    openTargetMocks.findWorkspaceRoot.mockReset();
    openTargetMocks.listKnownWorkspaceEntries.mockReset();
    openTargetMocks.isInteractive.mockReset();
    openTargetMocks.resolveNoInteractive.mockReset();
    openTargetMocks.resolveNoInteractive.mockReturnValue(false);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    vi.clearAllMocks();
  });

  it('会在显式 workspace 名称下直接选择 workspace', async () => {
    openTargetMocks.isInteractive.mockReturnValue(false);
    openTargetMocks.selectWorkspaceForCommand.mockResolvedValue({
      name: 'platform',
      root: '/workspaces/platform',
      status: [],
      unregisteredCurrentWorkspace: false,
    });

    const { selectWorkspaceOpenTarget } = await import(
      '../../../src/commands/workspace/open-target-selection.js'
    );

    await expect(selectWorkspaceOpenTarget('platform', { json: true } as any)).resolves.toEqual({
      kind: 'workspace',
      selected: {
        name: 'platform',
        root: '/workspaces/platform',
        status: [],
        unregisteredCurrentWorkspace: false,
      },
      status: [],
    });
    expect(openTargetMocks.selectWorkspaceForCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace: 'platform',
        json: true,
      }),
      'open',
      { preferPositionalName: true }
    );
  });

  it('会在当前 workspace root 可用时沿用该 workspace', async () => {
    openTargetMocks.isInteractive.mockReturnValue(true);
    openTargetMocks.findWorkspaceRoot.mockResolvedValue('/workspaces/platform');
    openTargetMocks.listKnownWorkspaceEntries.mockResolvedValue([]);
    openTargetMocks.selectedWorkspaceFromRoot.mockResolvedValue({
      name: 'platform',
      root: '/workspaces/platform',
      status: [],
      unregisteredCurrentWorkspace: false,
    });

    const { selectWorkspaceOpenTarget } = await import(
      '../../../src/commands/workspace/open-target-selection.js'
    );

    await expect(selectWorkspaceOpenTarget(undefined, {} as any)).resolves.toEqual({
      kind: 'workspace',
      selected: {
        name: 'platform',
        root: '/workspaces/platform',
        status: [],
        unregisteredCurrentWorkspace: false,
      },
      status: [],
    });
    expect(openTargetMocks.selectedWorkspaceFromRoot).toHaveBeenCalledWith(
      '/workspaces/platform',
      []
    );
  });

  it('会在没有可选 workspace 时返回公开的选择错误', async () => {
    // 中文注释：这里覆盖没有当前 workspace 且也没有可选条目的错误分支。
    openTargetMocks.isInteractive.mockReturnValue(true);
    openTargetMocks.findWorkspaceRoot.mockResolvedValue(null);
    openTargetMocks.listKnownWorkspaceEntries.mockResolvedValue([]);
    openTargetMocks.selectWorkspaceForCommand.mockResolvedValue({
      name: 'platform',
      root: '/workspaces/platform',
      status: [],
      unregisteredCurrentWorkspace: false,
    });

    const { selectWorkspaceOpenTarget } = await import(
      '../../../src/commands/workspace/open-target-selection.js'
    );

    await expect(selectWorkspaceOpenTarget(undefined, {} as any)).resolves.toEqual({
      kind: 'workspace',
      selected: {
        name: 'platform',
        root: '/workspaces/platform',
        status: [],
        unregisteredCurrentWorkspace: false,
      },
      status: [],
    });
  });
});
