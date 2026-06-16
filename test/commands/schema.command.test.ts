import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Command } from 'commander';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { readFileSync } from 'node:fs';

import { registerSchemaCommand } from '../../src/commands/schema.js';

describe('schema command registration', () => {
  let tempDir: string;
  let originalCwd: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // 中文注释：这里直接走 Commander 注册路径，覆盖 which / validate / fork 的命令分支。
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-schema-command-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(originalCwd);
    logSpy.mockRestore();
    errorSpy.mockRestore();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function writeSchema(schemaName: string): string {
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
    return schemaDir;
  }

  async function runSchema(args: string[]): Promise<void> {
    const program = new Command();
    program.exitOverride();
    registerSchemaCommand(program);
    await program.parseAsync(['schema', ...args], { from: 'user' });
  }

  it('输出指定 schema 的解析位置', async () => {
    writeSchema('demo');

    await runSchema(['which', 'demo', '--json']);

    const payload = JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string);
    expect(payload.name).toBe('demo');
    expect(payload.source).toBe('project');
    expect(payload.shadows).toEqual([]);
  });

  it('验证 project schema', async () => {
    writeSchema('demo');

    await runSchema(['validate', 'demo', '--json']);

    const payload = JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string);
    expect(payload.name).toBe('demo');
    expect(payload.valid).toBe(true);
    expect(payload.issues).toEqual([]);
  });

  it('fork 一个 project schema', async () => {
    const sourceDir = writeSchema('demo');

    await runSchema(['fork', 'demo', 'demo-copy', '--json']);

    const payload = JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string);
    expect(payload.forked).toBe(true);
    expect(payload.source).toBe('demo');
    expect(payload.destination).toBe('demo-copy');
    expect(fs.realpathSync.native(payload.sourcePath)).toBe(fs.realpathSync.native(sourceDir));

    const destinationDir = path.join(tempDir, 'apeworkflow', 'schemas', 'demo-copy');
    expect(fs.existsSync(destinationDir)).toBe(true);
    const forkedSchema = readFileSync(path.join(destinationDir, 'schema.yaml'), 'utf-8');
    expect(forkedSchema).toContain('name: demo-copy');
  });

  it('输出 which --all 的所有 schema 解析结果', async () => {
    // 中文注释：这里同时放一个项目 schema 和一个同名包内 schema，用来命中 shadows 分支。
    writeSchema('demo');
    writeSchema('spec-driven');

    await runSchema(['which', '--all', '--json']);

    const payload = JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string);
    const projectSchema = payload.find((item: any) => item.name === 'spec-driven');
    const demoSchema = payload.find((item: any) => item.name === 'demo');

    expect(projectSchema).toEqual(
      expect.objectContaining({
        name: 'spec-driven',
        source: 'project',
        shadows: [
          expect.objectContaining({
            source: 'package',
          }),
        ],
      })
    );
    expect(demoSchema).toEqual(
      expect.objectContaining({
        name: 'demo',
        source: 'project',
      })
    );
  });

  it('在缺少 project schemas 目录时返回 validate 空提示', async () => {
    // 中文注释：删除 schemas 目录，覆盖 validate 的“没有项目 schema”分支。
    fs.rmSync(path.join(tempDir, 'apeworkflow', 'schemas'), { recursive: true, force: true });

    await runSchema(['validate', '--json']);

    const payload = JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string);
    expect(payload).toEqual(
      expect.objectContaining({
        valid: true,
        message: 'No project schemas directory found',
        schemas: [],
      })
    );
  });

  it('会拒绝非法 fork 名称并报告未知 source', async () => {
    await runSchema(['fork', 'missing-source', 'bad_name', '--json']);

    const invalidNamePayload = JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string);
    expect(invalidNamePayload).toEqual(
      expect.objectContaining({
        forked: false,
        error: expect.stringContaining('kebab-case'),
      })
    );

    await runSchema(['fork', 'missing-source', 'demo-copy', '--json']);

    const missingSourcePayload = JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string);
    expect(missingSourcePayload).toEqual(
      expect.objectContaining({
        forked: false,
        error: "Schema 'missing-source' not found",
        available: expect.any(Array),
      })
    );
  });

  it('init 会写入默认 schema 配置并校验 artifact 选择', async () => {
    await runSchema([
      'init',
      'team-schema',
      '--description',
      'Team schema',
      '--artifacts',
      'proposal,specs',
      '--default',
      '--json',
    ]);

    const payload = JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string);
    expect(payload).toEqual(
      expect.objectContaining({
        created: true,
        schema: 'team-schema',
        setAsDefault: true,
        artifacts: ['proposal', 'specs'],
      })
    );

    const configPath = path.join(tempDir, 'apeworkflow', 'config.yaml');
    expect(fs.existsSync(configPath)).toBe(true);
    expect(readFileSync(configPath, 'utf-8')).toContain('defaultSchema: team-schema');

    const schemaYaml = readFileSync(
      path.join(tempDir, 'apeworkflow', 'schemas', 'team-schema', 'schema.yaml'),
      'utf-8'
    );
    expect(schemaYaml).toContain('requires:');
    expect(schemaYaml).toContain('proposal');
  });
});
