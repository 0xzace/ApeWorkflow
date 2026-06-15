export type ErrorReportSource = 'command' | 'process';

export interface ErrorReportContext {
  commandPath: string;
  source: ErrorReportSource;
  workspaceRoot?: string;
  workspaceName?: string;
  contextStoreId?: string;
  changeId?: string;
}

export interface NormalizedErrorReport {
  name: string;
  message: string;
  stack: string;
  commandPath: string;
  source: ErrorReportSource;
  workspaceRoot?: string;
  workspaceName?: string;
  contextStoreId?: string;
  changeId?: string;
}

export interface ErrorReportingConfig {
  enabled: boolean;
  repository: string;
  statePath: string;
}

export interface ErrorReportStateEntry {
  issueNumber: number;
  issueUrl: string;
  firstSeenAt: string;
  lastSeenAt: string;
  count: number;
}

export interface ErrorReportState {
  version: 1;
  issues: Record<string, ErrorReportStateEntry>;
}
