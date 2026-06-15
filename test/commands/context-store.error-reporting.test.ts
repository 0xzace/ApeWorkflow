import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const contextStoreErrorReportingMocks = vi.hoisted(() => ({
  reportUserVisibleError: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/cli/error-handling.js', () => ({
  reportUserVisibleError: contextStoreErrorReportingMocks.reportUserVisibleError,
}));

import { registerContextStoreCommand } from '../../src/commands/context-store.js';

describe('context-store error reporting wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  it('reports context-store validation failures through the shared reporter', async () => {
    const program = new Command();
    program.exitOverride();
    registerContextStoreCommand(program);

    await program.parseAsync(['context-store', 'setup', '--json'], {
      from: 'user',
    });

    expect(contextStoreErrorReportingMocks.reportUserVisibleError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ commandPath: 'context-store:setup' })
    );
    expect(process.exitCode).toBe(1);
  });
});
