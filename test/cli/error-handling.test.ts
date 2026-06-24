import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const cliErrorHandlingMocks = vi.hoisted(() => {
  const reportSpy = vi.fn().mockResolvedValue(undefined);
  const createErrorReporterMock = vi.fn(() => ({
    report: reportSpy,
  }));

  return {
    reportSpy,
    createErrorReporterMock,
  };
});

vi.mock('../../src/core/error-reporting/index.js', () => ({
  createErrorReporter: cliErrorHandlingMocks.createErrorReporterMock,
}));

import { handleCliFailure, installErrorReportingHooks } from '../../src/cli/error-handling.js';

describe('cli/error-handling', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
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
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: boom');

    exitSpy.mockRestore();
  });

  it('formats string failures without dropping the message', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
      throw new Error(`process.exit(${code})`);
    });

    await expect(
      handleCliFailure('boom', {
        commandPath: 'feedback',
      })
    ).rejects.toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: boom');
    exitSpy.mockRestore();
  });

  it('registers uncaughtException and unhandledRejection hooks', () => {
    const onSpy = vi.spyOn(process, 'on');

    installErrorReportingHooks();

    expect(onSpy).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
    expect(onSpy).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
  });
});
