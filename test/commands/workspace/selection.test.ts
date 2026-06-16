import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// 测试 src/commands/workspace/selection.ts
// 使用 vi.hoisted + vi.mock 模式模拟依赖
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  listKnownWorkspaceEntries: vi.fn(),
  findWorkspaceRoot: vi.fn(),
  readWorkspaceViewState: vi.fn(),
  isInteractive: vi.fn(),
  resolveNoInteractive: vi.fn(),
}));

vi.mock('../../../src/core/workspace/index.js', () => ({
  listKnownWorkspaceEntries: mocks.listKnownWorkspaceEntries,
  findWorkspaceRoot: mocks.findWorkspaceRoot,
  readWorkspaceViewState: mocks.readWorkspaceViewState,
}));

vi.mock('../../../src/utils/interactive.js', () => ({
  isInteractive: mocks.isInteractive,
  resolveNoInteractive: mocks.resolveNoInteractive,
}));

vi.mock('../../../src/utils/file-system.js', () => ({
  FileSystemUtils: {
    canonicalizeExistingPath: (p: string) => p,
    createDirectory: vi.fn(),
  },
}));

vi.mock('../../../src/commands/workspace/operations.js', () => ({
  validateWorkspaceNameForSetup: (name: string) => name,
}));

// ---------------------------------------------------------------------------
// selectedWorkspaceFromEntry
// ---------------------------------------------------------------------------

describe('selectedWorkspaceFromEntry', () => {
  it('从 registry entry 构建 SelectedWorkspace', async () => {
    const { selectedWorkspaceFromEntry } = await import(
      '../../../src/commands/workspace/selection.js'
    );

    const entry = {
      name: 'platform',
      workspaceRoot: '/workspaces/platform',
    } as any;

    const result = selectedWorkspaceFromEntry(entry);

    expect(result.name).toBe('platform');
    expect(result.root).toBe('/workspaces/platform');
    expect(result.status).toEqual([]);
    expect(result.unregisteredCurrentWorkspace).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// selectWorkspaceForCommand — 显式名称
// ---------------------------------------------------------------------------

describe('selectWorkspaceForCommand — 显式名称', () => {
  beforeEach(() => {
    mocks.listKnownWorkspaceEntries.mockReset();
    mocks.findWorkspaceRoot.mockReset();
    mocks.isInteractive.mockReset();
    mocks.resolveNoInteractive.mockReset();
    mocks.resolveNoInteractive.mockReturnValue(false);
  });

  it('在提供 workspace 名称时按名称查找并返回', async () => {
    mocks.listKnownWorkspaceEntries.mockResolvedValue([
      { name: 'platform', workspaceRoot: '/workspaces/platform' },
      { name: 'billing', workspaceRoot: '/workspaces/billing' },
    ]);

    const { selectWorkspaceForCommand } = await import(
      '../../../src/commands/workspace/selection.js'
    );

    const result = await selectWorkspaceForCommand(
      { workspace: 'billing', json: true },
      'doctor'
    );

    expect(result.name).toBe('billing');
    expect(result.root).toBe('/workspaces/billing');
  });

  it('名称不存在时抛出 workspace_not_found', async () => {
    mocks.listKnownWorkspaceEntries.mockResolvedValue([
      { name: 'platform', workspaceRoot: '/workspaces/platform' },
    ]);

    const { selectWorkspaceForCommand } = await import(
      '../../../src/commands/workspace/selection.js'
    );

    await expect(
      selectWorkspaceForCommand({ workspace: 'unknown', json: true }, 'doctor')
    ).rejects.toThrow('Unknown ApeWorkflow workspace');
  });
});

// ---------------------------------------------------------------------------
// selectWorkspaceForCommand — 无已知工作区
// ---------------------------------------------------------------------------

describe('selectWorkspaceForCommand — 无已知工作区', () => {
  beforeEach(() => {
    mocks.listKnownWorkspaceEntries.mockReset();
    mocks.findWorkspaceRoot.mockReset();
    mocks.resolveNoInteractive.mockReset().mockReturnValue(false);
  });

  it('当没有已知工作区时抛出 no_known_workspaces', async () => {
    mocks.listKnownWorkspaceEntries.mockResolvedValue([]);
    mocks.findWorkspaceRoot.mockResolvedValue(null);

    const { selectWorkspaceForCommand } = await import(
      '../../../src/commands/workspace/selection.js'
    );

    await expect(
      selectWorkspaceForCommand({ json: true }, 'doctor')
    ).rejects.toThrow('No known ApeWorkflow workspaces');
  });
});

// ---------------------------------------------------------------------------
// selectWorkspaceForCommand — 单条目自动选择
// ---------------------------------------------------------------------------

describe('selectWorkspaceForCommand — 单条目', () => {
  beforeEach(() => {
    mocks.listKnownWorkspaceEntries.mockReset();
    mocks.findWorkspaceRoot.mockReset();
    mocks.resolveNoInteractive.mockReset().mockReturnValue(false);
  });

  it('当只有一个已知工作区时自动选择', async () => {
    mocks.listKnownWorkspaceEntries.mockResolvedValue([
      { name: 'platform', workspaceRoot: '/workspaces/platform' },
    ]);
    mocks.findWorkspaceRoot.mockResolvedValue(null);

    const { selectWorkspaceForCommand } = await import(
      '../../../src/commands/workspace/selection.js'
    );

    const result = await selectWorkspaceForCommand({ json: true }, 'doctor');

    expect(result.name).toBe('platform');
    expect(result.root).toBe('/workspaces/platform');
  });
});

// ---------------------------------------------------------------------------
// selectWorkspaceForCommand — 多条目非交互模糊
// ---------------------------------------------------------------------------

describe('selectWorkspaceForCommand — 多条目非交互', () => {
  beforeEach(() => {
    mocks.listKnownWorkspaceEntries.mockReset();
    mocks.findWorkspaceRoot.mockReset();
    mocks.isInteractive.mockReset().mockReturnValue(false);
    mocks.resolveNoInteractive.mockReset().mockReturnValue(false);
  });

  it('多工作区 + 非交互时抛出 ambiguous 错误', async () => {
    mocks.listKnownWorkspaceEntries.mockResolvedValue([
      { name: 'platform', workspaceRoot: '/workspaces/platform' },
      { name: 'billing', workspaceRoot: '/workspaces/billing' },
    ]);
    mocks.findWorkspaceRoot.mockResolvedValue(null);

    const { selectWorkspaceForCommand } = await import(
      '../../../src/commands/workspace/selection.js'
    );

    await expect(
      selectWorkspaceForCommand({ json: true }, 'doctor')
    ).rejects.toThrow('Multiple ApeWorkflow workspaces are known');
  });
});

// ---------------------------------------------------------------------------
// selectedWorkspaceFromRoot
// ---------------------------------------------------------------------------

describe('selectedWorkspaceFromRoot', () => {
  beforeEach(() => {
    mocks.readWorkspaceViewState.mockReset();
    mocks.listKnownWorkspaceEntries.mockReset();
  });

  it('注册的工作区不报告警告', async () => {
    mocks.readWorkspaceViewState.mockResolvedValue({
      version: 1,
      name: 'platform',
      links: {},
    } as any);

    mocks.listKnownWorkspaceEntries.mockResolvedValue([
      { name: 'platform', workspaceRoot: '/workspaces/platform' },
    ]);

    const { selectedWorkspaceFromRoot } = await import(
      '../../../src/commands/workspace/selection.js'
    );

    const result = await selectedWorkspaceFromRoot('/workspaces/platform', [
      { name: 'platform', workspaceRoot: '/workspaces/platform' },
    ]);

    expect(result.unregisteredCurrentWorkspace).toBe(false);
    expect(result.status).toEqual([]);
  });

  it('未注册的工作区报告 warning', async () => {
    mocks.readWorkspaceViewState.mockResolvedValue({
      version: 1,
      name: 'rogue',
      links: {},
    } as any);

    // 已知 workspaces 中没有匹配的
    mocks.listKnownWorkspaceEntries.mockResolvedValue([
      { name: 'platform', workspaceRoot: '/workspaces/platform' },
    ]);

    const { selectedWorkspaceFromRoot } = await import(
      '../../../src/commands/workspace/selection.js'
    );

    const result = await selectedWorkspaceFromRoot('/workspaces/rogue', [
      { name: 'platform', workspaceRoot: '/workspaces/platform' },
    ]);

    expect(result.unregisteredCurrentWorkspace).toBe(true);
    expect(result.status).toHaveLength(1);
    expect(result.status[0].code).toBe('workspace_not_in_known_views');
  });
});
