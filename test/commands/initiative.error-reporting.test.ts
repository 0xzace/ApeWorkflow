import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const initiativeErrorReportingMocks = vi.hoisted(() => ({
  reportUserVisibleError: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/cli/error-handling.js', () => ({
  reportUserVisibleError: initiativeErrorReportingMocks.reportUserVisibleError,
}));

import { registerInitiativeCommand } from '../../src/commands/initiative.js';

describe('initiative error reporting wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  it('reports initiative validation failures through the shared reporter', async () => {
    const program = new Command();
    program.exitOverride();
    registerInitiativeCommand(program);

    await program.parseAsync(['initiative', 'create', 'demo', '--title', 'Demo'], {
      from: 'user',
    });

    expect(initiativeErrorReportingMocks.reportUserVisibleError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ commandPath: 'initiative:create' })
    );
    expect(process.exitCode).toBe(1);
  });
});
