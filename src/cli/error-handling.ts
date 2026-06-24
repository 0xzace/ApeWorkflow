import {
  createErrorReporter,
  type ErrorReportContext,
  type ErrorReportSource,
} from '../core/error-reporting/index.js';

const sharedErrorReporter = createErrorReporter();
let errorReportingHooksInstalled = false;

function toReportContext(
  context: { commandPath: string; source?: ErrorReportSource }
): ErrorReportContext {
  return {
    commandPath: context.commandPath,
    source: context.source ?? 'command',
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function reportUserVisibleError(
  error: unknown,
  context: { commandPath: string; source?: ErrorReportSource }
): Promise<void> {
  try {
    // 中文注释：共享 reporter 失败时不影响原始命令输出和退出行为。
    await sharedErrorReporter.report(error, toReportContext(context));
  } catch {
    // 中文注释：上报失败直接吞掉，避免把用户可见错误变成二次失败。
  }
}

export async function handleCliFailure(
  error: unknown,
  context: { commandPath: string }
): Promise<void> {
  // 中文注释：CLI 顶层失败先走共享上报，再保留原有的失败输出和退出方式。
  await reportUserVisibleError(error, {
    commandPath: context.commandPath,
    source: context.commandPath === 'process' ? 'process' : 'command',
  });

  console.log();
  // 中文注释：这里要兼容 string / object 异常，不能只读取 Error.message。
  // 使用 console.error 而不是 ora().fail()，因为此时没有 spinner 在运行，
  // ora().fail() 会输出 spinner ANSI 字符，污染错误输出。
  console.error(`Error: ${getErrorMessage(error)}`);
  process.exit(1);
}

export function installErrorReportingHooks(): void {
  if (errorReportingHooksInstalled) {
    return;
  }

  errorReportingHooksInstalled = true;

  // 中文注释：进程级异常只注册一次，避免重复订阅导致重复上报。
  process.on('uncaughtException', (error) => {
    void handleCliFailure(error, { commandPath: 'process' });
  });

  // 中文注释：未处理的 Promise 拒绝也走同一条失败链路。
  process.on('unhandledRejection', (reason) => {
    void handleCliFailure(reason, { commandPath: 'process' });
  });
}
