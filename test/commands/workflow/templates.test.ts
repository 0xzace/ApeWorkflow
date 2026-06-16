import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { templatesCommand } from '../../../src/commands/workflow/templates.js';

describe('workflow templates command', () => {
  let tempDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let originalCwd: string;

  beforeEach(() => {
    // 中文注释：模板命令会读当前工作目录，所以这里显式切换到临时项目。
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-templates-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(originalCwd);
    logSpy.mockRestore();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function writeSchema(schemaName: string): void {
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
      ].join('\n')
    );
    fs.writeFileSync(path.join(templatesDir, 'proposal.md'), '# Proposal template\n');
  }

  it('输出 project schema 的模板路径 JSON', async () => {
    writeSchema('template-demo');

    await templatesCommand({ schema: 'template-demo', json: true });

    const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(payload.proposal.source).toBe('project');
    expect(payload.proposal.path).toContain(path.join('apeworkflow', 'schemas', 'template-demo'));
    expect(payload.proposal.path).toContain('templates');
  });
});
