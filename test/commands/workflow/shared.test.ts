import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  DEFAULT_SCHEMA,
  getAvailableChanges,
  getStatusColor,
  getStatusIndicator,
  validateChangeExists,
  validateSchemaExists,
} from '../../../src/commands/workflow/shared.js';

describe('workflow shared helpers', () => {
  let tempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // 中文注释：每个用例都使用独立临时目录，避免污染真实仓库状态。
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-workflow-shared-'));
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('过滤 change 目录并忽略 archive 和隐藏目录', async () => {
    const changesDir = path.join(tempDir, 'apeworkflow', 'changes');
    fs.mkdirSync(path.join(changesDir, 'alpha'), { recursive: true });
    fs.mkdirSync(path.join(changesDir, 'archive'), { recursive: true });
    fs.mkdirSync(path.join(changesDir, '.hidden'), { recursive: true });
    fs.writeFileSync(path.join(changesDir, 'note.txt'), 'ignore me');

    await expect(getAvailableChanges(tempDir, changesDir)).resolves.toEqual(['alpha']);
  });

  it('校验 change 存在性并返回可读错误', async () => {
    const changesDir = path.join(tempDir, 'apeworkflow', 'changes');
    fs.mkdirSync(path.join(changesDir, 'beta'), { recursive: true });

    await expect(validateChangeExists('beta', tempDir, changesDir)).resolves.toBe('beta');
    await expect(validateChangeExists('missing', tempDir, changesDir)).rejects.toThrow(
      "Change 'missing' not found"
    );
    await expect(validateChangeExists('Bad-Name', tempDir, changesDir)).rejects.toThrow(
      'Invalid change name'
    );
  });

  it('校验 schema 存在性', () => {
    const schemaDir = path.join(tempDir, 'apeworkflow', 'schemas', 'mini');
    const templatesDir = path.join(schemaDir, 'templates');
    fs.mkdirSync(templatesDir, { recursive: true });
    fs.writeFileSync(
      path.join(schemaDir, 'schema.yaml'),
      [
        'name: mini',
        'version: 1',
        'description: Mini schema',
        'artifacts:',
        '  - id: proposal',
        '    generates: proposal.md',
        '    description: Proposal',
        '    template: proposal.md',
        '    requires: []',
      ].join('\n')
    );

    expect(validateSchemaExists('mini', tempDir)).toBe('mini');
    expect(() => validateSchemaExists('missing', tempDir)).toThrow(
      "Schema 'missing' not found"
    );
  });

  it('返回颜色化或纯文本状态标记', () => {
    process.env.NO_COLOR = '1';

    expect(getStatusColor('done')('ok')).toBe('ok');
    expect(getStatusIndicator('done')).toBe('[x]');
    expect(getStatusIndicator('ready')).toBe('[ ]');
    expect(getStatusIndicator('blocked')).toBe('[-]');
  });

  it('在缺失的 changes 目录下返回空列表', async () => {
    await expect(getAvailableChanges(tempDir, path.join(tempDir, 'missing-changes'))).resolves.toEqual([]);
  });

  it('在缺失的 change 上返回“无可用变更”的错误', async () => {
    await expect(
      validateChangeExists('missing', tempDir, path.join(tempDir, 'missing-changes'))
    ).rejects.toThrow('No changes exist. Create one with: apeworkflow new change <name>');
  });

  it('导出默认 schema 名称', () => {
    expect(DEFAULT_SCHEMA).toBe('spec-driven');
  });
});
