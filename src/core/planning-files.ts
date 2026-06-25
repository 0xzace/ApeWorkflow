import * as fs from 'node:fs';
import * as path from 'node:path';
import { resolveArtifactOutputs } from './artifact-graph/outputs.js';
import { FileSystemUtils } from '../utils/file-system.js';

export interface ChecklistItem {
  description: string;
  done: boolean;
  type?: string;
}

/**
 * 中文注释：只返回 plans/ 目录里的真实计划文件，不做旧格式回退。
 */
export function resolvePlanFiles(changeDir: string): string[] {
  const plansDir = path.join(changeDir, 'plans');

  if (!fs.existsSync(plansDir) || !fs.statSync(plansDir).isDirectory()) {
    return [];
  }

  return fs
    .readdirSync(plansDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map((entry) => FileSystemUtils.canonicalizeExistingPath(path.join(plansDir, entry.name)))
    .sort();
}

/**
 * 中文注释：apply 阶段只读取 schema 指定的 plans 计划文件，不再回退到 tasks.md。
 */
export function resolvePlanningTrackingFiles(changeDir: string, tracksFile: string | null | undefined): string[] {
  if (!tracksFile) {
    return [];
  }

  return resolveArtifactOutputs(changeDir, tracksFile);
}

export function parseChecklistItems(content: string): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const checkboxMatch = line.match(/^[-*]\s*\[([ xX])\]\s*(.+)\s*$/);
    if (!checkboxMatch) {
      continue;
    }

    const description = checkboxMatch[2].trim();
    // Extract optional type prefix: "Type: feature — actual description"
    let type: string | undefined;
    let cleanDescription = description;
    const typePrefixMatch = description.match(/^Type:\s*(\w+)\s*[—-]\s*(.+)$/);
    if (typePrefixMatch) {
      type = typePrefixMatch[1].toLowerCase();
      cleanDescription = typePrefixMatch[2].trim();
    }

    items.push({
      done: checkboxMatch[1].toLowerCase() === 'x',
      description: cleanDescription,
      type,
    });
  }

  return items;
}
