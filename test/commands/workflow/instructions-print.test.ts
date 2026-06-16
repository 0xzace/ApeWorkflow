import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';

import { printInstructionsText, printApplyInstructionsText, generateApplyInstructions } from '../../../src/commands/workflow/instructions.js';
import type { ArtifactInstructions, ApplyInstructions } from '../../../src/commands/workflow/instructions.js';

// ---------------------------------------------------------------------------
// printInstructionsText - 测试打印输出格式
// ---------------------------------------------------------------------------

describe('printInstructionsText', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  function minimalInstructions(overrides?: Partial<ArtifactInstructions>): ArtifactInstructions {
    return {
      artifactId: 'proposal',
      changeName: 'test-change',
      schemaName: 'default',
      changeDir: '/tmp/test',
      description: 'Write a proposal',
      instruction: 'Follow the template',
      template: '# Template',
      dependencies: [],
      unlocks: [],
      ...overrides,
    };
  }

  it('打印基本的 artifact 标签和任务指令', () => {
    printInstructionsText(minimalInstructions());

    const calls = logSpy.mock.calls.map((c) => c[0]);
    const output = calls.join('\n');

    expect(output).toContain('<artifact id="proposal" change="test-change" schema="default">');
    expect(output).toContain('<task>');
    expect(output).toContain('Create the proposal artifact for change "test-change"');
    expect(output).toContain('<output>');
    expect(output).toContain('Write to: ');
    expect(output).toContain('</artifact>');
  });

  it('当有 initiative 时打印 initiative 标签', () => {
    printInstructionsText(minimalInstructions({
      initiative: { store: 'teams', id: 'team-alpha' },
    }));

    const calls = logSpy.mock.calls.map((c) => c[0]);
    const output = calls.join('\n');

    expect(output).toContain('<initiative store="teams" id="team-alpha" />');
  });

  it('当有 dependencies 时打印依赖信息', () => {
    printInstructionsText(minimalInstructions({
      dependencies: [
        { id: 'design', path: 'design.md', description: 'Design doc', done: true },
        { id: 'specs', path: 'specs/auth/spec.md', description: 'Auth spec', done: false },
      ],
    }));

    const calls = logSpy.mock.calls.map((c) => c[0]);
    const output = calls.join('\n');

    expect(output).toContain('<dependencies>');
    expect(output).toContain('<dependency id="design" status="done">');
    expect(output).toContain('<dependency id="specs" status="missing">');
    expect(output).toContain('Design doc');
    expect(output).toContain('Auth spec');
  });

  it('当有 context 时打印 project_context 标签', () => {
    printInstructionsText(minimalInstructions({
      context: 'This is the project context.',
    }));

    const calls = logSpy.mock.calls.map((c) => c[0]);
    const output = calls.join('\n');

    expect(output).toContain('<project_context>');
    expect(output).toContain('This is the project context.');
    expect(output).toContain('</project_context>');
  });

  it('当有 rules 时打印 rules 标签', () => {
    printInstructionsText(minimalInstructions({
      rules: ['Rule 1', 'Rule 2'],
    }));

    const calls = logSpy.mock.calls.map((c) => c[0]);
    const output = calls.join('\n');

    expect(output).toContain('<rules>');
    expect(output).toContain('- Rule 1');
    expect(output).toContain('- Rule 2');
    expect(output).toContain('</rules>');
  });

  it('当有 unlocks 时打印 unlocks 标签', () => {
    printInstructionsText(minimalInstructions({
      unlocks: ['design', 'implementation'],
    }));

    const calls = logSpy.mock.calls.map((c) => c[0]);
    const output = calls.join('\n');

    expect(output).toContain('<unlocks>');
    expect(output).toContain('Completing this artifact enables: design, implementation');
    expect(output).toContain('</unlocks>');
  });

  it('当 blocked 时打印 warning 标签', () => {
    const instructions = minimalInstructions({
      dependencies: [
        { id: 'design', path: 'design.md', description: 'Design doc', done: false },
      ],
    });
    const isBlocked = true;

    printInstructionsText(instructions, isBlocked);

    const calls = logSpy.mock.calls.map((c) => c[0]);
    const output = calls.join('\n');

    expect(output).toContain('<warning>');
    expect(output).toContain('unmet dependencies');
    expect(output).toContain('Missing: design');
  });

  it('当没有 initiative 时不打印 initiative 标签', () => {
    printInstructionsText(minimalInstructions());

    const calls = logSpy.mock.calls.map((c) => c[0]);
    const output = calls.join('\n');

    expect(output).not.toContain('<initiative');
  });

  it('当没有 rules 时不打印 rules 标签', () => {
    printInstructionsText(minimalInstructions({ rules: [] }));

    const calls = logSpy.mock.calls.map((c) => c[0]);
    const output = calls.join('\n');

    expect(output).not.toContain('<rules>');
  });

  it('当没有 dependencies 时不打印 dependencies 标签', () => {
    printInstructionsText(minimalInstructions({ dependencies: [] }));

    const calls = logSpy.mock.calls.map((c) => c[0]);
    const output = calls.join('\n');

    expect(output).not.toContain('<dependencies>');
  });
});

// ---------------------------------------------------------------------------
// printApplyInstructionsText - 测试应用指令打印
// ---------------------------------------------------------------------------

describe('printApplyInstructionsText', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  function minimalApplyInstructions(overrides?: Partial<ApplyInstructions>): ApplyInstructions {
    return {
      changeName: 'test-change',
      schemaName: 'default',
      changeDir: '/tmp/test',
      contextFiles: {},
      progress: { total: 0, complete: 0, remaining: 0 },
      tasks: [],
      state: 'ready',
      instruction: 'Go ahead',
      ...overrides,
    };
  }

  it('打印基本的应用指令标题', () => {
    printApplyInstructionsText(minimalApplyInstructions());

    const calls = logSpy.mock.calls.map((c) => c[0]);
    const output = calls.join('\n');

    expect(output).toContain('## Apply: test-change');
    expect(output).toContain('Schema: default');
    expect(output).toContain('### Instruction');
    expect(output).toContain('Go ahead');
  });

  it('当有 initiative 时打印 initiative 行', () => {
    printApplyInstructionsText(minimalApplyInstructions({
      initiative: { store: 'teams', id: 'team-1' },
    }));

    const calls = logSpy.mock.calls.map((c) => c[0]);
    const output = calls.join('\n');

    expect(output).toContain('Initiative: teams/team-1');
  });

  it('当状态为 blocked 时打印警告', () => {
    printApplyInstructionsText(minimalApplyInstructions({
      state: 'blocked',
      missingArtifacts: ['proposal', 'design'],
    }));

    const calls = logSpy.mock.calls.map((c) => c[0]);
    const output = calls.join('\n');

    expect(output).toContain('Blocked');
    expect(output).toContain('Missing artifacts: proposal, design');
  });

  it('当有 context files 时打印它们', () => {
    printApplyInstructionsText(minimalApplyInstructions({
      contextFiles: {
        proposal: ['changes/test-change/proposal.md'],
        design: ['changes/test-change/design.md'],
      },
    }));

    const calls = logSpy.mock.calls.map((c) => c[0]);
    const output = calls.join('\n');

    expect(output).toContain('### Context Files');
    expect(output).toContain('- proposal: changes/test-change/proposal.md');
    expect(output).toContain('- design: changes/test-change/design.md');
  });

  it('当有任务时打印进度和任务列表', () => {
    printApplyInstructionsText(minimalApplyInstructions({
      tasks: [
        { id: '1', description: 'Task A', done: true },
        { id: '2', description: 'Task B', done: false },
      ],
      progress: { total: 2, complete: 1, remaining: 1 },
    }));

    const calls = logSpy.mock.calls.map((c) => c[0]);
    const output = calls.join('\n');

    expect(output).toContain('### Progress');
    expect(output).toContain('1/2 complete');
    expect(output).toContain('### Tasks');
    expect(output).toContain('- [ ] Task B');
  });

  it('当 all_done 时打印完成标记', () => {
    printApplyInstructionsText(minimalApplyInstructions({
      state: 'all_done',
      tasks: [{ id: '1', description: 'Done task', done: true }],
      progress: { total: 1, complete: 1, remaining: 0 },
    }));

    const calls = logSpy.mock.calls.map((c) => c[0]);
    const output = calls.join('\n');

    expect(output).toContain('1/1 complete');
    // all_done 应该显示 ✓
    expect(output).toContain('✓');
  });

  it('没有 initiative 时不打印 initiative 行', () => {
    printApplyInstructionsText(minimalApplyInstructions());

    const calls = logSpy.mock.calls.map((c) => c[0]);
    const output = calls.join('\n');

    expect(output).not.toContain('Initiative:');
  });

  it('没有 context files 时不打印上下文部分', () => {
    printApplyInstructionsText(minimalApplyInstructions({ contextFiles: {} }));

    const calls = logSpy.mock.calls.map((c) => c[0]);
    const output = calls.join('\n');

    expect(output).not.toContain('### Context Files');
  });
});
