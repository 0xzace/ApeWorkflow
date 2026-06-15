import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const workspaceErrorReportingMocks = vi.hoisted(() => ({
  reportUserVisibleError: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/cli/error-handling.js', () => ({
  reportUserVisibleError: workspaceErrorReportingMocks.reportUserVisibleError,
}));

import { registerWorkspaceCommand } from '../../src/commands/workspace.js';

describe('workspace error reporting wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  it('reports workspace validation failures through the shared reporter', async () => {
    const program = new Command();
    program.exitOverride();
    registerWorkspaceCommand(program);

    await program.parseAsync(['workspace', 'link'], {
      from: 'user',
    });

    expect(workspaceErrorReportingMocks.reportUserVisibleError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ commandPath: 'workspace:link' })
    );
    expect(process.exitCode).toBe(1);
  });
});
