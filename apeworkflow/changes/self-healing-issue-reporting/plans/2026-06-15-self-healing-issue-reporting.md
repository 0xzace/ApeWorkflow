# 自动错误上报 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use apeworkflow-subagent-driven-development (recommended) or apeworkflow-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 当 ApeWorkflow 在用户实际使用中抛出可见错误时，自动生成指纹、按指纹去重，并立即向 ApeWorkflow 仓库创建或追加 GitHub issue。

**Architecture:** 新增一个独立的 `src/core/error-reporting/` 领域模块，负责错误标准化、指纹生成、本地去重状态、GitHub issue 交互和全局 hooks。CLI 顶层 catch、`workspace/context-store/initiative` 的 `handleFailure`、以及进程级异常入口都只负责把错误转发给这个模块，再保留现有的输出和退出行为。`feedback.ts` 会改成复用同一套 GitHub issue 客户端，保证“提交 issue”只有一份实现。

**Tech Stack:** TypeScript, Vitest, Node.js `fs`/`path`/`os`, existing `gh` CLI integration, Commander.

---

## File Structure

- Create `src/core/error-reporting/types.ts`: 统一定义错误上报配置、状态、标准化事件和 GitHub 客户端接口。
- Create `src/core/error-reporting/config.ts`: 读取和写入自动错误上报配置，默认启用，默认仓库为 ApeWorkflow 仓库，默认状态文件放在全局配置目录下。
- Create `src/core/error-reporting/fingerprint.ts`: 把 `unknown` 错误标准化为可上报事件，并生成稳定指纹。
- Create `src/core/error-reporting/state.ts`: 读取、写入、更新本地去重状态文件。
- Create `src/core/error-reporting/github.ts`: 封装 `gh issue create` 和 `gh issue comment`，供反馈和错误上报共用。
- Create `src/core/error-reporting/reporter.ts`: 串起配置、状态、指纹和 GitHub 客户端，负责“首次创建 issue / 重复错误追加 comment”。
- Create `src/core/error-reporting/index.ts`: 导出上面所有公开能力。
- Create `src/cli/error-handling.ts`: 封装 CLI 顶层 catch 的统一错误处理和进程级 hooks 安装。
- Modify `src/cli/index.ts`: 安装全局 error hooks，并把各命令 catch 改为走统一处理器。
- Modify `src/commands/workspace.ts`: 让 `handleFailure` 转发错误到上报器。
- Modify `src/commands/context-store.ts`: 让 `handleFailure` 转发错误到上报器。
- Modify `src/commands/initiative.ts`: 让 `handleFailure` 转发错误到上报器。
- Modify `src/commands/feedback.ts`: 改为复用共享 GitHub issue 客户端。
- Modify `src/core/index.ts`: 重新导出 error-reporting 公共 API。
- Create `test/core/error-reporting/config.test.ts`
- Create `test/core/error-reporting/fingerprint.test.ts`
- Create `test/core/error-reporting/state.test.ts`
- Create `test/core/error-reporting/github.test.ts`
- Create `test/core/error-reporting/reporter.test.ts`
- Create `test/cli/error-handling.test.ts`
- Create `test/commands/workspace.error-reporting.test.ts`
- Create `test/commands/context-store.error-reporting.test.ts`
- Create `test/commands/initiative.error-reporting.test.ts`
- Modify `test/commands/feedback.test.ts`

---

### Task 1: 建立错误上报核心数据层

**Files:**
- Create: `src/core/error-reporting/types.ts`
- Create: `src/core/error-reporting/config.ts`
- Create: `src/core/error-reporting/fingerprint.ts`
- Create: `src/core/error-reporting/state.ts`
- Test: `test/core/error-reporting/config.test.ts`
- Test: `test/core/error-reporting/fingerprint.test.ts`
- Test: `test/core/error-reporting/state.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// test/core/error-reporting/config.test.ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  getErrorReportingConfigPath,
  readErrorReportingConfig,
  updateErrorReportingConfig,
} from '../../../src/core/error-reporting/config.js';

describe('error-reporting/config', () => {
  let tempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-error-reporting-config-'));
    originalEnv = { ...process.env };
    process.env.XDG_CONFIG_HOME = path.join(tempDir, 'xdg-config');
    process.env.HOME = tempDir;
    process.env.USERPROFILE = tempDir;
    process.env.APPDATA = path.join(tempDir, 'appdata');
  });

  afterEach(() => {
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('defaults to enabled and stores state in the global config directory', async () => {
    const config = await readErrorReportingConfig();

    expect(config).toEqual({
      enabled: true,
      repository: '0xzace/ApeWorkflow',
      statePath: path.join(tempDir, 'xdg-config', 'apeworkflow', 'error-reporting-state.json'),
    });
    expect(getErrorReportingConfigPath()).toBe(
      path.join(tempDir, 'xdg-config', 'apeworkflow', 'error-reporting.json')
    );
  });

  it('updates only the requested fields', async () => {
    await updateErrorReportingConfig({ enabled: false });

    const config = await readErrorReportingConfig();
    expect(config.enabled).toBe(false);
    expect(config.repository).toBe('0xzace/ApeWorkflow');
  });
});
```

```ts
// test/core/error-reporting/fingerprint.test.ts
import { describe, expect, it } from 'vitest';
import { buildErrorFingerprint, normalizeError } from '../../../src/core/error-reporting/fingerprint.js';

describe('error-reporting/fingerprint', () => {
  it('normalizes string rejections into a structured event', () => {
    const event = normalizeError('workspace update failed', {
      commandPath: 'workspace:update',
      source: 'command',
      workspaceRoot: '/tmp/workspace',
    });

    expect(event.name).toBe('Error');
    expect(event.message).toBe('workspace update failed');
    expect(event.commandPath).toBe('workspace:update');
    expect(event.workspaceRoot).toBe('/tmp/workspace');
    expect(event.stack).toContain('workspace update failed');
  });

  it('returns the same fingerprint for the same error shape', () => {
    const first = buildErrorFingerprint(
      normalizeError(new Error('missing link path'), {
        commandPath: 'workspace:link',
        source: 'command',
        workspaceRoot: '/tmp/workspace',
      })
    );
    const second = buildErrorFingerprint(
      normalizeError(new Error('missing link path'), {
        commandPath: 'workspace:link',
        source: 'command',
        workspaceRoot: '/tmp/workspace',
      })
    );

    expect(first).toBe(second);
  });
});
```

```ts
// test/core/error-reporting/state.test.ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  readErrorReportState,
  writeErrorReportState,
  upsertErrorReportStateEntry,
} from '../../../src/core/error-reporting/state.js';

describe('error-reporting/state', () => {
  let tempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-error-reporting-state-'));
    originalEnv = { ...process.env };
    process.env.XDG_CONFIG_HOME = path.join(tempDir, 'xdg-config');
    process.env.HOME = tempDir;
    process.env.USERPROFILE = tempDir;
    process.env.APPDATA = path.join(tempDir, 'appdata');
  });

  afterEach(() => {
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('starts with an empty state', async () => {
    await expect(readErrorReportState()).resolves.toEqual({ version: 1, issues: {} });
  });

  it('writes and merges issue entries by fingerprint', async () => {
    const state = upsertErrorReportStateEntry(
      { version: 1, issues: {} },
      {
        fingerprint: 'fp-123',
        issueNumber: 7,
        issueUrl: 'https://github.com/0xzace/ApeWorkflow/issues/7',
        firstSeenAt: '2026-06-15T00:00:00.000Z',
        lastSeenAt: '2026-06-15T00:00:00.000Z',
        count: 1,
      }
    );

    await writeErrorReportState(state);

    await expect(readErrorReportState()).resolves.toEqual(state);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm test -- \
  test/core/error-reporting/config.test.ts \
  test/core/error-reporting/fingerprint.test.ts \
  test/core/error-reporting/state.test.ts
```

Expected: FAIL because `src/core/error-reporting/*` does not exist yet.

- [ ] **Step 3: Implement the minimal core modules**

```ts
// src/core/error-reporting/types.ts
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
```

```ts
// src/core/error-reporting/config.ts
export const DEFAULT_ERROR_REPORTING_REPOSITORY = '0xzace/ApeWorkflow';
export const DEFAULT_ERROR_REPORTING_STATE_FILE_NAME = 'error-reporting-state.json';
export const DEFAULT_ERROR_REPORTING_CONFIG_FILE_NAME = 'error-reporting.json';

export function getErrorReportingConfigPath(): string {
  // 中文注释：错误上报配置和 telemetry 一样放在全局配置目录里，方便跨命令共享。
  return join(getGlobalConfigDir(), DEFAULT_ERROR_REPORTING_CONFIG_FILE_NAME);
}

export async function readErrorReportingConfig(): Promise<ErrorReportingConfig> {
  // 中文注释：缺省开启，并把去重状态文件固定放到全局配置目录。
}

export async function updateErrorReportingConfig(
  updates: Partial<ErrorReportingConfig>
): Promise<ErrorReportingConfig> {
  // 中文注释：只覆盖调用方传入的字段，其他字段保持现状。
}
```

```ts
// src/core/error-reporting/fingerprint.ts
export function normalizeError(error: unknown, context: ErrorReportContext): NormalizedErrorReport {
  // 中文注释：把 string / object / Error 统一收敛成可上报的结构。
}

export function buildErrorFingerprint(event: NormalizedErrorReport): string {
  // 中文注释：不要把时间戳放进指纹，保证同类错误稳定合并。
}
```

```ts
// src/core/error-reporting/state.ts
export function getErrorReportStatePath(config: ErrorReportingConfig): string {
  return config.statePath;
}

export async function readErrorReportState(config?: ErrorReportingConfig): Promise<ErrorReportState> {
  // 中文注释：文件不存在时返回空状态，避免首次运行报错。
}

export async function writeErrorReportState(
  state: ErrorReportState,
  config?: ErrorReportingConfig
): Promise<void> {
  // 中文注释：每次写回完整状态，保持实现简单且可测试。
}

export function upsertErrorReportStateEntry(
  state: ErrorReportState,
  entry: { fingerprint: string } & ErrorReportStateEntry
): ErrorReportState {
  // 中文注释：同一指纹只保留一个聚合入口，后续只更新计数和时间。
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm test -- \
  test/core/error-reporting/config.test.ts \
  test/core/error-reporting/fingerprint.test.ts \
  test/core/error-reporting/state.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/error-reporting/types.ts src/core/error-reporting/config.ts src/core/error-reporting/fingerprint.ts src/core/error-reporting/state.ts test/core/error-reporting/config.test.ts test/core/error-reporting/fingerprint.test.ts test/core/error-reporting/state.test.ts
git commit -m "feat: add error reporting core state"
```

---

### Task 2: 提取共享 GitHub issue 客户端并让 reporter 可复用

**Files:**
- Create: `src/core/error-reporting/github.ts`
- Create: `src/core/error-reporting/reporter.ts`
- Create: `src/core/error-reporting/index.ts`
- Modify: `src/commands/feedback.ts`
- Modify: `src/core/index.ts`
- Test: `test/core/error-reporting/github.test.ts`
- Test: `test/core/error-reporting/reporter.test.ts`
- Modify: `test/commands/feedback.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// test/core/error-reporting/github.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync, execSync } from 'node:child_process';
import { appendGitHubIssueComment, createGitHubIssue } from '../../../src/core/error-reporting/github.js';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
  execFileSync: vi.fn(),
}));

describe('error-reporting/github', () => {
  const mockExecSync = execSync as unknown as ReturnType<typeof vi.fn>;
  const mockExecFileSync = execFileSync as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd === 'which gh' || cmd === 'where gh') return Buffer.from('/usr/local/bin/gh');
      if (cmd === 'gh auth status') return Buffer.from('Logged in');
      return Buffer.from('');
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a GitHub issue with gh issue create', async () => {
    mockExecFileSync.mockReturnValue('https://github.com/0xzace/ApeWorkflow/issues/42\n');

    await expect(
      createGitHubIssue({
        repository: '0xzace/ApeWorkflow',
        title: 'Error: workspace link failed',
        body: 'body text',
        labels: ['bug'],
      })
    ).resolves.toEqual({
      issueNumber: 42,
      issueUrl: 'https://github.com/0xzace/ApeWorkflow/issues/42',
    });

    expect(mockExecFileSync).toHaveBeenCalledWith(
      'gh',
      [
        'issue',
        'create',
        '--repo',
        '0xzace/ApeWorkflow',
        '--title',
        'Error: workspace link failed',
        '--body',
        'body text',
        '--label',
        'bug',
      ],
      expect.objectContaining({ encoding: 'utf-8', stdio: 'pipe' })
    );
  });

  it('adds a comment to an existing issue', async () => {
    mockExecFileSync.mockReturnValue('');

    await appendGitHubIssueComment({
      repository: '0xzace/ApeWorkflow',
      issueNumber: 42,
      body: 'second occurrence',
    });

    expect(mockExecFileSync).toHaveBeenCalledWith(
      'gh',
      [
        'issue',
        'comment',
        '42',
        '--repo',
        '0xzace/ApeWorkflow',
        '--body',
        'second occurrence',
      ],
      expect.objectContaining({ encoding: 'utf-8', stdio: 'pipe' })
    );
  });
});
```

```ts
// test/core/error-reporting/reporter.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createErrorReporter } from '../../../src/core/error-reporting/reporter.js';

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
    stateStore.readErrorReportState.mockResolvedValue({
      version: 1,
      issues: {
        'error-fp': {
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
```

```ts
// test/commands/feedback.test.ts
it('still submits feedback through the shared GitHub issue client', async () => {
  mockExecSync.mockImplementation((cmd: string) => {
    if (cmd === 'which gh' || cmd === 'where gh') return Buffer.from('/usr/local/bin/gh');
    if (cmd === 'gh auth status') return Buffer.from('Logged in');
    return Buffer.from('');
  });
  mockExecFileSync.mockReturnValue('https://github.com/0xzace/ApeWorkflow/issues/123\n');

  await feedbackCommand.execute('Great tool!');

  expect(mockExecFileSync).toHaveBeenCalledWith(
    'gh',
    expect.arrayContaining(['issue', 'create', '--repo', '0xzace/ApeWorkflow']),
    expect.any(Object)
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm test -- \
  test/core/error-reporting/github.test.ts \
  test/core/error-reporting/reporter.test.ts \
  test/commands/feedback.test.ts
```

Expected: FAIL because the shared GitHub client and reporter do not exist yet.

- [ ] **Step 3: Implement the shared GitHub client and reporter**

```ts
// src/core/error-reporting/github.ts
export async function createGitHubIssue(params: {
  repository: string;
  title: string;
  body: string;
  labels?: string[];
}): Promise<{ issueNumber: number; issueUrl: string }> {
  // 中文注释：使用 gh issue create 直接创建 issue，返回 issue 编号和 URL。
}

export async function appendGitHubIssueComment(params: {
  repository: string;
  issueNumber: number;
  body: string;
}): Promise<void> {
  // 中文注释：重复错误只追加 comment，不再重复开新 issue。
}
```

```ts
// src/core/error-reporting/reporter.ts
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

export function createErrorReporter(deps: ErrorReporterDependencies = {}): {
  report(error: unknown, context: ErrorReportContext): Promise<void>;
} {
  // 中文注释：先标准化错误，再生成指纹，再决定创建 issue 还是追加 comment。
}
```

```ts
// src/core/error-reporting/index.ts
export * from './types.js';
export * from './config.js';
export * from './fingerprint.js';
export * from './state.js';
export * from './github.js';
export * from './reporter.js';
```

```ts
// src/commands/feedback.ts
import {
  createGitHubIssue,
  isGitHubCliAvailable,
  isGitHubCliAuthenticated,
} from '../core/error-reporting/github.js';

// 中文注释：反馈提交继续保留原行为，但真正发 issue 的逻辑改为共享客户端。
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm test -- \
  test/core/error-reporting/github.test.ts \
  test/core/error-reporting/reporter.test.ts \
  test/commands/feedback.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/error-reporting/github.ts src/core/error-reporting/reporter.ts src/core/error-reporting/index.ts src/commands/feedback.ts src/core/index.ts test/core/error-reporting/github.test.ts test/core/error-reporting/reporter.test.ts test/commands/feedback.test.ts
git commit -m "feat: add shared error reporting issue client"
```

---

### Task 3: 把错误上报接到 CLI、命令失败路径和进程级 hooks

**Files:**
- Create: `src/cli/error-handling.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/commands/workspace.ts`
- Modify: `src/commands/context-store.ts`
- Modify: `src/commands/initiative.ts`
- Modify: `src/core/index.ts`
- Test: `test/cli/error-handling.test.ts`
- Test: `test/commands/workspace.error-reporting.test.ts`
- Test: `test/commands/context-store.error-reporting.test.ts`
- Test: `test/commands/initiative.error-reporting.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// test/cli/error-handling.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleCliFailure, installErrorReportingHooks } from '../../src/cli/error-handling.js';
import { reportUserVisibleError } from '../../src/core/error-reporting/index.js';

vi.mock('../../src/core/error-reporting/index.js', () => ({
  reportUserVisibleError: vi.fn().mockResolvedValue(undefined),
  createErrorReporter: vi.fn(),
}));

describe('cli/error-handling', () => {
  const mockReport = reportUserVisibleError as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports the failure before exiting', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
      throw new Error(`process.exit(${code})`);
    });

    await expect(
      handleCliFailure(new Error('boom'), {
        commandPath: 'workspace:update',
      })
    ).rejects.toThrow('process.exit(1)');

    expect(mockReport).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        commandPath: 'workspace:update',
        source: 'command',
      })
    );
    exitSpy.mockRestore();
  });

  it('registers uncaughtException and unhandledRejection hooks', () => {
    const onSpy = vi.spyOn(process, 'on');

    installErrorReportingHooks();

    expect(onSpy).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
    expect(onSpy).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
  });
});
```

```ts
// test/commands/workspace.error-reporting.test.ts
import { Command } from 'commander';
import { describe, expect, it, vi } from 'vitest';
import { registerWorkspaceCommand } from '../../src/commands/workspace.js';
import { reportUserVisibleError } from '../../src/core/error-reporting/index.js';

vi.mock('../../src/core/error-reporting/index.js', () => ({
  reportUserVisibleError: vi.fn().mockResolvedValue(undefined),
  createErrorReporter: vi.fn(),
}));

describe('workspace error reporting wiring', () => {
  it('reports workspace validation failures through the shared reporter', async () => {
    const program = new Command();
    program.exitOverride();
    registerWorkspaceCommand(program);

    await program.parseAsync(['node', 'apeworkflow', 'workspace', 'doctor', '--json'], {
      from: 'user',
    });

    expect(reportUserVisibleError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        commandPath: 'workspace:link',
        source: 'command',
      })
    );
  });
});
```

```ts
// test/commands/context-store.error-reporting.test.ts
import { Command } from 'commander';
import { describe, expect, it, vi } from 'vitest';
import { registerContextStoreCommand } from '../../src/commands/context-store.js';
import { reportUserVisibleError } from '../../src/core/error-reporting/index.js';

vi.mock('../../src/core/error-reporting/index.js', () => ({
  reportUserVisibleError: vi.fn().mockResolvedValue(undefined),
  createErrorReporter: vi.fn(),
}));

describe('context-store error reporting wiring', () => {
  it('reports context-store validation failures through the shared reporter', async () => {
    const program = new Command();
    program.exitOverride();
    registerContextStoreCommand(program);

    await program.parseAsync(['node', 'apeworkflow', 'context-store', 'setup', '--json'], { from: 'user' });

    expect(reportUserVisibleError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        commandPath: 'context-store:setup',
        source: 'command',
      })
    );
  });
});
```

```ts
// test/commands/initiative.error-reporting.test.ts
import { Command } from 'commander';
import { describe, expect, it, vi } from 'vitest';
import { registerInitiativeCommand } from '../../src/commands/initiative.js';
import { reportUserVisibleError } from '../../src/core/error-reporting/index.js';

vi.mock('../../src/core/error-reporting/index.js', () => ({
  reportUserVisibleError: vi.fn().mockResolvedValue(undefined),
  createErrorReporter: vi.fn(),
}));

describe('initiative error reporting wiring', () => {
  it('reports initiative validation failures through the shared reporter', async () => {
    const program = new Command();
    program.exitOverride();
    registerInitiativeCommand(program);

    await program.parseAsync(['node', 'apeworkflow', 'initiative', 'create', '--title', 'Demo'], {
      from: 'user',
    });

    expect(reportUserVisibleError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        commandPath: 'initiative:create',
        source: 'command',
      })
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm test -- \
  test/cli/error-handling.test.ts \
  test/commands/workspace.error-reporting.test.ts \
  test/commands/context-store.error-reporting.test.ts \
  test/commands/initiative.error-reporting.test.ts
```

Expected: FAIL because the CLI error bridge and command wiring do not exist yet.

- [ ] **Step 3: Wire the reporter into the CLI and the command handlers**

```ts
// src/cli/error-handling.ts
export async function handleCliFailure(
  error: unknown,
  context: { commandPath: string }
): Promise<void> {
  // 中文注释：先上报，再保留原有的 CLI 失败输出与退出行为。
}

export function installErrorReportingHooks(): void {
  // 中文注释：进程级异常只需要安装一次，避免重复订阅。
}
```

```ts
// src/cli/index.ts
import { handleCliFailure, installErrorReportingHooks } from './error-handling.js';

// 中文注释：在 telemetry hooks 旁边安装错误 hooks，保证 CLI 启动后立即生效。
installErrorReportingHooks();

// 中文注释：每个 catch 统一改为 await handleCliFailure(...)，不要再散落重复逻辑。
```

```ts
// src/commands/workspace.ts
private async handleFailure<T extends { status: WorkspaceStatus[] }>(
  commandPath: string,
  json: boolean | undefined,
  payload: T,
  error: unknown
): Promise<void> {
  // 中文注释：先把错误交给共享 reporter，再保留原来的 JSON/文本输出。
}
```

```ts
// src/commands/context-store.ts
private async handleFailure<T extends { status: ContextStoreDiagnostic[] }>(
  commandPath: string,
  json: boolean | undefined,
  payload: T,
  error: unknown
): Promise<void> {
  // 中文注释：命令输出不变，只补上共享上报。
}
```

```ts
// src/commands/initiative.ts
private async handleFailure<T extends { status: InitiativeDiagnostic[] }>(
  commandPath: string,
  json: boolean | undefined,
  payload: T,
  error: unknown
): Promise<void> {
  // 中文注释：让 initiative 的异常也走同一条上报链。
}
```

```ts
// src/core/index.ts
export * from './error-reporting/index.js';
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm test -- \
  test/cli/error-handling.test.ts \
  test/commands/workspace.error-reporting.test.ts \
  test/commands/context-store.error-reporting.test.ts \
  test/commands/initiative.error-reporting.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cli/error-handling.ts src/cli/index.ts src/commands/workspace.ts src/commands/context-store.ts src/commands/initiative.ts src/core/index.ts test/cli/error-handling.test.ts test/commands/workspace.error-reporting.test.ts test/commands/context-store.error-reporting.test.ts test/commands/initiative.error-reporting.test.ts
git commit -m "feat: wire automatic error reporting"
```

---

### Scope Check

- 这个计划覆盖了 spec 的全部范围：错误标准化、指纹生成、本地去重、GitHub issue 创建/追加、默认启用、全局配置目录存储、CLI 顶层错误入口、以及命令级 `handleFailure`。
- 没有新增自动修复逻辑，也没有把错误上报扩展到静默日志。
- 这个改动可以作为单一实施计划推进，不需要再拆成更小的子规格。

### Self-Review

**1. Spec coverage**

- 自动发现并上报可见错误：Task 3
- 默认启用：Task 1
- 错误指纹去重：Task 1 + Task 2
- 首次创建 issue、重复时追加 comment：Task 2
- 目标仓库固定为 ApeWorkflow：Task 1 + Task 2
- 全局 CLI hooks 和命令级错误入口：Task 3
- 复用现有 GitHub issue 提交能力：Task 2

**2. Placeholder scan**

- 已检查整份计划，没有保留 `TBD`、`TODO`、`implement later` 或空泛的“写测试”描述。

**3. Type consistency**

- `ErrorReportingConfig`、`ErrorReportState`、`ErrorReportContext`、`NormalizedErrorReport` 在各任务中保持一致。
- `createGitHubIssue` / `appendGitHubIssueComment` 只在共享客户端里定义。
- `handleCliFailure` 和各命令的 `handleFailure` 都明确传入 `commandPath`，避免后续实现时命名漂移。
