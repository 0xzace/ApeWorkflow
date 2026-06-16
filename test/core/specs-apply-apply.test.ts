import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  applySpecs,
  findSpecUpdates,
  buildSpecSkeleton,
} from '../../src/core/specs-apply.js';
import { parseDeltaSpec, extractRequirementsSection } from '../../../src/core/parsers/requirement-blocks.js';

describe('specs-apply — applySpecs', () => {
  let tempDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-apply-'));
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // -----------------------------------------------------------------------
  // 辅助函数
  // -----------------------------------------------------------------------

  function setupProject(changeName: string, mainSpecs: Record<string, string>, changeSpecs: Record<string, string>): void {
    // Create main specs
    for (const [capability, content] of Object.entries(mainSpecs)) {
      const specDir = path.join(tempDir, 'apeworkflow', 'specs', capability);
      fs.mkdirSync(specDir, { recursive: true });
      fs.writeFileSync(path.join(specDir, 'spec.md'), content);
    }

    // Create change directory with specs
    const changeSpecsDir = path.join(tempDir, 'apeworkflow', 'changes', changeName, 'specs');
    for (const [capability, content] of Object.entries(changeSpecs)) {
      const specDir = path.join(changeSpecsDir, capability);
      fs.mkdirSync(specDir, { recursive: true });
      fs.writeFileSync(path.join(specDir, 'spec.md'), content);
    }

    // Also create a minimal proposal.md so the change "exists"
    const changeDir = path.join(tempDir, 'apeworkflow', 'changes', changeName);
    fs.mkdirSync(changeDir, { recursive: true });
    fs.writeFileSync(path.join(changeDir, 'proposal.md'), '# Proposal');
  }

  function makeBaseSpec(capability: string, requirements: string): string {
    return `# ${capability} Specification\n\n## Purpose\nTest spec.\n\n## Requirements\n${requirements}\n`;
  }

  function makeDeltaSpec(capability: string, delta: string): string {
    return `# ${capability} Delta\n\n${delta}\n`;
  }

  // -----------------------------------------------------------------------
  // findSpecUpdates
  // -----------------------------------------------------------------------

  describe('findSpecUpdates', () => {
    it('发现变更中的 spec 目录', async () => {
      setupProject('my-change', {}, { auth: 'some content' });

      const mainSpecsDir = path.join(tempDir, 'apeworkflow', 'specs');
      const updates = await findSpecUpdates(
        path.join(tempDir, 'apeworkflow', 'changes', 'my-change'),
        mainSpecsDir
      );

      expect(updates).toHaveLength(1);
      expect(updates[0].source).toContain('auth');
    });

    it('没有 spec 目录的变更返回空数组', async () => {
      const changeDir = path.join(tempDir, 'apeworkflow', 'changes', 'empty-change');
      fs.mkdirSync(changeDir, { recursive: true });
      fs.writeFileSync(path.join(changeDir, 'proposal.md'), '# Empty');

      const updates = await findSpecUpdates(changeDir, path.join(tempDir, 'apeworkflow', 'specs'));
      expect(updates).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // applySpecs — dryRun
  // -----------------------------------------------------------------------

  describe('applySpecs — dryRun', () => {
    it('dryRun 模式不写入文件，但返回正确计数', async () => {
      const baseAuth = makeBaseSpec('auth', '### Requirement: Login\n- Users SHALL login.\n\n#### Scenario: Happy path\n- Given user is on login page');
      const deltaAuth = makeDeltaSpec('auth', `## ADDED Requirements

### Requirement: Logout
- Users SHALL logout.

#### Scenario: Happy path
- Given user is logged in
`);

      setupProject('my-change', { auth: baseAuth }, { auth: deltaAuth });

      const result = await applySpecs(tempDir, 'my-change', { dryRun: true, skipValidation: true, silent: true });

      expect(result.noChanges).toBe(false);
      expect(result.totals.added).toBe(1);
      expect(result.totals.modified).toBe(0);
      expect(result.totals.removed).toBe(0);
      expect(result.totals.renamed).toBe(0);

      // 原始文件不应被修改（dryRun）
      const existingContent = fs.readFileSync(path.join(tempDir, 'apeworkflow', 'specs', 'auth', 'spec.md'), 'utf-8');
      expect(existingContent).toBe(baseAuth);
    });

    it('没有 spec 更新时返回 noChanges', async () => {
      setupProject('my-change', {}, {});

      const result = await applySpecs(tempDir, 'my-change', { dryRun: true, silent: true });

      expect(result.noChanges).toBe(true);
      expect(result.capabilities).toHaveLength(0);
      expect(result.totals).toEqual({ added: 0, modified: 0, removed: 0, renamed: 0 });
    });

    it('变更不存在时抛出错误', async () => {
      await expect(
        applySpecs(tempDir, 'non-existent-change', { dryRun: true, silent: true })
      ).rejects.toThrow("Change 'non-existent-change' not found");
    });
  });

  // -----------------------------------------------------------------------
  // applySpecs — 实际写入
  // -----------------------------------------------------------------------

  describe('applySpecs — 实际写入', () => {
    it('应用 ADDED 到现有 spec', async () => {
      const baseAuth = makeBaseSpec('auth', '### Requirement: Login\n- Users SHALL login.\n\n#### Scenario: Happy path\n- Given user is on login page');
      const deltaAuth = makeDeltaSpec('auth', `## ADDED Requirements

### Requirement: Logout
- Users SHALL logout.

#### Scenario: Happy path
- Given user is logged in
`);

      setupProject('my-change', { auth: baseAuth }, { auth: deltaAuth });

      const result = await applySpecs(tempDir, 'my-change', { skipValidation: true, silent: true });

      expect(result.totals.added).toBe(1);

      // 文件应该被修改
      const updatedContent = fs.readFileSync(path.join(tempDir, 'apeworkflow', 'specs', 'auth', 'spec.md'), 'utf-8');
      expect(updatedContent).toContain('### Requirement: Login');
      expect(updatedContent).toContain('### Requirement: Logout');
    });

    it('应用多个能力的更新', async () => {
      const baseAuth = makeBaseSpec('auth', '### Requirement: Login\n- Users SHALL login.\n\n#### Scenario: Happy path\n- Given user is on login page');
      const baseBilling = makeBaseSpec('billing', '### Requirement: Invoicing\n- Users SHALL generate invoices.\n\n#### Scenario: Happy path\n- Given user is on billing page');

      const deltaAuth = makeDeltaSpec('auth', `## ADDED Requirements

### Requirement: Logout
- Users SHALL logout.

#### Scenario: Happy path
- Given user is logged in
`);
      const deltaBilling = makeDeltaSpec('billing', `## MODIFIED Requirements

### Requirement: Invoicing
- Users SHALL generate and send invoices.

#### Scenario: Happy path
- Given user is on billing page
`);

      setupProject('my-change', { auth: baseAuth, billing: baseBilling }, { auth: deltaAuth, billing: deltaBilling });

      const result = await applySpecs(tempDir, 'my-change', { skipValidation: true, silent: true });

      expect(result.capabilities).toHaveLength(2);
      expect(result.totals.added).toBe(1);
      expect(result.totals.modified).toBe(1);

      const authContent = fs.readFileSync(path.join(tempDir, 'apeworkflow', 'specs', 'auth', 'spec.md'), 'utf-8');
      expect(authContent).toContain('### Requirement: Logout');

      const billingContent = fs.readFileSync(path.join(tempDir, 'apeworkflow', 'specs', 'billing', 'spec.md'), 'utf-8');
      expect(billingContent).toContain('generate and send invoices');
    });
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
});
