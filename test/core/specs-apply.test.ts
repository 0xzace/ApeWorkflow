import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  buildSpecSkeleton,
  findSpecUpdates,
  buildUpdatedSpec,
} from '../../src/core/specs-apply.js';
import { Validator } from '../../src/core/validation/validator.js';

describe('specs-apply', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-specs-apply-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // -----------------------------------------------------------------------
  // buildSpecSkeleton
  // -----------------------------------------------------------------------

  describe('buildSpecSkeleton', () => {
    it('生成包含能力名称和变更名的骨架 spec', () => {
      const result = buildSpecSkeleton('auth', 'add-oauth');
      expect(result).toContain('# auth Specification');
      expect(result).toContain('created by archiving change add-oauth');
      expect(result).toContain('## Purpose');
      expect(result).toContain('## Requirements');
    });

    it('骨架 spec 包含占位 Purpose 文本', () => {
      const result = buildSpecSkeleton('billing', 'fix-invoicing');
      expect(result).toContain('TBD - created by archiving change fix-invoicing');
      expect(result).toContain('Update Purpose after archive');
    });
  });

  // -----------------------------------------------------------------------
  // findSpecUpdates
  // -----------------------------------------------------------------------

  describe('findSpecUpdates', () => {
    function setupWithSpecs(specNames: string[]): { changeSpecsDir: string; mainSpecsDir: string } {
      const changeSpecsDir = path.join(tempDir, 'apeworkflow', 'changes', 'my-change', 'specs');
      const mainSpecsDir = path.join(tempDir, 'apeworkflow', 'specs');

      for (const name of specNames) {
        const changeSpecFolder = path.join(changeSpecsDir, name);
        const mainSpecFolder = path.join(mainSpecsDir, name);
        fs.mkdirSync(path.join(changeSpecFolder, ''), { recursive: true });
        fs.mkdirSync(path.join(mainSpecFolder, ''), { recursive: true });
        fs.writeFileSync(path.join(changeSpecFolder, 'spec.md'), `# ${name}`);
      }

      return { changeSpecsDir, mainSpecsDir };
    }

    it('发现变更中的 spec 更新', async () => {
      const { changeSpecsDir, mainSpecsDir } = setupWithSpecs(['auth', 'billing']);
      const updates = await findSpecUpdates(path.join(tempDir, 'apeworkflow', 'changes', 'my-change'), mainSpecsDir);
      expect(updates).toHaveLength(2);
      expect(updates[0].source).toContain('auth');
      expect(updates[1].source).toContain('billing');
      // Both should not exist in main yet (empty content = no target file)
      expect(updates.every((u) => !u.exists)).toBe(true);
    });

    it('跳过没有 spec.md 的目录', async () => {
      const changeSpecsDir = path.join(tempDir, 'apeworkflow', 'changes', 'my-change', 'specs');
      const mainSpecsDir = path.join(tempDir, 'apeworkflow', 'specs');
      fs.mkdirSync(path.join(changeSpecsDir, 'auth'), { recursive: true });
      // No spec.md written - should be skipped
      const updates = await findSpecUpdates(path.join(tempDir, 'apeworkflow', 'changes', 'my-change'), mainSpecsDir);
      expect(updates).toHaveLength(0);
    });

    it('报告已存在的 spec', async () => {
      const { changeSpecsDir, mainSpecsDir } = setupWithSpecs(['auth']);
      // Create target file
      fs.writeFileSync(path.join(mainSpecsDir, 'auth', 'spec.md'), '# Existing auth spec');
      const updates = await findSpecUpdates(path.join(tempDir, 'apeworkflow', 'changes', 'my-change'), mainSpecsDir);
      expect(updates).toHaveLength(1);
      expect(updates[0].exists).toBe(true);
    });

    it('空变更目录返回空数组', async () => {
      const mainSpecsDir = path.join(tempDir, 'apeworkflow', 'specs');
      const changesPath = path.join(tempDir, 'apeworkflow', 'changes', 'empty-change');
      fs.mkdirSync(changesPath, { recursive: true });
      const updates = await findSpecUpdates(changesPath, mainSpecsDir);
      expect(updates).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // buildUpdatedSpec
  // -----------------------------------------------------------------------

  function writeBasicSpec(specPath: string, requirements: string): void {
    const dir = path.dirname(specPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      specPath,
      `# Capability\n\n## Purpose\nTest.\n\n## Requirements\n${requirements}\n`
    );
  }

  function writeChangeSpec(specPath: string, content: string): void {
    const dir = path.dirname(specPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(specPath, content);
  }

  describe('buildUpdatedSpec', () => {
    it('对不存在的目标 spec 只允许 ADDED', async () => {
      const update = {
        source: path.join(tempDir, 'source.md'),
        target: path.join(tempDir, 'target.md'),
        exists: false,
      };

      writeChangeSpec(update.source, `# auth\n\n## ADDED Requirements\n\n### Requirement: Login\n- Users can login.\n`);

      const result = await buildUpdatedSpec(update, 'my-change');
      expect(result.counts.added).toBe(1);
      expect(result.rebuilt).toContain('### Requirement: Login');
      expect(result.rebuilt).toContain('Users can login');
    });

    it('对不存在的目标 spec 拒绝 MODIFIED', async () => {
      const update = {
        source: path.join(tempDir, 'source.md'),
        target: path.join(tempDir, 'target.md'),
        exists: false,
      };

      writeChangeSpec(update.source, `# auth\n\n## MODIFIED Requirements\n\n### Requirement: Login\n- Modified login.\n`);

      await expect(buildUpdatedSpec(update, 'my-change')).rejects.toThrow(
        'MODIFIED and RENAMED operations require an existing spec'
      );
    });

    it('对不存在的目标 spec 忽略 REMOVED 并警告', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const update = {
        source: path.join(tempDir, 'source.md'),
        target: path.join(tempDir, 'target.md'),
        exists: false,
      };

      writeChangeSpec(update.source, `# auth\n\n## REMOVED Requirements\n\n### Requirement: Legacy\n`);

      const result = await buildUpdatedSpec(update, 'my-change');
      expect(result.counts.removed).toBe(1);
      expect(result.counts.added).toBe(0);
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('REMOVED requirement(s) ignored for new spec')
      );

      logSpy.mockRestore();
    });

    it('在目标 spec 不存在但 MODIFIED 和 RENAMED 都有时拒绝', async () => {
      const update = {
        source: path.join(tempDir, 'source.md'),
        target: path.join(tempDir, 'target.md'),
        exists: false,
      };

      writeChangeSpec(update.source, `# auth\n\n## MODIFIED Requirements\n\n### Requirement: Login\n- Modified.\n\n## RENAMED Requirements\n\n- FROM: ### Requirement: OldName\n- TO: ### Requirement: NewName\n`);

      await expect(buildUpdatedSpec(update, 'my-change')).rejects.toThrow(
        'MODIFIED and RENAMED operations require an existing spec'
      );
    });

    it('报告没有操作的空 delta', async () => {
      const update = {
        source: path.join(tempDir, 'source.md'),
        target: path.join(tempDir, 'target.md'),
        exists: true,
      };
      writeBasicSpec(update.target, '');

      writeChangeSpec(update.source, '# auth\n\nNo operations here.\n');

      await expect(buildUpdatedSpec(update, 'my-change')).rejects.toThrow(
        'Delta parsing found no operations'
      );
    });
  });
});
