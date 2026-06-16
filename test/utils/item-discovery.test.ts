import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { getActiveChangeIds, getSpecIds, getArchivedChangeIds } from '../../src/utils/item-discovery.js';

describe('item-discovery', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-discovery-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // -----------------------------------------------------------------------
  // getActiveChangeIds
  // -----------------------------------------------------------------------

  describe('getActiveChangeIds', () => {
    it('从变更目录读取有 proposal.md 的变更', async () => {
      const changesPath = path.join(tempDir, 'apeworkflow', 'changes');
      fs.mkdirSync(path.join(changesPath, 'add-login'), { recursive: true });
      fs.writeFileSync(path.join(changesPath, 'add-login', 'proposal.md'), '# Add Login');

      fs.mkdirSync(path.join(changesPath, 'fix-bug'), { recursive: true });
      fs.writeFileSync(path.join(changesPath, 'fix-bug', 'proposal.md'), '# Fix Bug');

      // 没有 proposal.md 的目录应被跳过
      fs.mkdirSync(path.join(changesPath, 'no-proposal'), { recursive: true });
      fs.writeFileSync(path.join(changesPath, 'no-proposal', 'design.md'), '# Design');

      const result = await getActiveChangeIds(tempDir);
      expect(result).toEqual(['add-login', 'fix-bug']);
    });

    it('跳过隐藏目录', async () => {
      const changesPath = path.join(tempDir, 'apeworkflow', 'changes');
      fs.mkdirSync(changesPath, { recursive: true });
      fs.mkdirSync(path.join(changesPath, '.hidden'), { recursive: true });
      fs.writeFileSync(path.join(changesPath, '.hidden', 'proposal.md'), '# Hidden');
      fs.mkdirSync(path.join(changesPath, 'visible'), { recursive: true });
      fs.writeFileSync(path.join(changesPath, 'visible', 'proposal.md'), '# Visible');

      const result = await getActiveChangeIds(tempDir);
      expect(result).toEqual(['visible']);
    });

    it('跳过 archive 目录', async () => {
      const changesPath = path.join(tempDir, 'apeworkflow', 'changes');
      fs.mkdirSync(changesPath, { recursive: true });
      fs.mkdirSync(path.join(changesPath, 'archive'), { recursive: true });
      fs.writeFileSync(path.join(changesPath, 'archive', 'proposal.md'), '# Archived');
      fs.mkdirSync(path.join(changesPath, 'active'), { recursive: true });
      fs.writeFileSync(path.join(changesPath, 'active', 'proposal.md'), '# Active');

      const result = await getActiveChangeIds(tempDir);
      expect(result).toEqual(['active']);
    });

    it('目录不存在时返回空数组', async () => {
      const result = await getActiveChangeIds('/nonexistent-path-12345');
      expect(result).toEqual([]);
    });

    it('变更目录存在但没有提案时返回空数组', async () => {
      const changesPath = path.join(tempDir, 'apeworkflow', 'changes');
      fs.mkdirSync(changesPath, { recursive: true });
      // 空目录
      const result = await getActiveChangeIds(tempDir);
      expect(result).toEqual([]);
    });

    it('按字母顺序返回结果', async () => {
      const changesPath = path.join(tempDir, 'apeworkflow', 'changes');
      fs.mkdirSync(changesPath, { recursive: true });
      for (const name of ['zebra', 'alpha', 'middle']) {
        fs.mkdirSync(path.join(changesPath, name), { recursive: true });
        fs.writeFileSync(path.join(changesPath, name, 'proposal.md'), `# ${name}`);
      }

      const result = await getActiveChangeIds(tempDir);
      expect(result).toEqual(['alpha', 'middle', 'zebra']);
    });
  });

  // -----------------------------------------------------------------------
  // getSpecIds
  // -----------------------------------------------------------------------

  describe('getSpecIds', () => {
    it('读取有 spec.md 的能力', async () => {
      const specsPath = path.join(tempDir, 'apeworkflow', 'specs');
      fs.mkdirSync(path.join(specsPath, 'auth'), { recursive: true });
      fs.writeFileSync(path.join(specsPath, 'auth', 'spec.md'), '# Auth spec');

      fs.mkdirSync(path.join(specsPath, 'billing'), { recursive: true });
      fs.writeFileSync(path.join(specsPath, 'billing', 'spec.md'), '# Billing spec');

      // 没有 spec.md 的目录应被跳过
      fs.mkdirSync(path.join(specsPath, 'no-spec'), { recursive: true });

      const result = await getSpecIds(tempDir);
      expect(result).toEqual(['auth', 'billing']);
    });

    it('跳过隐藏目录', async () => {
      const specsPath = path.join(tempDir, 'apeworkflow', 'specs');
      fs.mkdirSync(specsPath, { recursive: true });
      fs.mkdirSync(path.join(specsPath, '.hidden'), { recursive: true });
      fs.writeFileSync(path.join(specsPath, '.hidden', 'spec.md'), '# Hidden');
      fs.mkdirSync(path.join(specsPath, 'visible'), { recursive: true });
      fs.writeFileSync(path.join(specsPath, 'visible', 'spec.md'), '# Visible');

      const result = await getSpecIds(tempDir);
      expect(result).toEqual(['visible']);
    });

    it('specs 目录不存在时返回空数组', async () => {
      const result = await getSpecIds('/nonexistent-path-12345');
      expect(result).toEqual([]);
    });

    it('按字母顺序返回结果', async () => {
      const specsPath = path.join(tempDir, 'apeworkflow', 'specs');
      fs.mkdirSync(specsPath, { recursive: true });
      for (const name of ['zebra', 'alpha', 'middle']) {
        fs.mkdirSync(path.join(specsPath, name), { recursive: true });
        fs.writeFileSync(path.join(specsPath, name, 'spec.md'), `# ${name}`);
      }

      const result = await getSpecIds(tempDir);
      expect(result).toEqual(['alpha', 'middle', 'zebra']);
    });
  });

  // -----------------------------------------------------------------------
  // getArchivedChangeIds
  // -----------------------------------------------------------------------

  describe('getArchivedChangeIds', () => {
    it('从归档目录读取有 proposal.md 的变更', async () => {
      const archivePath = path.join(tempDir, 'apeworkflow', 'changes', 'archive');
      fs.mkdirSync(path.join(archivePath, 'done-feature'), { recursive: true });
      fs.writeFileSync(path.join(archivePath, 'done-feature', 'proposal.md'), '# Done');

      fs.mkdirSync(path.join(archivePath, 'no-proposal'), { recursive: true });

      const result = await getArchivedChangeIds(tempDir);
      expect(result).toEqual(['done-feature']);
    });

    it('跳过隐藏归档目录', async () => {
      const archivePath = path.join(tempDir, 'apeworkflow', 'changes', 'archive');
      fs.mkdirSync(archivePath, { recursive: true });
      fs.mkdirSync(path.join(archivePath, '.hidden'), { recursive: true });
      fs.writeFileSync(path.join(archivePath, '.hidden', 'proposal.md'), '# Hidden');
      fs.mkdirSync(path.join(archivePath, 'visible'), { recursive: true });
      fs.writeFileSync(path.join(archivePath, 'visible', 'proposal.md'), '# Visible');

      const result = await getArchivedChangeIds(tempDir);
      expect(result).toEqual(['visible']);
    });

    it('archive 目录不存在时返回空数组', async () => {
      const result = await getArchivedChangeIds('/nonexistent-path-12345');
      expect(result).toEqual([]);
    });

    it('归档目录存在但没有提案时返回空数组', async () => {
      const archivePath = path.join(tempDir, 'apeworkflow', 'changes', 'archive');
      fs.mkdirSync(archivePath, { recursive: true });
      // 空目录
      const result = await getArchivedChangeIds(tempDir);
      expect(result).toEqual([]);
    });

    it('按字母顺序返回结果', async () => {
      const archivePath = path.join(tempDir, 'apeworkflow', 'changes', 'archive');
      fs.mkdirSync(archivePath, { recursive: true });
      for (const name of ['zebra', 'alpha', 'middle']) {
        fs.mkdirSync(path.join(archivePath, name), { recursive: true });
        fs.writeFileSync(path.join(archivePath, name, 'proposal.md'), `# ${name}`);
      }

      const result = await getArchivedChangeIds(tempDir);
      expect(result).toEqual(['alpha', 'middle', 'zebra']);
    });
  });
});
