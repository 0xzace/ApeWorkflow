import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync, execSync } from 'node:child_process';
import {
  appendGitHubIssueComment,
  createGitHubIssue,
} from '../../../src/core/error-reporting/github.js';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
  execFileSync: vi.fn(),
}));

// 中文注释：验证共享 GitHub 客户端的创建 issue 和追加 comment 两条主路径。
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
