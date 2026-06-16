import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { printStatusText } from '../../../src/commands/workflow/status.js';

describe('workflow status output', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    originalEnv = { ...process.env };
    process.env.NO_COLOR = '1';
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    process.env = originalEnv;
  });

  it('打印带阻塞信息的状态摘要', () => {
    // 中文注释：这里覆盖 blocked 分支，确保缺失依赖会出现在输出里。
    printStatusText({
      changeName: 'demo',
      schemaName: 'spec-driven',
      planningHome: {
        kind: 'workspace',
        workspaceName: 'acme',
      },
      initiative: {
        store: 'platform',
        id: 'billing-launch',
      },
      changeRoot: '/tmp/demo',
      artifactPaths: {},
      affectedAreas: undefined,
      nextSteps: [],
      actionContext: {} as any,
      isComplete: false,
      applyRequires: [],
      artifacts: [
        { id: 'proposal', outputPath: 'proposal.md', status: 'done' },
        { id: 'tasks', outputPath: 'tasks.md', status: 'blocked', missingDeps: ['proposal'] },
      ],
    } as any);

    expect(consoleLogSpy).toHaveBeenCalledWith('Change: demo');
    expect(consoleLogSpy).toHaveBeenCalledWith('Schema: spec-driven');
    expect(consoleLogSpy).toHaveBeenCalledWith('Initiative: platform/billing-launch');
    expect(consoleLogSpy).toHaveBeenCalledWith('Planning home: workspace (acme)');
    expect(consoleLogSpy).toHaveBeenCalledWith('Change root: /tmp/demo');
    expect(consoleLogSpy).toHaveBeenCalledWith('Progress: 1/2 artifacts complete');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('blocked by: proposal'));
  });

  it('在全部完成时输出收尾提示', () => {
    printStatusText({
      changeName: 'done',
      schemaName: 'spec-driven',
      changeRoot: '/tmp/done',
      artifactPaths: {},
      nextSteps: [],
      actionContext: {} as any,
      isComplete: true,
      applyRequires: [],
      artifacts: [
        { id: 'proposal', outputPath: 'proposal.md', status: 'done' },
      ],
    } as any);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('All artifacts complete!'));
  });
});
