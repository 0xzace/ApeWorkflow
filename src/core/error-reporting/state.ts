import * as fs from 'node:fs/promises';
import path from 'node:path';
import { readErrorReportingConfig } from './config.js';
import type { ErrorReportState, ErrorReportStateEntry, ErrorReportingConfig } from './types.js';

export function getErrorReportStatePath(config: ErrorReportingConfig): string {
  return config.statePath;
}

function createEmptyState(): ErrorReportState {
  return { version: 1, issues: {} };
}

async function readStateFile(statePath: string): Promise<ErrorReportState | null> {
  try {
    const content = await fs.readFile(statePath, 'utf-8');
    const parsed = JSON.parse(content) as ErrorReportState;

    if (parsed?.version !== 1 || typeof parsed.issues !== 'object' || parsed.issues === null) {
      return null;
    }

    return {
      version: 1,
      issues: parsed.issues,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }

    return null;
  }
}

async function writeStateFile(statePath: string, state: ErrorReportState): Promise<void> {
  // 中文注释：每次都整文件写回，避免局部更新带来的状态分裂。
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf-8');
}

export async function readErrorReportState(config?: ErrorReportingConfig): Promise<ErrorReportState> {
  // 中文注释：文件不存在时返回空状态，避免首次运行报错。
  const resolvedConfig = config ?? (await readErrorReportingConfig());
  const statePath = getErrorReportStatePath(resolvedConfig);
  const state = await readStateFile(statePath);

  return state ?? createEmptyState();
}

export async function writeErrorReportState(
  state: ErrorReportState,
  config?: ErrorReportingConfig
): Promise<void> {
  // 中文注释：写回完整状态并沿用配置里的状态文件路径。
  const resolvedConfig = config ?? (await readErrorReportingConfig());
  await writeStateFile(getErrorReportStatePath(resolvedConfig), state);
}

export function upsertErrorReportStateEntry(
  state: ErrorReportState,
  entry: { fingerprint: string } & ErrorReportStateEntry
): ErrorReportState {
  // 中文注释：同一指纹只保留一个聚合入口，后续只更新计数和时间。
  const existing = state.issues[entry.fingerprint];

  if (!existing) {
    return {
      ...state,
      issues: {
        ...state.issues,
        [entry.fingerprint]: entry,
      },
    };
  }

  return {
    ...state,
    issues: {
      ...state.issues,
      [entry.fingerprint]: {
        issueNumber: existing.issueNumber,
        issueUrl: existing.issueUrl,
        firstSeenAt: existing.firstSeenAt,
        lastSeenAt: entry.lastSeenAt,
        count: existing.count + entry.count,
      },
    },
  };
}
