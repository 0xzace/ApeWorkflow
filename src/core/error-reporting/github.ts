import { execFileSync, execSync } from 'node:child_process';

function getGhExecutableCommand(): string {
  // 中文注释：按平台选择可用的 gh 查找命令，保持和现有反馈命令一致。
  return process.platform === 'win32' ? 'where gh' : 'which gh';
}

function runGhCommand(args: string[]): string {
  // 中文注释：通过 execFileSync 直接传参，避免 shell 转义问题。
  return execFileSync('gh', args, { encoding: 'utf-8', stdio: 'pipe' }).trim();
}

export function isGitHubCliAvailable(): boolean {
  try {
    execSync(getGhExecutableCommand(), { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function isGitHubCliAuthenticated(): boolean {
  try {
    execSync('gh auth status', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export async function createGitHubIssue(params: {
  repository: string;
  title: string;
  body: string;
  labels?: string[];
}): Promise<{ issueNumber: number; issueUrl: string }> {
  // 中文注释：创建 issue 后直接解析 gh 返回的 issue URL。
  const args = [
    'issue',
    'create',
    '--repo',
    params.repository,
    '--title',
    params.title,
    '--body',
    params.body,
  ];

  for (const label of params.labels ?? []) {
    args.push('--label', label);
  }

  const issueUrl = runGhCommand(args);
  const match = issueUrl.match(/\/issues\/(\d+)(?:\/)?$/);

  if (!match) {
    throw new Error(`Unable to parse GitHub issue number from URL: ${issueUrl}`);
  }

  return {
    issueNumber: Number(match[1]),
    issueUrl,
  };
}

export async function appendGitHubIssueComment(params: {
  repository: string;
  issueNumber: number;
  body: string;
}): Promise<void> {
  // 中文注释：重复错误只追加 comment，不再重复新建 issue。
  runGhCommand([
    'issue',
    'comment',
    String(params.issueNumber),
    '--repo',
    params.repository,
    '--body',
    params.body,
  ]);
}
