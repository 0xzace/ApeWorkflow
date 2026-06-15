import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const cliErrorHandlingMocks = vi.hoisted(() => {
  const reportSpy = vi.fn().mockResolvedValue(undefined);
  const createErrorReporterMock = vi.fn(() => ({
    report: reportSpy,
  }));
  const oraFailSpy = vi.fn();

  return {
    reportSpy,
    createErrorReporterMock,
    oraFailSpy,
  };
});

vi.mock('ora', () => ({
  default: () => ({
    fail: cliErrorHandlingMocks.oraFailSpy,
  }),
}));

vi.mock('../../src/core/error-reporting/index.js', () => ({
  createErrorReporter: cliErrorHandlingMocks.createErrorReporterMock,
}));

import { handleCliFailure, installErrorReportingHooks } from '../../src/cli/error-handling.js';

describe('cli/error-handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  it('reports the failure before exiting', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
      throw new Error(`process.exit(${code})`);
    });

    await expect(
      handleCliFailure(new Error('boom'), {
        commandPath: 'workspace:update',
      })
    ).rejects.toThrow('process.exit(1)');

    expect(cliErrorHandlingMocks.reportSpy).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        commandPath: 'workspace:update',
        source: 'command',
      })
    );
    expect(cliErrorHandlingMocks.oraFailSpy).toHaveBeenCalledWith('Error: boom');

    exitSpy.mockRestore();
  });

  it('registers uncaughtException and unhandledRejection hooks', () => {
    const onSpy = vi.spyOn(process, 'on');

    installErrorReportingHooks();

    expect(onSpy).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
    expect(onSpy).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
  });
});
