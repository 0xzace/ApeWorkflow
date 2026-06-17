import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { getTaskProgressForChange } from '../../src/utils/task-progress.js';

describe('task-progress', () => {
  let tempDir: string;

  beforeEach(() => {
    // 中文注释：用临时工作区构造 change 目录，确保测试只覆盖计划文件读取逻辑。
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-task-progress-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('优先统计 plans/ 下的计划文件', async () => {
    const changesDir = path.join(tempDir, 'apeworkflow', 'changes');
    const changeDir = path.join(changesDir, 'demo-change');
    fs.mkdirSync(path.join(changeDir, 'plans'), { recursive: true });

    await fs.promises.writeFile(
      path.join(changeDir, 'plans', '2026-06-17-demo-change.md'),
      ['- [x] First task', '- [ ] Second task'].join('\n'),
      'utf-8'
    );

    const progress = await getTaskProgressForChange(changesDir, 'demo-change');

    expect(progress).toEqual({ total: 2, completed: 1 });
  });
});
