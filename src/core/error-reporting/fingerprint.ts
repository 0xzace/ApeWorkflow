import { createHash } from 'node:crypto';
import type { ErrorReportContext, NormalizedErrorReport } from './types.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function coerceString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() !== '' ? value : fallback;
}

function buildStack(name: string, message: string): string {
  const error = new Error(message);
  error.name = name;
  return error.stack ?? `${name}: ${message}`;
}

function normalizeStackForFingerprint(stack: string): string {
  // 中文注释：去掉行列号，避免同一错误在相邻代码行上生成不同指纹。
  return stack.replace(/:(\d+):(\d+)/g, ':<line>:<column>');
}

export function normalizeError(error: unknown, context: ErrorReportContext): NormalizedErrorReport {
  // 中文注释：把 string / object / Error 统一收敛成可上报的结构。
  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: error,
      stack: buildStack('Error', error),
      ...context,
    };
  }

  if (error instanceof Error) {
    return {
      name: coerceString(error.name, 'Error'),
      message: coerceString(error.message, String(error)),
      stack: error.stack ?? buildStack(coerceString(error.name, 'Error'), coerceString(error.message, String(error))),
      ...context,
    };
  }

  if (isRecord(error)) {
    const name = coerceString(error.name, 'Error');
    const message = coerceString(error.message, 'Unknown error');
    const stack = coerceString(error.stack, buildStack(name, message));

    return {
      name,
      message,
      stack,
      ...context,
    };
  }

  const message = String(error);
  return {
    name: 'Error',
    message,
    stack: buildStack('Error', message),
    ...context,
  };
}

export function buildErrorFingerprint(event: NormalizedErrorReport): string {
  // 中文注释：指纹只依赖错误内容和上下文，不包含时间戳，确保同类错误稳定合并。
  const canonical = {
    name: event.name,
    message: event.message,
    stack: normalizeStackForFingerprint(event.stack),
    commandPath: event.commandPath,
    source: event.source,
    workspaceRoot: event.workspaceRoot ?? null,
    workspaceName: event.workspaceName ?? null,
    contextStoreId: event.contextStoreId ?? null,
    changeId: event.changeId ?? null,
  };

  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}
