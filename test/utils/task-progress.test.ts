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

  it('忽略 Task 标题，只统计 checkbox 行', async () => {
    // 中文注释：这个回归覆盖 plans/*.md 的分层格式，Task 标题不应被当作完成项。
    const changesDir = path.join(tempDir, 'apeworkflow', 'changes');
    const changeDir = path.join(changesDir, 'mixed-format-change');
    fs.mkdirSync(path.join(changeDir, 'plans'), { recursive: true });

    await fs.promises.writeFile(
      path.join(changeDir, 'plans', '2026-06-17-mixed-format.md'),
      [
        '### Task 3:',
        // 中文注释：这里直接使用统一后的 plans 格式，验证 Task 标题不会影响 checkbox 统计。
        '- [x] Step 1: Finish the first step',
        '- [ ] Step 2: Finish the second step',
      ].join('\n'),
      'utf-8'
    );

    const progress = await getTaskProgressForChange(changesDir, 'mixed-format-change');

    expect(progress).toEqual({ total: 2, completed: 1 });
  });
});
