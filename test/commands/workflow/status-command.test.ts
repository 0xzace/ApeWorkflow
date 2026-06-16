import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// 测试 statusCommand — 通过 vi.hoisted + vi.mock 模式
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  planningHome: vi.fn(),
  getChangeDir: vi.fn(),
  validateChangeExists: vi.fn(),
  validateSchemaExists: vi.fn(),
  getAvailableChanges: vi.fn(),
  getStatusIndicator: vi.fn(),
  getStatusColor: vi.fn(),
  loadChangeContext: vi.fn(),
  formatChangeStatus: vi.fn(),
  spinner: { start: vi.fn().mockReturnThis(), stop: vi.fn() },
}));

vi.mock('ora', () => ({ default: vi.fn(() => mocks.spinner) }));

vi.mock('../../../src/core/planning-home.js', () => ({
  resolveCurrentPlanningHomeSync: mocks.planningHome,
  getChangeDir: mocks.getChangeDir,
}));

vi.mock('../../../src/commands/workflow/shared.js', () => ({
  validateChangeExists: mocks.validateChangeExists,
  validateSchemaExists: mocks.validateSchemaExists,
  getAvailableChanges: mocks.getAvailableChanges,
  getStatusIndicator: mocks.getStatusIndicator,
  getStatusColor: mocks.getStatusColor,
}));

vi.mock('../../../src/core/artifact-graph/index.js', () => ({
  loadChangeContext: mocks.loadChangeContext,
  formatChangeStatus: mocks.formatChangeStatus,
}));

describe('statusCommand', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let originalExitCode: typeof process.exitCode;

  beforeEach(() => {
    originalExitCode = process.exitCode;
    process.exitCode = undefined;
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mocks.spinner.start.mockClear();
    mocks.spinner.stop.mockClear();
  });

  afterEach(() => {
    logSpy.mockRestore();
    process.exitCode = originalExitCode;
    vi.clearAllMocks();
  });

  // --- 缺省 --change 路径 ---

  describe('缺省 --change', () => {
    it('当没有变更且 json=false 时打印友好消息', async () => {
      mocks.planningHome.mockReturnValue({
        root: '/tmp/test',
        changesDir: '/tmp/test/apeworkflow/changes',
        defaultSchema: 'spec-driven',
        kind: 'repo',
      });
      mocks.getAvailableChanges.mockResolvedValue([]);

      const { statusCommand } = await import(
        '../../../src/commands/workflow/status.js'
      );

      await statusCommand({ json: false });

      expect(logSpy).toHaveBeenCalledWith(
        'No active changes. Create one with: apeworkflow new change <name>'
      );
    });

    it('当没有变更且 json=true 时返回空 JSON', async () => {
      mocks.planningHome.mockReturnValue({
        root: '/tmp/test',
        changesDir: '/tmp/test/apeworkflow/changes',
        defaultSchema: 'spec-driven',
        kind: 'repo',
      });
      mocks.getAvailableChanges.mockResolvedValue([]);

      const { statusCommand } = await import(
        '../../../src/commands/workflow/status.js'
      );

      await statusCommand({ json: true });

      const calls = logSpy.mock.calls;
      const payload = JSON.parse(calls[0][0] as string);
      expect(payload.changes).toEqual([]);
      expect(payload.message).toBe('No active changes.');
    });

    it('有变更但未提供 --change 时抛出错误', async () => {
      mocks.planningHome.mockReturnValue({
        root: '/tmp/test',
        changesDir: '/tmp/test/apeworkflow/changes',
        defaultSchema: 'spec-driven',
        kind: 'repo',
      });
      mocks.getAvailableChanges.mockResolvedValue(['change-a', 'change-b']);

      const { statusCommand } = await import(
        '../../../src/commands/workflow/status.js'
      );

      await expect(statusCommand({ json: false })).rejects.toThrow(
        'Missing required option --change'
      );
    });
  });

  // --- 提供 --change 路径 ---

  describe('提供 --change', () => {
    it('在 json 模式下输出变更状态', async () => {
      mocks.planningHome.mockReturnValue({
        root: '/tmp/test',
        changesDir: '/tmp/test/apeworkflow/changes',
        defaultSchema: 'spec-driven',
        kind: 'repo',
      });
      mocks.validateChangeExists.mockResolvedValue('demo');
      mocks.getChangeDir.mockReturnValue('/tmp/test/apeworkflow/changes/demo');
      mocks.loadChangeContext.mockReturnValue({
        graph: { getArtifact: vi.fn(), getAllArtifacts: vi.fn().mockReturnValue([]) },
        schemaName: 'spec-driven',
        changeDir: '/tmp/test/apeworkflow/changes/demo',
        initiative: undefined,
      });
      mocks.formatChangeStatus.mockReturnValue({
        changeName: 'demo',
        schemaName: 'spec-driven',
        initiative: undefined,
        planningHome: undefined,
        changeRoot: '/tmp/test/apeworkflow/changes/demo',
        artifactPaths: {},
        affectedAreas: undefined,
        nextSteps: [],
        actionContext: {},
        isComplete: false,
        applyRequires: [],
        artifacts: [
          { id: 'proposal', outputPath: 'proposal.md', status: 'done' },
          { id: 'tasks', outputPath: 'tasks.md', status: 'blocked', missingDeps: ['proposal'] },
        ],
      });

      const { statusCommand } = await import(
        '../../../src/commands/workflow/status.js'
      );

      await statusCommand({ change: 'demo', json: true });

      const calls = logSpy.mock.calls;
      const payload = JSON.parse(calls[0][0] as string);
      expect(payload.changeName).toBe('demo');
      expect(payload.artifacts).toHaveLength(2);
    });
  });
});
