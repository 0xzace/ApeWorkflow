import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/core/artifact-graph/index.js', () => ({
  listSchemasWithInfo: vi.fn(),
}));

import { listSchemasWithInfo } from '../../../src/core/artifact-graph/index.js';
import { schemasCommand } from '../../../src/commands/workflow/schemas.js';

describe('workflow schemas command', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('会输出 JSON 格式的 schema 列表', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(listSchemasWithInfo).mockReturnValue([
      {
        name: 'demo',
        source: 'project',
        description: 'Project schema',
        artifacts: ['proposal.md', 'tasks.md'],
      },
    ] as never);

    // 中文注释：JSON 分支只依赖 listSchemasWithInfo 的返回值，适合直接断言输出结构。
    await schemasCommand({ json: true });

    const payload = JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string);
    expect(payload).toHaveLength(1);
    expect(payload[0].name).toBe('demo');
    expect(payload[0].source).toBe('project');
  });

  it('会输出 human 格式并标注来源', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(listSchemasWithInfo).mockReturnValue([
      {
        name: 'demo',
        source: 'project',
        description: 'Project schema',
        artifacts: ['proposal.md', 'tasks.md'],
      },
      {
        name: 'override',
        source: 'user',
        description: 'User override schema',
        artifacts: ['plan.md'],
      },
    ] as never);

    // 中文注释：human 分支需要覆盖 project / user 两种来源标签。
    await schemasCommand({});

    const output = logSpy.mock.calls.map((call) => call.map(String).join(' ')).join('\n');
    expect(output).toContain('Available schemas:');
    expect(output).toContain('demo');
    expect(output).toContain('(project)');
    expect(output).toContain('override');
    expect(output).toContain('(user override)');
  });
});
