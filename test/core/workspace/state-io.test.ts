import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  getWorkspaceMetadataDir,
  getWorkspaceViewStatePath,
  parseWorkspaceViewState,
} from '../../../src/core/workspace/index.js';
import {
  readOptionalWorkspaceViewState,
  readWorkspaceViewStateSync,
  workspaceStateFileExistsSync,
  writeWorkspaceViewState,
} from '../../../src/core/workspace/state-io.js';

describe('workspace state io', () => {
  let tempDir: string;

  beforeEach(() => {
    // 中文注释：这里单独验证 workspace state 文件的读写与存在判断。
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-workspace-state-io-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('会在写入 view state 后正确识别和读取 workspace 状态', async () => {
    const workspaceRoot = path.join(tempDir, 'platform');
    await writeWorkspaceViewState(workspaceRoot, {
      version: 1,
      name: 'platform',
      context: null,
      links: {
        api: path.join(tempDir, 'repos', 'api'),
      },
    });

    expect(workspaceStateFileExistsSync(workspaceRoot)).toBe(true);
    expect(readWorkspaceViewStateSync(workspaceRoot)).toEqual(
      parseWorkspaceViewState(
        fs.readFileSync(getWorkspaceViewStatePath(workspaceRoot), 'utf-8')
      )
    );
    await expect(readOptionalWorkspaceViewState(workspaceRoot)).resolves.toEqual(
      expect.objectContaining({
        name: 'platform',
      })
    );
    expect(fs.existsSync(getWorkspaceMetadataDir(workspaceRoot))).toBe(true);
  });

  it('会在 workspace 状态缺失时返回 null', async () => {
    const workspaceRoot = path.join(tempDir, 'missing');

    expect(workspaceStateFileExistsSync(workspaceRoot)).toBe(false);
    await expect(readOptionalWorkspaceViewState(workspaceRoot)).resolves.toBeNull();
    expect(readWorkspaceViewStateSync(workspaceRoot)).toBeNull();
  });
});
