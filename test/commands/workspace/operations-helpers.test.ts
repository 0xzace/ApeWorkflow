import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  directoryExists,
  inferLinkName,
  normalizeExistingPathForStorage,
  validateWorkspaceNameForSetup,
  validateLinkNameForCommand,
} from '../../../src/commands/workspace/operations.js';
import { WorkspaceCliError } from '../../../src/commands/workspace/types.js';

// ---------------------------------------------------------------------------
// directoryExists
// ---------------------------------------------------------------------------

describe('directoryExists', () => {
  it('现有目录返回 true', async () => {
    const dirPath = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-directory-exists-'));
    try {
      expect(await directoryExists(dirPath)).toBe(true);
    } finally {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  });

  it('不存在的目录返回 false', async () => {
    expect(await directoryExists('/nonexistent-dir-12345')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// inferLinkName
// ---------------------------------------------------------------------------

describe('inferLinkName', () => {
  it('从绝对路径推断链接名', () => {
    expect(inferLinkName('/home/user/my-repo')).toBe('my-repo');
  });

  it('处理深层路径', () => {
    expect(inferLinkName('/a/b/c/d/my-project')).toBe('my-project');
  });

  it('处理单级路径', () => {
    expect(inferLinkName('/my-repo')).toBe('my-repo');
  });
});

// ---------------------------------------------------------------------------
// normalizeExistingPathForStorage
// ---------------------------------------------------------------------------

describe('normalizeExistingPathForStorage', () => {
  it('返回现有路径的规范化结果', () => {
    const existingPath = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-normalize-path-'));
    try {
      const result = normalizeExistingPathForStorage(existingPath);
      expect(result).toBe(fs.realpathSync.native(existingPath));
    } finally {
      fs.rmSync(existingPath, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// validateWorkspaceNameForSetup
// ---------------------------------------------------------------------------

describe('validateWorkspaceNameForSetup', () => {
  it('kebab-case 名称通过', () => {
    expect(validateWorkspaceNameForSetup('my-workspace')).toBe('my-workspace');
    expect(validateWorkspaceNameForSetup('workspace-1')).toBe('workspace-1');
    expect(validateWorkspaceNameForSetup('a')).toBe('a');
  });

  it('大写字母抛出错误', () => {
    expect(() => validateWorkspaceNameForSetup('MyWorkspace'))
      .toThrow();
  });

  it('以下划线分隔抛出错误', () => {
    expect(() => validateWorkspaceNameForSetup('my_workspace'))
      .toThrow();
  });

  it('以连字符开头抛出错误', () => {
    expect(() => validateWorkspaceNameForSetup('-bad'))
      .toThrow();
  });

  it('以连字符结尾抛出错误', () => {
    expect(() => validateWorkspaceNameForSetup('bad-'))
      .toThrow();
  });

  it('包含连续连字符抛出错误', () => {
    expect(() => validateWorkspaceNameForSetup('bad--name'))
      .toThrow();
  });
});

// ---------------------------------------------------------------------------
// validateLinkNameForCommand
// ---------------------------------------------------------------------------

describe('validateLinkNameForCommand', () => {
  it('有效链接名通过', () => {
    expect(validateLinkNameForCommand('my-link')).toBe('my-link');
  });

  it('包含路径分隔符的链接名抛出 WorkspaceCliError', () => {
    expect(() => validateLinkNameForCommand('my/link'))
      .toThrow(WorkspaceCliError);
  });
});

// ---------------------------------------------------------------------------
// makeStatus
// ---------------------------------------------------------------------------

import { makeStatus } from '../../../src/commands/workspace/types.js';

describe('makeStatus', () => {
  it('创建错误状态', () => {
    const s = makeStatus('error', 'test_code', 'test message', {
      target: 'workspace.name',
      fix: 'apeworkflow workspace setup',
    });
    expect(s).toEqual({
      severity: 'error',
      code: 'test_code',
      message: 'test message',
      target: 'workspace.name',
      fix: 'apeworkflow workspace setup',
    });
  });

  it('创建警告状态', () => {
    const s = makeStatus('warning', 'drift', 'Skills out of sync');
    expect(s.severity).toBe('warning');
    expect(s.code).toBe('drift');
    expect(s.message).toBe('Skills out of sync');
  });

  it('不包含可选字段时返回空对象', () => {
    const s = makeStatus('error', 'code', 'msg');
    expect(s.target).toBeUndefined();
    expect(s.fix).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// sameContextStoreBinding (via context-store module)
// ---------------------------------------------------------------------------

import { sameContextStoreBinding } from '../../../src/core/context-store/index.js';

describe('sameContextStoreBinding', () => {
  it('相同选择器返回 true', () => {
    const left = { id: 'teams', selector: { kind: 'path', path: '/tmp/store' } };
    const right = { id: 'teams', selector: { kind: 'path', path: '/tmp/store' } };
    expect(sameContextStoreBinding(left, right)).toBe(true);
  });

  it('不同选择器返回 false', () => {
    const left = { id: 'teams', selector: { kind: 'path', path: '/tmp/store-a' } };
    const right = { id: 'teams', selector: { kind: 'path', path: '/tmp/store-b' } };
    expect(sameContextStoreBinding(left, right)).toBe(false);
  });
});
