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
    // 中文注释：状态文件写入全局配置目录下，因此这里模拟用户主目录环境。
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
