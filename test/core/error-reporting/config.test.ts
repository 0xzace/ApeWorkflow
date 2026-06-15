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
    // 中文注释：每个测试都隔离到独立的临时配置目录，避免互相污染。
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
