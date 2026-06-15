import { readErrorReportingConfig } from './config.js';
import { buildErrorFingerprint, normalizeError } from './fingerprint.js';
import {
  appendGitHubIssueComment,
  createGitHubIssue,
} from './github.js';
import {
  readErrorReportState,
  upsertErrorReportStateEntry,
  writeErrorReportState,
} from './state.js';
import type {
  ErrorReportContext,
  ErrorReportState,
  ErrorReportingConfig,
  NormalizedErrorReport,
} from './types.js';

export interface ErrorReporterDependencies {
  config?: ErrorReportingConfig;
  github?: {
    createGitHubIssue: typeof createGitHubIssue;
    appendGitHubIssueComment: typeof appendGitHubIssueComment;
  };
  stateStore?: {
    readErrorReportState: typeof readErrorReportState;
    writeErrorReportState: typeof writeErrorReportState;
  };
  clock?: () => string;
}

function formatIssueTitle(event: NormalizedErrorReport): string {
  // 中文注释：标题保持短而稳定，方便在 GitHub issue 列表里快速定位。
  return `${event.name}: ${event.message}`;
}

function formatIssueBody(
  event: NormalizedErrorReport,
  fingerprint: string,
  firstSeenAt: string,
  count: number
): string {
  // 中文注释：把错误内容和上下文写进 issue，方便后续排查。
  return [
    `Fingerprint: ${fingerprint}`,
    `First seen at: ${firstSeenAt}`,
    `Occurrences: ${count}`,
    '',
    `Command: ${event.commandPath}`,
    `Source: ${event.source}`,
    event.workspaceRoot ? `Workspace root: ${event.workspaceRoot}` : undefined,
    event.workspaceName ? `Workspace name: ${event.workspaceName}` : undefined,
    event.contextStoreId ? `Context store: ${event.contextStoreId}` : undefined,
    event.changeId ? `Change ID: ${event.changeId}` : undefined,
    '',
    'Error:',
    event.stack,
  ]
    .filter((line): line is string => line !== undefined)
    .join('\n');
}

function formatRepeatComment(
  event: NormalizedErrorReport,
  fingerprint: string,
  occurrenceAt: string,
  count: number
): string {
  // 中文注释：重复上报只补充新的出现时间和计数，不重复创建 issue。
  return [
    `Repeated error occurrence`,
    `Fingerprint: ${fingerprint}`,
    `Occurrence time: ${occurrenceAt}`,
    `Total occurrences: ${count}`,
    '',
    event.stack,
  ].join('\n');
}

function resolveDependencies(deps: ErrorReporterDependencies) {
  return {
    config: deps.config,
    github: deps.github ?? {
      createGitHubIssue,
      appendGitHubIssueComment,
    },
    stateStore: deps.stateStore ?? {
      readErrorReportState,
      writeErrorReportState,
    },
    clock: deps.clock ?? (() => new Date().toISOString()),
  };
}

export function createErrorReporter(deps: ErrorReporterDependencies = {}) {
  const resolved = resolveDependencies(deps);

  return {
    async report(error: unknown, context: ErrorReportContext): Promise<void> {
      // 中文注释：先读取配置，禁用时直接退出，避免产生任何外部副作用。
      const config = resolved.config ?? (await readErrorReportingConfig());
      if (!config.enabled) {
        return;
      }

      const state = await resolved.stateStore.readErrorReportState(config);
      const event = normalizeError(error, context);
      const fingerprint = buildErrorFingerprint(event);
      const now = resolved.clock();
      const existing = state.issues[fingerprint];

      if (!existing) {
        const created = await resolved.github.createGitHubIssue({
          repository: config.repository,
          title: formatIssueTitle(event),
          body: formatIssueBody(event, fingerprint, now, 1),
        });

        const nextState: ErrorReportState = upsertErrorReportStateEntry(state, {
          fingerprint,
          issueNumber: created.issueNumber,
          issueUrl: created.issueUrl,
          firstSeenAt: now,
          lastSeenAt: now,
          count: 1,
        });

        await resolved.stateStore.writeErrorReportState(nextState, config);
        return;
      }

      await resolved.github.appendGitHubIssueComment({
        repository: config.repository,
        issueNumber: existing.issueNumber,
        body: formatRepeatComment(event, fingerprint, now, existing.count + 1),
      });

      const nextState: ErrorReportState = upsertErrorReportStateEntry(state, {
        fingerprint,
        issueNumber: existing.issueNumber,
        issueUrl: existing.issueUrl,
        firstSeenAt: existing.firstSeenAt,
        lastSeenAt: now,
        count: 1,
      });

      await resolved.stateStore.writeErrorReportState(nextState, config);
    },
  };
}
