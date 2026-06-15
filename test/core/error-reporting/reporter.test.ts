import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildErrorFingerprint, normalizeError } from '../../../src/core/error-reporting/fingerprint.js';
import { createErrorReporter } from '../../../src/core/error-reporting/reporter.js';

// 中文注释：验证 reporter 会按 fingerprint 首次建 issue、重复时补 comment。
describe('error-reporting/reporter', () => {
  const github = {
    createGitHubIssue: vi.fn(),
    appendGitHubIssueComment: vi.fn(),
  };
  const stateStore = {
    readErrorReportState: vi.fn(),
    writeErrorReportState: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    github.createGitHubIssue.mockResolvedValue({
      issueNumber: 17,
      issueUrl: 'https://github.com/0xzace/ApeWorkflow/issues/17',
    });
    github.appendGitHubIssueComment.mockResolvedValue(undefined);
    stateStore.readErrorReportState.mockResolvedValue({ version: 1, issues: {} });
    stateStore.writeErrorReportState.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a new issue for the first occurrence of a fingerprint', async () => {
    const reporter = createErrorReporter({
      config: {
        enabled: true,
        repository: '0xzace/ApeWorkflow',
        statePath: '/tmp/error-reporting-state.json',
      },
      github,
      stateStore,
      clock: () => '2026-06-15T00:00:00.000Z',
    });

    await reporter.report(new Error('workspace link requires a repo or folder path.'), {
      commandPath: 'workspace:link',
      source: 'command',
      workspaceRoot: '/tmp/workspace',
    });

    expect(github.createGitHubIssue).toHaveBeenCalledTimes(1);
    expect(github.appendGitHubIssueComment).not.toHaveBeenCalled();
    expect(stateStore.writeErrorReportState).toHaveBeenCalledTimes(1);
    const writtenState = stateStore.writeErrorReportState.mock.calls[0][0];
    const [fingerprint] = Object.keys(writtenState.issues);
    expect(fingerprint).toBeTruthy();
    expect(writtenState.issues[fingerprint]).toEqual(
      expect.objectContaining({
        issueNumber: 17,
        count: 1,
      })
    );
  });

  it('adds a comment when the same fingerprint appears again', async () => {
    const repeatedEvent = normalizeError(new Error('workspace link requires a repo or folder path.'), {
      commandPath: 'workspace:link',
      source: 'command',
      workspaceRoot: '/tmp/workspace',
    });
    const repeatedFingerprint = buildErrorFingerprint(repeatedEvent);

    stateStore.readErrorReportState.mockResolvedValue({
      version: 1,
      issues: {
        [repeatedFingerprint]: {
          issueNumber: 17,
          issueUrl: 'https://github.com/0xzace/ApeWorkflow/issues/17',
          firstSeenAt: '2026-06-15T00:00:00.000Z',
          lastSeenAt: '2026-06-15T00:00:00.000Z',
          count: 1,
        },
      },
    });

    const reporter = createErrorReporter({
      config: {
        enabled: true,
        repository: '0xzace/ApeWorkflow',
        statePath: '/tmp/error-reporting-state.json',
      },
      github,
      stateStore,
      clock: () => '2026-06-15T00:10:00.000Z',
    });

    await reporter.report(new Error('workspace link requires a repo or folder path.'), {
      commandPath: 'workspace:link',
      source: 'command',
      workspaceRoot: '/tmp/workspace',
    });

    expect(github.createGitHubIssue).not.toHaveBeenCalled();
    expect(github.appendGitHubIssueComment).toHaveBeenCalledTimes(1);
  });

  it('returns without throwing when reporting is disabled', async () => {
    const reporter = createErrorReporter({
      config: {
        enabled: false,
        repository: '0xzace/ApeWorkflow',
        statePath: '/tmp/error-reporting-state.json',
      },
      github,
      stateStore,
      clock: () => '2026-06-15T00:00:00.000Z',
    });

    await expect(
      reporter.report(new Error('boom'), {
        commandPath: 'workspace:update',
        source: 'command',
      })
    ).resolves.toBeUndefined();
    expect(github.createGitHubIssue).not.toHaveBeenCalled();
  });
});
