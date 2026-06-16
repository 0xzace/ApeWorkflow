import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { generateApplyInstructions } from '../../../src/commands/workflow/instructions.js';

describe('workflow apply instructions', () => {
  let tempDir: string;

  beforeEach(() => {
    // 中文注释：这里用临时项目根目录构造 schema 和 change 目录，保证测试是自包含的。
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-instructions-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function writeSchema(schemaName: string, applyTracks: string | null): void {
    const schemaDir = path.join(tempDir, 'apeworkflow', 'schemas', schemaName);
    const templatesDir = path.join(schemaDir, 'templates');
    fs.mkdirSync(templatesDir, { recursive: true });

    fs.writeFileSync(
      path.join(schemaDir, 'schema.yaml'),
      [
        `name: ${schemaName}`,
        'version: 1',
        'description: Demo schema',
        'artifacts:',
        '  - id: proposal',
        '    generates: proposal.md',
        '    description: Proposal',
        '    template: proposal.md',
        '    requires: []',
        'apply:',
        '  requires: [proposal]',
        applyTracks === null ? '  tracks: null' : `  tracks: ${applyTracks}`,
        '  instruction: Follow the apply checklist.',
      ].join('\n')
    );

    fs.writeFileSync(path.join(templatesDir, 'proposal.md'), '# Proposal template\n');
  }

  function writeChange(changeName: string, files: Record<string, string>): void {
    const changeDir = path.join(tempDir, 'apeworkflow', 'changes', changeName);
    fs.mkdirSync(changeDir, { recursive: true });
    for (const [relativePath, content] of Object.entries(files)) {
      const filePath = path.join(changeDir, relativePath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content);
    }
  }

  it('在必需产物缺失时返回 blocked', async () => {
    writeSchema('apply-demo', 'tasks.md');
    fs.mkdirSync(path.join(tempDir, 'apeworkflow', 'changes', 'missing-artifacts'), {
      recursive: true,
    });

    const result = await generateApplyInstructions(tempDir, 'missing-artifacts', 'apply-demo');

    expect(result.state).toBe('blocked');
    expect(result.missingArtifacts).toEqual(['proposal']);
    expect(result.instruction).toContain('Missing artifacts: proposal');
    expect(result.progress).toEqual({ total: 0, complete: 0, remaining: 0 });
  });

  it('在 tracking 文件缺失时返回 blocked', async () => {
    writeSchema('apply-demo', 'tasks.md');
    writeChange('missing-tracks', {
      'proposal.md': '# Proposal body\n',
    });

    const result = await generateApplyInstructions(tempDir, 'missing-tracks', 'apply-demo');

    expect(result.state).toBe('blocked');
    expect(result.instruction).toContain('tasks.md file is missing');
    expect(result.missingArtifacts).toBeUndefined();
  });

  it('在任务全部完成时返回 all_done', async () => {
    writeSchema('apply-demo', 'tasks.md');
    writeChange('all-done', {
      'proposal.md': '# Proposal body\n',
      'tasks.md': ['- [x] First task', '* [X] Second task'].join('\n'),
    });

    const result = await generateApplyInstructions(tempDir, 'all-done', 'apply-demo');

    expect(result.state).toBe('all_done');
    expect(result.progress).toEqual({ total: 2, complete: 2, remaining: 0 });
    expect(result.tasks).toHaveLength(2);
    expect(result.instruction).toContain('ready to be archived');
  });

  it('在没有 tracking 文件时返回 ready', async () => {
    writeSchema('apply-ready', null);
    writeChange('ready-change', {
      'proposal.md': '# Proposal body\n',
    });

    const result = await generateApplyInstructions(tempDir, 'ready-change', 'apply-ready');

    expect(result.state).toBe('ready');
    expect(result.instruction).toContain('Follow the apply checklist.');
  });
});
