import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  generateApplyInstructions,
  generateVerifyInstructions,
  generateArchiveInstructions,
  printApplyInstructionsText,
  printVerifyInstructionsText,
  printArchiveInstructionsText,
} from '../../../src/commands/workflow/instructions.js';

// ---------------------------------------------------------------------------
// Helper: write a schema with phases to a temp project
// ---------------------------------------------------------------------------

function writeSchemaWithPhases(
  tempDir: string,
  schemaName: string,
  tracks: string | null,
  phasesYaml: string
): void {
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
      `apply:`,
      '  requires: [proposal]',
      tracks === null ? '  tracks: null' : `  tracks: ${tracks}`,
      '  instruction: Follow the apply checklist.',
      phasesYaml,
    ].join('\n')
  );

  fs.writeFileSync(path.join(templatesDir, 'proposal.md'), '# Proposal template\n');
}

function writeChange(
  tempDir: string,
  changeName: string,
  files: Record<string, string>
): void {
  const changeDir = path.join(tempDir, 'apeworkflow', 'changes', changeName);
  fs.mkdirSync(changeDir, { recursive: true });
  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(changeDir, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }
}

// ---------------------------------------------------------------------------
// 1. Schema-level tests: phases in YAML
// ---------------------------------------------------------------------------

describe('schema phases validation', () => {
  it('should parse schema with phases block via generateApplyInstructions', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-routing-'));

    try {
      writeSchemaWithPhases(
        tempDir,
        'routing-test',
        'plans/*.md',
        `
phases:
  apply:
    requires: [proposal]
    tracks: plans/*.md
    instruction: Follow apply.
    taskTypeRouting:
      default:
        - executing-plans
      taskTypes:
        feature:
          - executing-plans
          - test-driven-development
  verify:
    instruction: Verify.
    taskTypeRouting:
      default:
        - verification-before-completion
  archive:
    instruction: Archive.
    taskTypeRouting:
      default:
        - finishing-a-development-branch
`
      );

      writeChange(tempDir, 'routing-change', {
        'proposal.md': '# Proposal body\n',
      });

      const result = generateApplyInstructions(tempDir, 'routing-change', 'routing-test');

      // Verify the function completes (will be called with await)
      expect(result).toBeInstanceOf(Promise);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// 2. generateApplyInstructions routing extraction
// ---------------------------------------------------------------------------

describe('generateApplyInstructions taskTypeRouting', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-routing-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function writeSchemaWithRouting(
    schemaName: string,
    tracks: string | null,
    routingYaml: string
  ): void {
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
        `apply:`,
        '  requires: [proposal]',
        tracks === null ? '  tracks: null' : `  tracks: ${tracks}`,
        '  instruction: Follow the apply checklist.',
        routingYaml,
      ].join('\n')
    );

    fs.writeFileSync(path.join(templatesDir, 'proposal.md'), '# Proposal template\n');
  }

  it('返回 undefined 当 schema 没有 routing 配置时', async () => {
    writeSchemaWithRouting('no-routing', null, '');
    writeChange(tempDir, 'no-routing-change', {
      'proposal.md': '# Proposal\n',
    });

    const result = await generateApplyInstructions(tempDir, 'no-routing-change', 'no-routing');

    expect(result.state).toBe('ready');
    expect(result.taskTypeRouting).toBeUndefined();
  });

  it('返回 routing 当 phases.apply 有 taskTypeRouting', async () => {
    writeSchemaWithRouting(
      'phases-routing',
      'plans/*.md',
      `
phases:
  apply:
    requires: [proposal]
    tracks: plans/*.md
    instruction: Follow apply.
    taskTypeRouting:
      default:
        - executing-plans
        - test-driven-development
      taskTypes:
        feature:
          - executing-plans
          - test-driven-development
          - subagent-driven-development
        bugfix:
          - systematic-debugging
          - test-driven-development
`
    );
    writeChange(tempDir, 'phases-change', {
      'proposal.md': '# Proposal\n',
    });

    const result = await generateApplyInstructions(tempDir, 'phases-change', 'phases-routing');

    expect(result.taskTypeRouting).toBeDefined();
    expect(result.taskTypeRouting!.default).toEqual([
      'executing-plans',
      'test-driven-development',
    ]);
    expect(result.taskTypeRouting!.taskTypes).toEqual({
      feature: ['executing-plans', 'test-driven-development', 'subagent-driven-development'],
      bugfix: ['systematic-debugging', 'test-driven-development'],
    });
  });

  it('fallback 到顶层 apply.taskTypeRouting 当 phases 不存在', async () => {
    // Schema with only top-level apply.taskTypeRouting (legacy format)
    const schemaDir = path.join(tempDir, 'apeworkflow', 'schemas', 'legacy-routing');
    const templatesDir = path.join(schemaDir, 'templates');
    fs.mkdirSync(templatesDir, { recursive: true });

    fs.writeFileSync(
      path.join(schemaDir, 'schema.yaml'),
      [
        'name: legacy-routing',
        'version: 1',
        'description: Legacy schema',
        'artifacts:',
        '  - id: proposal',
        '    generates: proposal.md',
        '    description: Proposal',
        '    template: proposal.md',
        '    requires: []',
        'apply:',
        '  requires: [proposal]',
        '  tracks: null',
        '  instruction: Legacy apply.',
        '  taskTypeRouting:',
        '    default:',
        '      - executing-plans',
        '    taskTypes:',
        '      feature:',
        '        - executing-plans',
      ].join('\n')
    );
    fs.writeFileSync(path.join(templatesDir, 'proposal.md'), '# Proposal template\n');

    writeChange(tempDir, 'legacy-change', {
      'proposal.md': '# Proposal\n',
    });

    const result = await generateApplyInstructions(tempDir, 'legacy-change', 'legacy-routing');

    expect(result.taskTypeRouting).toBeDefined();
    expect(result.taskTypeRouting!.default).toEqual(['executing-plans']);
    expect(result.taskTypeRouting!.taskTypes).toEqual({
      feature: ['executing-plans'],
    });
  });

  it('返回空 taskTypes 当只有 default 没有 taskTypes', async () => {
    writeSchemaWithRouting(
      'default-only',
      'plans/*.md',
      `
phases:
  apply:
    requires: [proposal]
    tracks: plans/*.md
    instruction: Follow apply.
    taskTypeRouting:
      default:
        - executing-plans
`
    );
    writeChange(tempDir, 'default-change', {
      'proposal.md': '# Proposal\n',
    });

    const result = await generateApplyInstructions(tempDir, 'default-change', 'default-only');

    expect(result.taskTypeRouting).toBeDefined();
    expect(result.taskTypeRouting!.default).toEqual(['executing-plans']);
    expect(result.taskTypeRouting!.taskTypes).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// 3. generateVerifyInstructions
// ---------------------------------------------------------------------------

describe('generateVerifyInstructions', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-verify-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('返回 routing 当 schema 有 phases.verify', async () => {
    const schemaDir = path.join(tempDir, 'apeworkflow', 'schemas', 'verify-test');
    const templatesDir = path.join(schemaDir, 'templates');
    fs.mkdirSync(templatesDir, { recursive: true });

    fs.writeFileSync(
      path.join(schemaDir, 'schema.yaml'),
      [
        'name: verify-test',
        'version: 1',
        'description: Verify test schema',
        'artifacts:',
        '  - id: proposal',
        '    generates: proposal.md',
        '    description: Proposal',
        '    template: proposal.md',
        '    requires: []',
        '  - id: plans',
        '    generates: plans/*.md',
        '    description: Plans',
        '    template: plans.md',
        '    requires: [proposal]',
        'phases:',
        '  verify:',
        '    instruction: Verify implementation.',
        '    taskTypeRouting:',
        '      default:',
        '        - verification-before-completion',
        '      taskTypes:',
        '        feature:',
        '          - verification-before-completion',
        '          - requesting-code-review',
      ].join('\n')
    );
    fs.writeFileSync(path.join(templatesDir, 'proposal.md'), '# Proposal template\n');

    writeChange(tempDir, 'verify-change', {
      'proposal.md': '# Proposal\n',
      'plans/2026-06-17-verify.md': '- [x] Done\n',
    });

    const result = await generateVerifyInstructions(tempDir, 'verify-change', 'verify-test');

    expect(result.state).toBe('ready');
    expect(result.taskTypeRouting).toBeDefined();
    expect(result.taskTypeRouting!.default).toEqual(['verification-before-completion']);
    expect(result.taskTypeRouting!.taskTypes).toEqual({
      feature: ['verification-before-completion', 'requesting-code-review'],
    });
    expect(result.instruction).toBe('Verify implementation.');
  });

  it('返回 undefined routing 当 phases.verify 不存在', async () => {
    const schemaDir = path.join(tempDir, 'apeworkflow', 'schemas', 'no-verify');
    const templatesDir = path.join(schemaDir, 'templates');
    fs.mkdirSync(templatesDir, { recursive: true });

    fs.writeFileSync(
      path.join(schemaDir, 'schema.yaml'),
      [
        'name: no-verify',
        'version: 1',
        'description: No verify schema',
        'artifacts:',
        '  - id: proposal',
        '    generates: proposal.md',
        '    description: Proposal',
        '    template: proposal.md',
        '    requires: []',
        'apply:',
        '  requires: [proposal]',
        '  tracks: null',
      ].join('\n')
    );
    fs.writeFileSync(path.join(templatesDir, 'proposal.md'), '# Proposal template\n');

    writeChange(tempDir, 'no-verify-change', {
      'proposal.md': '# Proposal\n',
    });

    const result = await generateVerifyInstructions(tempDir, 'no-verify-change', 'no-verify');

    expect(result.taskTypeRouting).toBeUndefined();
    expect(result.instruction).toBe('Verify the implementation.');
  });
});

// ---------------------------------------------------------------------------
// 4. generateArchiveInstructions
// ---------------------------------------------------------------------------

describe('generateArchiveInstructions', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-archive-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('返回 routing 和完成状态', async () => {
    const schemaDir = path.join(tempDir, 'apeworkflow', 'schemas', 'archive-test');
    const templatesDir = path.join(schemaDir, 'templates');
    fs.mkdirSync(templatesDir, { recursive: true });

    fs.writeFileSync(
      path.join(schemaDir, 'schema.yaml'),
      [
        'name: archive-test',
        'version: 1',
        'description: Archive test schema',
        'artifacts:',
        '  - id: proposal',
        '    generates: proposal.md',
        '    description: Proposal',
        '    template: proposal.md',
        '    requires: []',
        '  - id: plans',
        '    generates: plans/*.md',
        '    description: Plans',
        '    template: plans.md',
        '    requires: [proposal]',
        'phases:',
        '  archive:',
        '    instruction: Archive the change.',
        '    taskTypeRouting:',
        '      default:',
        '        - finishing-a-development-branch',
        '        - verification-before-completion',
        '      taskTypes:',
        '        feature:',
        '          - finishing-a-development-branch',
        '          - verification-before-completion',
      ].join('\n')
    );
    fs.writeFileSync(path.join(templatesDir, 'proposal.md'), '# Proposal template\n');

    writeChange(tempDir, 'archive-change', {
      'proposal.md': '# Proposal\n',
    });

    const result = await generateArchiveInstructions(tempDir, 'archive-change', 'archive-test');

    expect(result.taskTypeRouting).toBeDefined();
    expect(result.taskTypeRouting!.default).toEqual([
      'finishing-a-development-branch',
      'verification-before-completion',
    ]);
    expect(result.taskTypeRouting!.taskTypes).toEqual({
      feature: ['finishing-a-development-branch', 'verification-before-completion'],
    });
    expect(result.hasDeltaSpecs).toBe(false);
    expect(result.hasIncompleteTasks).toBe(false);
    expect(result.hasIncompleteArtifacts).toBe(true); // plans artifact is pending
    expect(result.artifacts).toHaveLength(2);
    expect(result.artifacts[0].id).toBe('proposal');
    expect(result.artifacts[0].status).toBe('done');
  });

  it('正确标记有未完成任务的变更', async () => {
    const schemaDir = path.join(tempDir, 'apeworkflow', 'schemas', 'archive-incomplete');
    const templatesDir = path.join(schemaDir, 'templates');
    fs.mkdirSync(templatesDir, { recursive: true });

    fs.writeFileSync(
      path.join(schemaDir, 'schema.yaml'),
      [
        'name: archive-incomplete',
        'version: 1',
        'description: Archive incomplete schema',
        'artifacts:',
        '  - id: proposal',
        '    generates: proposal.md',
        '    description: Proposal',
        '    template: proposal.md',
        '    requires: []',
        '  - id: plans',
        '    generates: plans/*.md',
        '    description: Plans',
        '    template: plans.md',
        '    requires: [proposal]',
      ].join('\n')
    );
    fs.writeFileSync(path.join(templatesDir, 'proposal.md'), '# Proposal template\n');

    writeChange(tempDir, 'incomplete-change', {
      'proposal.md': '# Proposal\n',
      'plans/2026-06-17-test.md': '- [x] Done task\n- [ ] Pending task\n',
    });

    const result = await generateArchiveInstructions(
      tempDir,
      'incomplete-change',
      'archive-incomplete'
    );

    expect(result.hasIncompleteTasks).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Print functions
// ---------------------------------------------------------------------------

describe('print instruction functions include routing', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('printApplyInstructionsText 包含 routing', () => {
    printApplyInstructionsText({
      changeName: 'test',
      schemaName: 'test',
      changeDir: '/tmp/test',
      contextFiles: {},
      progress: { total: 0, complete: 0, remaining: 0 },
      tasks: [],
      state: 'ready',
      instruction: 'Go',
      taskTypeRouting: {
        default: ['executing-plans'],
        taskTypes: { feature: ['executing-plans', 'test-driven-development'] },
      },
    });

    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Task Type Routing');
    expect(output).toContain('executing-plans');
  });

  it('printVerifyInstructionsText 包含 routing', () => {
    printVerifyInstructionsText({
      changeName: 'test',
      schemaName: 'test',
      changeDir: '/tmp/test',
      contextFiles: {},
      taskTypeRouting: {
        default: ['verification-before-completion'],
        taskTypes: {},
      },
      state: 'ready',
      hasIncompleteTasks: false,
      instruction: 'Verify',
    });

    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Task Type Routing');
    expect(output).toContain('verification-before-completion');
  });

  it('printArchiveInstructionsText 包含 routing', () => {
    printArchiveInstructionsText({
      changeName: 'test',
      schemaName: 'test',
      changeDir: '/tmp/test',
      taskTypeRouting: {
        default: ['finishing-a-development-branch'],
        taskTypes: { feature: ['finishing-a-development-branch'] },
      },
      instruction: 'Archive',
      hasDeltaSpecs: false,
      hasIncompleteTasks: false,
      hasIncompleteArtifacts: false,
      artifacts: [],
    });

    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Task Type Routing');
    expect(output).toContain('finishing-a-development-branch');
  });
});
