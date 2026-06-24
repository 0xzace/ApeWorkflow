import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { ListCommand } from '../../src/core/list.js';

describe('ListCommand', () => {
  let tempDir: string;
  let originalLog: typeof console.log;
  let logOutput: string[] = [];

  async function writePlan(changeName: string, content: string): Promise<void> {
    const plansDir = path.join(tempDir, 'apeworkflow', 'changes', changeName, 'plans');
    await fs.mkdir(plansDir, { recursive: true });
    await fs.writeFile(path.join(plansDir, `2026-06-17-${changeName}.md`), content);
  }

  beforeEach(async () => {
    // Create temp directory
    tempDir = path.join(os.tmpdir(), `apeworkflow-list-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // Mock console.log to capture output
    originalLog = console.log;
    console.log = (...args: any[]) => {
      logOutput.push(args.join(' '));
    };
    logOutput = [];
  });

  afterEach(async () => {
    // Restore console.log
    console.log = originalLog;

    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('execute', () => {
    it('should handle missing apeworkflow/changes directory', async () => {
      const listCommand = new ListCommand();
      
      await expect(listCommand.execute(tempDir, 'changes')).rejects.toThrow(
        "No ApeWorkflow changes directory found. Run 'apeworkflow init' first."
      );
    });

    it('should output changes as JSON when requested', async () => {
      const changesDir = path.join(tempDir, 'apeworkflow', 'changes');
      await fs.mkdir(path.join(changesDir, 'json-change'), { recursive: true });
      await writePlan('json-change', '- [x] Done\n- [ ] Pending\n');

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir, 'changes', { json: true });

      const payload = JSON.parse(logOutput.at(-1) ?? '{}');
      expect(payload.changes).toHaveLength(1);
      expect(payload.changes[0]).toEqual(
        expect.objectContaining({
          name: 'json-change',
          completedTasks: 1,
          totalTasks: 2,
          status: 'in-progress',
        })
      );
    });

    it('should handle empty changes directory', async () => {
      const changesDir = path.join(tempDir, 'apeworkflow', 'changes');
      await fs.mkdir(changesDir, { recursive: true });

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir, 'changes');

      expect(logOutput).toEqual(['No active changes found.']);
    });

    it('should exclude archive directory', async () => {
      const changesDir = path.join(tempDir, 'apeworkflow', 'changes');
      await fs.mkdir(path.join(changesDir, 'archive'), { recursive: true });
      await fs.mkdir(path.join(changesDir, 'my-change'), { recursive: true });

      // Create a plan file with some tasks
      await writePlan('my-change', '- [x] Task 1\n- [ ] Task 2\n');

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir, 'changes');

      // Check that no change line includes the archive directory name
      const changeLines = logOutput.filter(line =>
        line.includes('my-change') || line.includes('Tasks') || line.includes('Complete') || line.includes('No tasks')
      );
      expect(changeLines.some(line => line.includes('archive') && line.includes('my-change'))).toBe(false);
    });

    it('should count tasks correctly', async () => {
      const changesDir = path.join(tempDir, 'apeworkflow', 'changes');
      await fs.mkdir(path.join(changesDir, 'test-change'), { recursive: true });
      
      await writePlan(
        'test-change',
        `# Tasks
- [x] Completed task 1
- [x] Completed task 2
- [ ] Incomplete task 1
- [ ] Incomplete task 2
- [ ] Incomplete task 3
Regular text that should be ignored
`
      );

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir, 'changes');

      expect(logOutput.some(line => line.includes('2/5 tasks'))).toBe(true);
    });

    it('should show complete status for fully completed changes', async () => {
      const changesDir = path.join(tempDir, 'apeworkflow', 'changes');
      await fs.mkdir(path.join(changesDir, 'completed-change'), { recursive: true });
      
      await writePlan('completed-change', '- [x] Task 1\n- [x] Task 2\n- [x] Task 3\n');

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir, 'changes');

      expect(logOutput.some(line => line.includes('✓ Complete'))).toBe(true);
    });

    it('should handle changes without plan files', async () => {
      const changesDir = path.join(tempDir, 'apeworkflow', 'changes');
      await fs.mkdir(path.join(changesDir, 'no-tasks'), { recursive: true });

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir, 'changes');

      expect(logOutput.some(line => line.includes('no-tasks') && line.includes('No tasks'))).toBe(true);
    });

    it('should sort changes alphabetically when sort=name', async () => {
      const changesDir = path.join(tempDir, 'apeworkflow', 'changes');
      await fs.mkdir(path.join(changesDir, 'zebra'), { recursive: true });
      await fs.mkdir(path.join(changesDir, 'alpha'), { recursive: true });
      await fs.mkdir(path.join(changesDir, 'middle'), { recursive: true });

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir, 'changes', { sort: 'name' });

      const changeLines = logOutput.filter(line =>
        line.includes('alpha') || line.includes('middle') || line.includes('zebra')
      );

      expect(changeLines[0]).toContain('alpha');
      expect(changeLines[1]).toContain('middle');
      expect(changeLines[2]).toContain('zebra');
    });

    it('should handle multiple changes with various states', async () => {
      const changesDir = path.join(tempDir, 'apeworkflow', 'changes');
      
      // Complete change
      await fs.mkdir(path.join(changesDir, 'completed'), { recursive: true });
      await writePlan('completed', '- [x] Task 1\n- [x] Task 2\n');

      // Partial change
      await fs.mkdir(path.join(changesDir, 'partial'), { recursive: true });
      await writePlan('partial', '- [x] Done\n- [ ] Not done\n- [ ] Also not done\n');

      // No tasks
      await fs.mkdir(path.join(changesDir, 'no-tasks'), { recursive: true });

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir);

      expect(logOutput).toContain('Changes:');
      expect(logOutput.some(line => line.includes('completed') && line.includes('✓ Complete'))).toBe(true);
      expect(logOutput.some(line => line.includes('partial') && line.includes('1/3 tasks'))).toBe(true);
      expect(logOutput.some(line => line.includes('no-tasks') && line.includes('No tasks'))).toBe(true);
    });

    it('should list specs and fall back to zero requirements for unreadable specs', async () => {
      const specsDir = path.join(tempDir, 'apeworkflow', 'specs');
      await fs.mkdir(path.join(specsDir, 'auth'), { recursive: true });
      await fs.mkdir(path.join(specsDir, 'broken'), { recursive: true });
      await fs.writeFile(
        path.join(specsDir, 'auth', 'spec.md'),
        [
          '## Purpose',
          'Describe authentication.',
          '',
          '## Requirements',
          '',
          '### Requirement: Login',
          'Login must work.',
        ].join('\n')
      );
      await fs.writeFile(
        path.join(specsDir, 'broken', 'spec.md'),
        '# Broken spec without required sections\n'
      );

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir, 'specs');

      expect(logOutput[0]).toBe('Specs:');
      expect(logOutput.some((line) => line.includes('auth') && line.includes('requirements 1'))).toBe(true);
      expect(logOutput.some((line) => line.includes('broken') && line.includes('requirements 0'))).toBe(true);
    });

    it('should handle missing specs directory', async () => {
      const listCommand = new ListCommand();

      await listCommand.execute(tempDir, 'specs');

      expect(logOutput).toEqual(['No specs found.']);
    });
  });
});
