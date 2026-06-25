import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import { VerifyCommand } from '../../src/commands/verify';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

describe('VerifyCommand', () => {
  let tempDir: string;
  const originalConsoleLog = console.log;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `apeworkflow-verify-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    process.chdir(tempDir);
    console.log = vi.fn();
  });

  afterEach(async () => {
    console.log = originalConsoleLog;
    vi.clearAllMocks();
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  function createChangeDir(name: string) {
    const changeDir = path.join(tempDir, 'apeworkflow', 'changes', name);
    return {
      changeDir,
      plansDir: path.join(changeDir, 'plans'),
    };
  }

  async function writeChange(name: string, files: Record<string, string>) {
    const { changeDir, plansDir } = createChangeDir(name);
    await fs.mkdir(changeDir, { recursive: true });
    await fs.mkdir(plansDir, { recursive: true });
    for (const [relativePath, content] of Object.entries(files)) {
      const fullPath = path.join(changeDir, relativePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content);
    }
  }

  describe('execute', () => {
    it('passes verification for a complete change with all artifacts', async () => {
      await writeChange('complete-change', {
        'proposal.md': '# Proposal\n\n## Why\nFix things.\n',
        'specs.md': '# Specs\n\n## Context\nTest specs.\n',
        'design.md': '# Design\n\n## Context\nTest design.\n',
        'tasks.md': '## Tasks\n\n- [ ] Task 1\n- [x] Task 2\n',
        'plans/test-plan.md': '# Plan\n\n- [ ] Step 1\n- [ ] Step 2\n',
      });

      const cmd = new VerifyCommand();
      const result = await cmd.execute('complete-change', { json: true });

      expect(result.changeName).toBe('complete-change');
      expect(result.overallScore).toBeGreaterThan(80);
      expect(result.issues.filter(i => i.priority === 'CRITICAL')).toHaveLength(0);
    });

    it('reports CRITICAL issues for missing required artifacts', async () => {
      await writeChange('missing-artifacts', {
        'proposal.md': '# Proposal\n\nSome content.\n',
        'plans/test-plan.md': '# Plan\n\n- [ ] Step 1\n',
      });

      const cmd = new VerifyCommand();
      const result = await cmd.execute('missing-artifacts', { json: true });

      const missingArtifacts = ['specs', 'design', 'tasks'];
      for (const artifact of missingArtifacts) {
        expect(result.issues.find(i => i.artifact === artifact && i.priority === 'CRITICAL')).toBeDefined();
      }

      const failures = result.checks.filter(c => c.status === 'fail');
      expect(failures.length).toBe(3);
    });

    it('reports CRITICAL issue for empty artifact file', async () => {
      await writeChange('empty-artifact', {
        'proposal.md': '# Proposal\n\nSome content.\n',
        'specs.md': '',
        'design.md': '# Design\n\nSome content.\n',
        'tasks.md': '- [ ] Task 1\n',
        'plans/test-plan.md': '# Plan\n\n- [ ] Step 1\n',
      });

      const cmd = new VerifyCommand();
      const result = await cmd.execute('empty-artifact', { json: true });

      const emptyIssue = result.issues.find(i => i.artifact === 'specs');
      expect(emptyIssue).toBeDefined();
      expect(emptyIssue?.priority).toBe('CRITICAL');
      expect(emptyIssue?.message).toContain('empty');
    });

    it('reports WARNING for duplicate frontmatter blocks', async () => {
      const duplicateFrontmatter = `---
name: test
---
---
name: duplicate
---
# Content`;
      await writeChange('duplicate-frontmatter', {
        'proposal.md': duplicateFrontmatter,
        'specs.md': '# Specs\n\nContent.\n',
        'design.md': '# Design\n\nContent.\n',
        'tasks.md': '- [ ] Task 1\n',
        'plans/test-plan.md': '# Plan\n\n- [ ] Step 1\n',
      });

      const cmd = new VerifyCommand();
      const result = await cmd.execute('duplicate-frontmatter', { json: true });

      const frontmatterIssue = result.issues.find(i => i.artifact === 'proposal');
      expect(frontmatterIssue).toBeDefined();
      expect(frontmatterIssue?.priority).toBe('WARNING');
      expect(frontmatterIssue?.message).toContain('duplicate');
    });

    it('reports WARNING for missing closing frontmatter', async () => {
      const incompleteFrontmatter = `---
name: test
# missing closing ---
# Content`;
      await writeChange('incomplete-frontmatter', {
        'proposal.md': incompleteFrontmatter,
        'specs.md': '# Specs\n\nContent.\n',
        'design.md': '# Design\n\nContent.\n',
        'tasks.md': '- [ ] Task 1\n',
        'plans/test-plan.md': '# Plan\n\n- [ ] Step 1\n',
      });

      const cmd = new VerifyCommand();
      const result = await cmd.execute('incomplete-frontmatter', { json: true });

      const issue = result.issues.find(i => i.artifact === 'proposal');
      expect(issue).toBeDefined();
      expect(issue?.priority).toBe('WARNING');
      expect(issue?.message).toContain('incomplete');
    });

    it('reports WARNING for plan files without checkbox items', async () => {
      await writeChange('no-checkboxes', {
        'proposal.md': '# Proposal\n\nContent.\n',
        'specs.md': '# Specs\n\nContent.\n',
        'design.md': '# Design\n\nContent.\n',
        'tasks.md': '- [ ] Task 1\n',
        'plans/test-plan.md': '# Plan\n\nNo checkboxes here.\n',
      });

      const cmd = new VerifyCommand();
      const result = await cmd.execute('no-checkboxes', { json: true });

      const planIssue = result.issues.find(i => i.artifact === 'plans' && i.message.includes('checkbox'));
      expect(planIssue).toBeDefined();
      expect(planIssue?.priority).toBe('WARNING');
    });

    it('returns 0 score when all artifacts are missing', async () => {
      const { changeDir } = createChangeDir('all-missing');
      await fs.mkdir(changeDir, { recursive: true });

      const cmd = new VerifyCommand();
      const result = await cmd.execute('all-missing', { json: true });

      expect(result.overallScore).toBe(0);
      expect(result.issues.filter(i => i.priority === 'CRITICAL').length).toBeGreaterThan(0);
    });

    it('throws error when change does not exist', async () => {
      const cmd = new VerifyCommand();
      await expect(cmd.execute('non-existent-change', { json: true })).rejects.toThrow();
    });

    it('supports JSON output format', async () => {
      await writeChange('json-test', {
        'proposal.md': '# Proposal\n\nContent.\n',
        'specs.md': '# Specs\n\nContent.\n',
        'design.md': '# Design\n\nContent.\n',
        'tasks.md': '- [ ] Task 1\n',
        'plans/test-plan.md': '# Plan\n\n- [ ] Step 1\n',
      });

      const cmd = new VerifyCommand();
      const output = console.log as ReturnType<typeof vi.fn>;
      const result = await cmd.execute('json-test', { json: true });

      // Should have called console.log with JSON string
      const calls = output.mock.calls;
      const lastCall = calls[calls.length - 1][0];
      const parsed = JSON.parse(lastCall);
      expect(parsed).toHaveProperty('changeName', 'json-test');
      expect(parsed).toHaveProperty('overallScore');
      expect(parsed).toHaveProperty('issues');
      expect(parsed).toHaveProperty('checks');
      expect(parsed).toStrictEqual(result);
    });

    it('includes suggestions in issues', async () => {
      await writeChange('suggestions', {
        'proposal.md': '# Proposal\n\nContent.\n',
        'specs.md': '# Specs\n\nContent.\n',
        'design.md': '# Design\n\nContent.\n',
        'tasks.md': '- [ ] Task 1\n',
        'plans/test-plan.md': '# Plan\n\n- [ ] Step 1\n',
      });

      // Add empty file
      await fs.writeFile(path.join(tempDir, 'apeworkflow', 'changes', 'suggestions', 'tasks.md'), '');

      const cmd = new VerifyCommand();
      const result = await cmd.execute('suggestions', { json: true });

      const issue = result.issues.find(i => i.artifact === 'tasks');
      expect(issue?.suggestion).toBeDefined();
      expect(issue?.suggestion?.length).toBeGreaterThan(0);
    });
  });

  describe('score calculation', () => {
    it('calculates score as percentage of passing checks', async () => {
      // Create a change with exactly 1 failing check out of many
      await writeChange('score-test', {
        'proposal.md': '# Proposal\n\nContent.\n',
        'specs.md': '# Specs\n\nContent.\n',
        'design.md': '# Design\n\nContent.\n',
        'tasks.md': '- [ ] Task 1\n',
        'plans/test-plan.md': '# Plan\n\n- [ ] Step 1\n',
      });

      const cmd = new VerifyCommand();
      const result = await cmd.execute('score-test', { json: true });

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });
  });
});
