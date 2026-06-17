import { promises as fs } from 'fs';
import path from 'path';
import { parseChecklistItems, resolvePlanFiles } from '../core/planning-files.js';

const TASK_PATTERN = /^[-*]\s+\[[\sx]\]/i;
const COMPLETED_TASK_PATTERN = /^[-*]\s+\[x\]/i;

export interface TaskProgress {
  total: number;
  completed: number;
}

export function countTasksFromContent(content: string): TaskProgress {
  const lines = content.split('\n');
  let total = 0;
  let completed = 0;
  for (const line of lines) {
    if (line.match(TASK_PATTERN)) {
      total++;
      if (line.match(COMPLETED_TASK_PATTERN)) {
        completed++;
      }
    }
  }
  return { total, completed };
}

export async function getTaskProgressForChange(changesDir: string, changeName: string): Promise<TaskProgress> {
  const changeDir = path.join(changesDir, changeName);
  const planningFiles = resolvePlanFiles(changeDir);

  if (planningFiles.length === 0) {
    return { total: 0, completed: 0 };
  }

  let total = 0;
  let completed = 0;

  for (const filePath of planningFiles) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const items = parseChecklistItems(content);
      total += items.length;
      completed += items.filter((item) => item.done).length;
    } catch {
      // 中文注释：单个计划文件读取失败时继续统计其余文件，避免整条进度中断。
    }
  }

  return { total, completed };
}

export function formatTaskStatus(progress: TaskProgress): string {
  if (progress.total === 0) return 'No tasks';
  if (progress.completed === progress.total) return '✓ Complete';
  return `${progress.completed}/${progress.total} tasks`;
}
