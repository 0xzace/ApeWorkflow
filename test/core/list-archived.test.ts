import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { ListCommand } from '../../src/core/list.js';
import { getAvailableChanges } from '../../src/commands/workflow/shared.js';

describe('ListCommand --includeArchived', () => {
  let tempDir: string;
  let originalLog: typeof console.log;
  let logOutput: string[] = [];

  async function writePlan(changeName: string, content: string): Promise<void> {
    const plansDir = path.join(tempDir, 'apeworkflow', 'changes', changeName, 'plans');
    await fs.mkdir(plansDir, { recursive: true });
    await fs.writeFile(path.join(plansDir, `2026-06-17-${changeName}.md`), content);
  }

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `apeworkflow-list-archived-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    originalLog = console.log;
    console.log = (...args: any[]) => {
      logOutput.push(args.join(' '));
    };
    logOutput = [];
  });

  afterEach(async () => {
    console.log = originalLog;
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('execute', () => {
    it('should include archive directory when includeArchived is true', async () => {
      const changesDir = path.join(tempDir, 'apeworkflow', 'changes');
      await fs.mkdir(path.join(changesDir, 'archive'), { recursive: true });
      await writePlan('archive', '- [x] Done\n');
      await fs.mkdir(path.join(changesDir, 'active-change'), { recursive: true });
      await writePlan('active-change', '- [ ] Pending\n');

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir, 'changes', { includeArchived: true });

      const changeLines = logOutput.filter(line =>
        line.includes('archive') || line.includes('active-change')
      );
      expect(changeLines.some(line => line.includes('archive'))).toBe(true);
      expect(changeLines.some(line => line.includes('active-change'))).toBe(true);
    });

    it('should exclude archive directory by default', async () => {
      const changesDir = path.join(tempDir, 'apeworkflow', 'changes');
      await fs.mkdir(path.join(changesDir, 'archive'), { recursive: true });
      await writePlan('archive', '- [x] Done\n');
      await fs.mkdir(path.join(changesDir, 'active-change'), { recursive: true });
      await writePlan('active-change', '- [ ] Pending\n');

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir, 'changes');

      const archiveLines = logOutput.filter(line =>
        line.includes('archive') && !line.includes('apeworkflow archive') && !line.includes('Commands')
      );
      expect(archiveLines.length).toBe(0);
    });

    it('should mark archived changes in JSON output when includeArchived is true', async () => {
      const changesDir = path.join(tempDir, 'apeworkflow', 'changes');
      await fs.mkdir(path.join(changesDir, 'archive'), { recursive: true });
      await writePlan('archive', '- [x] Done\n');
      await fs.mkdir(path.join(changesDir, 'active-change'), { recursive: true });
      await writePlan('active-change', '- [ ] Pending\n');

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir, 'changes', { includeArchived: true, json: true });

      const payload = JSON.parse(logOutput.at(-1) ?? '{}');
      const archiveEntry = payload.changes.find((c: any) => c.name === 'archive');
      const activeEntry = payload.changes.find((c: any) => c.name === 'active-change');
      expect(archiveEntry).toBeDefined();
      expect(archiveEntry.archived).toBe(true);
      expect(activeEntry.archived).toBe(false);
    });

    it('should not include archived field in JSON when includeArchived is false', async () => {
      const changesDir = path.join(tempDir, 'apeworkflow', 'changes');
      await fs.mkdir(path.join(changesDir, 'archive'), { recursive: true });
      await writePlan('archive', '- [x] Done\n');

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir, 'changes', { json: true });

      const payload = JSON.parse(logOutput.at(-1) ?? '{}');
      const archiveEntry = payload.changes.find((c: any) => c.name === 'archive');
      expect(archiveEntry).toBeUndefined();
    });

    it('should show archived tag in text output for date-prefixed names', async () => {
      const changesDir = path.join(tempDir, 'apeworkflow', 'changes');
      await fs.mkdir(path.join(changesDir, 'archive'), { recursive: true });
      await writePlan('archive', '- [x] Done\n');
      await fs.mkdir(path.join(changesDir, '2026-01-15-old-change'), { recursive: true });
      await writePlan('2026-01-15-old-change', '- [x] Done\n');
      await fs.mkdir(path.join(changesDir, 'active-change'), { recursive: true });
      await writePlan('active-change', '- [ ] Pending\n');

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir, 'changes', { includeArchived: true });

      const archivedLines = logOutput.filter(line => line.includes('[archived]'));
      expect(archivedLines.length).toBe(2);
      const activeLines = logOutput.filter(line => line.includes('active-change') && !line.includes('[archived]'));
      expect(activeLines.length).toBeGreaterThan(0);
    });

    it('should show archived tag for archive-prefixed names', async () => {
      const changesDir = path.join(tempDir, 'apeworkflow', 'changes');
      await fs.mkdir(path.join(changesDir, 'archive'), { recursive: true });
      await writePlan('archive', '- [x] Done\n');
      await fs.mkdir(path.join(changesDir, 'archive-something'), { recursive: true });
      await writePlan('archive-something', '- [x] Done\n');

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir, 'changes', { includeArchived: true });

      const archivedLines = logOutput.filter(line => line.includes('[archived]'));
      expect(archivedLines.length).toBe(2);
    });
  });
});

describe('getAvailableChanges --includeArchived', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `apeworkflow-shared-archived-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should exclude archive by default', async () => {
    const changesDir = path.join(tempDir, 'apeworkflow', 'changes');
    await fs.mkdir(changesDir, { recursive: true });
    await fs.mkdir(path.join(changesDir, 'active'), { recursive: true });
    await fs.mkdir(path.join(changesDir, 'archive'), { recursive: true });

    const result = await getAvailableChanges(tempDir, changesDir);
    expect(result).toEqual(['active']);
  });

  it('should include archive when includeArchived is true', async () => {
    const changesDir = path.join(tempDir, 'apeworkflow', 'changes');
    await fs.mkdir(changesDir, { recursive: true });
    await fs.mkdir(path.join(changesDir, 'active'), { recursive: true });
    await fs.mkdir(path.join(changesDir, 'archive'), { recursive: true });

    const result = await getAvailableChanges(tempDir, changesDir, true);
    expect(result).toEqual(['active', 'archive']);
  });
});
