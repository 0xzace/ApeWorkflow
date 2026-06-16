import { describe, it, expect } from 'vitest';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';
import { ChangeParser } from '../../../src/core/parsers/change-parser.js';

async function withTempDir(run: (dir: string) => Promise<void>) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'apeworkflow-change-parser-'));
  try {
    await run(dir);
  } finally {
    // Best-effort cleanup
    try { await fs.rm(dir, { recursive: true, force: true }); } catch {}
  }
}

describe('ChangeParser', () => {
  it('parses simple What Changes bullet list', async () => {
    const content = `# Test Change\n\n## Why\nWe need it because reasons that are sufficiently long.\n\n## What Changes\n- **spec-a:** Add a new requirement to A\n- **spec-b:** Rename requirement X to Y\n- **spec-c:** Remove obsolete requirement`;

    const parser = new ChangeParser(content, process.cwd());
    const change = await parser.parseChangeWithDeltas('test-change');

    expect(change.name).toBe('test-change');
    expect(change.deltas.length).toBe(3);
    expect(change.deltas[0].spec).toBe('spec-a');
    expect(['ADDED', 'MODIFIED', 'REMOVED', 'RENAMED']).toContain(change.deltas[1].operation);
  });

  it('prefers delta-format specs over simple bullets when both exist', async () => {
    await withTempDir(async (dir) => {
      const changeDir = dir;
      const specsDir = path.join(changeDir, 'specs', 'foo');
      await fs.mkdir(specsDir, { recursive: true });

      const content = `# Test Change\n\n## Why\nWe need it because reasons that are sufficiently long.\n\n## What Changes\n- **foo:** Add something via bullets (should be overridden)`;
      const deltaSpec = `# Delta for Foo\n\n## ADDED Requirements\n\n### Requirement: New thing\n\n#### Scenario: basic\nGiven X\nWhen Y\nThen Z`;

      await fs.writeFile(path.join(specsDir, 'spec.md'), deltaSpec, 'utf8');

      const parser = new ChangeParser(content, changeDir);
      const change = await parser.parseChangeWithDeltas('test-change');

      expect(change.deltas.length).toBeGreaterThan(0);
      // Since delta spec exists, the description should reflect delta-derived entries
      expect(change.deltas[0].spec).toBe('foo');
      expect(change.deltas[0].description).toContain('Add requirement:');
      expect(change.deltas[0].operation).toBe('ADDED');
      expect(change.deltas[0].requirement).toBeDefined();
    });
  });

  it('会在缺少 Why 或 What Changes 时拒绝解析 change', async () => {
    await expect(
      new ChangeParser(
        `# Missing Why\n\n## What Changes\n- **spec-a:** Add a requirement`,
        process.cwd()
      ).parseChangeWithDeltas('missing-why')
    ).rejects.toThrow('Change must have a Why section');

    await expect(
      new ChangeParser(
        `# Missing What Changes\n\n## Why\nBecause the plan needs a change.`,
        process.cwd()
      ).parseChangeWithDeltas('missing-what-changes')
    ).rejects.toThrow('Change must have a What Changes section');
  });

  it('会在 spec 目录存在但缺少 spec.md 时回退到简单 delta', async () => {
    await withTempDir(async (dir) => {
      const changeDir = dir;
      await fs.mkdir(path.join(changeDir, 'specs', 'auth'), { recursive: true });

      const content = `# Test Change\n\n## Why\nWe need it because reasons that are sufficiently long.\n\n## What Changes\n- **auth:** Add a new requirement to auth`;
      const parser = new ChangeParser(content, changeDir);
      const change = await parser.parseChangeWithDeltas('test-change');

      expect(change.deltas).toEqual([
        expect.objectContaining({
          spec: 'auth',
          operation: 'ADDED',
        }),
      ]);
    });
  });

  it('会解析 delta spec、rename 和 fenced code block 中的标题', async () => {
    const parser = new ChangeParser('', process.cwd());
    const anyParser = parser as unknown as {
      parseSpecDeltas(specName: string, content: string): unknown[];
      parseSectionsFromContent(content: string): Array<{ title: string; content: string }>;
      parseRenames(content: string): Array<{ from: string; to: string }>;
    };

    const specDeltas = anyParser.parseSpecDeltas(
      'auth',
      [
        '## ADDED Requirements',
        '',
        '### Requirement: Login',
        'Login requirement text.',
        '',
        '#### Scenario: successful login',
        'Given a user',
        '',
        '## MODIFIED Requirements',
        '',
        '### Requirement: Logout',
        'Logout requirement text.',
        '',
        '## REMOVED Requirements',
        '',
        '### Requirement: Legacy login',
        'Legacy requirement text.',
        '',
        '## RENAMED Requirements',
        '',
        '- FROM: ### Requirement: Old login',
        '  TO: ### Requirement: New login',
      ].join('\n')
    ) as Array<{ spec: string; operation: string; description: string; requirement?: { text: string }; rename?: { from: string; to: string } }>;

      expect(specDeltas).toEqual([
        expect.objectContaining({
          spec: 'auth',
          operation: 'ADDED',
          description: 'Add requirement: Login requirement text.',
      }),
        expect.objectContaining({
          spec: 'auth',
          operation: 'MODIFIED',
          description: 'Modify requirement: Logout requirement text.',
        }),
        expect.objectContaining({
          spec: 'auth',
          operation: 'REMOVED',
          description: 'Remove requirement: Legacy requirement text.',
        }),
        expect.objectContaining({
          spec: 'auth',
          operation: 'RENAMED',
          description: 'Rename requirement from "Old login" to "New login"',
      }),
    ]);

    expect(anyParser.parseRenames('- FROM: ### Requirement: Old login\n  TO: ### Requirement: New login')).toEqual([
      { from: 'Old login', to: 'New login' },
    ]);

    const sections = anyParser.parseSectionsFromContent([
      '# Test Change',
      '',
      '## Why',
      'Because the parser should ignore code fences.',
      '',
      '## What Changes',
      '```md',
      '### Not a real section',
      '```',
      '- **auth:** Add a new requirement',
    ].join('\n'));

    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe('Test Change');
    expect(sections[0].children.map((section) => section.title)).toEqual(['Why', 'What Changes']);
    expect(sections[0].children.find((section) => section.title === 'What Changes')?.content).toContain(
      '### Not a real section'
    );
  });
});
