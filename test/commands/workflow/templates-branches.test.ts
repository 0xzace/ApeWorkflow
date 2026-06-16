import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const templatesMocks = vi.hoisted(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  validateSchemaExists: vi.fn(),
  resolveSchema: vi.fn(),
  getSchemaDir: vi.fn(),
  fromSchema: vi.fn(),
  getProjectSchemasDir: vi.fn(),
  getUserSchemasDir: vi.fn(),
  canonicalizeExistingPath: vi.fn((value: string) => value),
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: templatesMocks.start,
  })),
}));

vi.mock('../../../src/commands/workflow/shared.js', () => ({
  DEFAULT_SCHEMA: 'spec-driven',
  validateSchemaExists: templatesMocks.validateSchemaExists,
}));

vi.mock('../../../src/core/artifact-graph/index.js', () => ({
  resolveSchema: templatesMocks.resolveSchema,
  getSchemaDir: templatesMocks.getSchemaDir,
  ArtifactGraph: {
    fromSchema: templatesMocks.fromSchema,
  },
}));

vi.mock('../../../src/core/artifact-graph/resolver.js', () => ({
  getProjectSchemasDir: templatesMocks.getProjectSchemasDir,
  getUserSchemasDir: templatesMocks.getUserSchemasDir,
}));

vi.mock('../../../src/utils/file-system.js', () => ({
  FileSystemUtils: {
    canonicalizeExistingPath: templatesMocks.canonicalizeExistingPath,
  },
}));

describe('workflow templates command branches', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let originalCwd: string;

  beforeEach(() => {
    // 中文注释：这里用 mock 隔离模板命令的依赖，只验证分支和输出格式。
    vi.resetModules();
    originalCwd = process.cwd();
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    templatesMocks.start.mockReturnValue({ stop: templatesMocks.stop });
    templatesMocks.stop.mockReset();
    templatesMocks.validateSchemaExists.mockImplementation((schema: string) => schema);
    templatesMocks.resolveSchema.mockImplementation((schema: string) => ({ schema }));
    templatesMocks.getSchemaDir.mockReset();
    templatesMocks.fromSchema.mockReturnValue({
      getAllArtifacts: () => [{ id: 'proposal', template: 'proposal.md' }],
    });
    templatesMocks.getProjectSchemasDir.mockReturnValue('/workspace/apeworkflow/schemas');
    templatesMocks.getUserSchemasDir.mockReturnValue('/users/acez/.local/share/apeworkflow/schemas');
    templatesMocks.canonicalizeExistingPath.mockImplementation((value: string) => value);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    logSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('会输出 user schema 的文本结果', async () => {
    templatesMocks.getSchemaDir.mockReturnValue('/users/acez/.local/share/apeworkflow/schemas/demo');
    const { templatesCommand } = await import('../../../src/commands/workflow/templates.js');

    await templatesCommand({ schema: 'demo' });

    expect(templatesMocks.stop).toHaveBeenCalled();
    expect(logSpy.mock.calls.map((call) => call[0])).toEqual(
      expect.arrayContaining([
        'Schema: demo',
        'Source: user',
        'proposal:',
        '  /users/acez/.local/share/apeworkflow/schemas/demo/templates/proposal.md',
      ])
    );
  });

  it('会输出 package schema 的 JSON 结果', async () => {
    templatesMocks.getSchemaDir.mockReturnValue('/opt/apeworkflow/templates/demo');
    const { templatesCommand } = await import('../../../src/commands/workflow/templates.js');

    await templatesCommand({ schema: 'demo', json: true });

    const payload = JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string);
    expect(payload).toEqual({
      proposal: {
        path: '/opt/apeworkflow/templates/demo/templates/proposal.md',
        source: 'package',
      },
    });
  });
});
