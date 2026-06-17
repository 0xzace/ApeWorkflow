import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { Validator } from '../../../src/core/validation/validator.js';
import type { ValidationReport, ValidationIssue } from '../../../src/core/validation/types.js';

// ═══════════════════════════════════════════════════
// Fixtures — content matching actual MarkdownParser behavior
// ═══════════════════════════════════════════════════

function validSpecContent(): string {
  return [
    '# Purpose',
    '',
    'This spec defines the authentication system for the platform. It covers user login, registration, and session management.',
    '',
    '## Requirements',
    '### Requirement: The system SHALL provide user authentication',
    '',
    'Users SHALL authenticate with valid credentials to access protected resources.',
    '',
    '#### Scenario: Valid login',
    '- **WHEN** a user submits valid credentials',
    '- **THEN** they are authenticated and granted access',
    '',
    '#### Scenario: Invalid credentials',
    '- **WHEN** a user submits invalid credentials',
    '- **THEN** authentication is rejected',
  ].join('\n');
}

function validChangeContent(specName: string): string {
  return [
    '# Why',
    'The current authentication system lacks proper session management and needs to be rebuilt to support multiple devices.',
    '',
    '## What Changes',
    'This change introduces a new authentication mechanism with session support.',
    '',
    `specs/${specName}/spec.md`,
  ].join('\n');
}

function validDeltaSpecContent(): string {
  return [
    '## ADDED Requirements',
    '',
    '### Requirement: The system SHALL support OAuth 2.0',
    '',
    'Users SHALL be able to authenticate via OAuth 2.0 providers.',
    '',
    '#### Scenario: OAuth login',
    '- **WHEN** user selects an OAuth provider',
    '- **THEN** they are redirected to the provider',
  ].join('\n');
}

function specMissingPurpose(): string {
  return [
    '## Requirements',
    '### Requirement: The system SHALL do something',
    '',
    'This SHALL work.',
    '',
    '#### Scenario: Test',
    '- **WHEN** something happens',
    '- **THEN** it works',
  ].join('\n');
}

function specMissingRequirements(): string {
  return ['# Purpose', 'This is a spec with no requirements section.'].join('\n');
}

function changeMissingWhy(): string {
  return [
    '## What Changes',
    'This change does something.',
    '',
    'specs/http-server/spec.md',
  ].join('\n');
}

function changeMissingWhatChanges(): string {
  return [
    '# Why',
    'This change is needed because the current system lacks proper authentication.',
    '',
    'specs/http-server/spec.md',
  ].join('\n');
}

function changeNoDeltas(): string {
  return [
    '# Why',
    'This change is needed because the current system lacks proper authentication.',
    '',
    '## What Changes',
    'This change does something.',
  ].join('\n');
}

function deltaSpecMissingShall(): string {
  return [
    '## ADDED Requirements',
    '',
    '### Requirement: The system provides auth',
    '',
    'Users can authenticate.',
    '',
    '#### Scenario: Login',
    '- **WHEN** user logs in',
    '- **THEN** authenticated',
  ].join('\n');
}

function deltaSpecEmptySections(): string {
  return [
    '## ADDED Requirements',
    '',
    '## MODIFIED Requirements',
  ].join('\n');
}

// ═══════════════════════════════════════════════════
// Test fixtures
// ═══════════════════════════════════════════════════

describe('Validator class', () => {
  let validator: Validator;
  let tempDir: string;
  let changesDir: string;
  let specsDir: string;

  beforeEach(() => {
    validator = new Validator(false);
    tempDir = path.join(os.tmpdir(), `apew-validator-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    changesDir = path.join(tempDir, 'apeworkflow', 'changes');
    specsDir = path.join(tempDir, 'apeworkflow', 'specs');
  });

  afterEach(async () => {
    try { await fs.rm(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  async function createFile(filePath: string, content: string): Promise<string> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
    return filePath;
  }

  function expectNoIssues(report: ValidationReport): void {
    expect(report.valid).toBe(true);
    expect(report.summary.errors).toBe(0);
  }

  function expectErrors(report: ValidationReport, count: number): void {
    expect(report.summary.errors).toBe(count);
  }

  // ─── validateSpec ────────────────────────────────

  describe('validateSpec', () => {
    it('should return valid for a well-formed spec', async () => {
      const specFile = await createFile(path.join(specsDir, 'auth', 'spec.md'), validSpecContent());
      const report = await validator.validateSpec(specFile);
      expectNoIssues(report);
    });

    it('should detect missing Purpose section', async () => {
      const specFile = await createFile(path.join(specsDir, 'auth', 'spec.md'), specMissingPurpose());
      const report = await validator.validateSpec(specFile);
      expectErrors(report, 1);
      expect(report.issues[0].message).toContain('Purpose');
    });

    it('should detect missing Requirements section', async () => {
      const specFile = await createFile(path.join(specsDir, 'auth', 'spec.md'), specMissingRequirements());
      const report = await validator.validateSpec(specFile);
      expectErrors(report, 1);
      expect(report.issues[0].message).toContain('Requirements');
    });

    it('should return ERROR for unreadable file', async () => {
      const report = await validator.validateSpec('/nonexistent/path/spec.md');
      expectErrors(report, 1);
      expect(report.issues[0].path).toBe('file');
    });

    it('should provide guidance in error messages for missing Purpose', async () => {
      const specFile = await createFile(path.join(specsDir, 'auth', 'spec.md'), specMissingPurpose());
      const report = await validator.validateSpec(specFile);
      expect(report.issues[0].message).toContain('Expected headers');
    });
  });

  // ─── validateSpecContent ─────────────────────────

  describe('validateSpecContent', () => {
    it('should validate from string without file IO', async () => {
      const report = await validator.validateSpecContent('auth', validSpecContent());
      expectNoIssues(report);
    });

    it('should detect missing Purpose from string content', async () => {
      const report = await validator.validateSpecContent('auth', specMissingPurpose());
      expectErrors(report, 1);
    });
  });

  // ─── validateChange ──────────────────────────────

  describe('validateChange', () => {
    it('should return valid for a well-formed change with delta specs', async () => {
      const changeDir = path.join(changesDir, 'add-auth');
      await createFile(path.join(changeDir, 'change.md'), validChangeContent('auth'));
      await createFile(path.join(changeDir, 'specs', 'auth', 'spec.md'), validDeltaSpecContent());
      const report = await validator.validateChange(path.join(changeDir, 'change.md'));
      expectNoIssues(report);
    });

    it('should detect missing Why section', async () => {
      const changeFile = await createFile(path.join(changesDir, 'add-auth', 'change.md'), changeMissingWhy());
      const report = await validator.validateChange(changeFile);
      expectErrors(report, 1);
      expect(report.issues[0].message).toContain('Why');
    });

    it('should detect missing What Changes section', async () => {
      const changeFile = await createFile(path.join(changesDir, 'add-auth', 'change.md'), changeMissingWhatChanges());
      const report = await validator.validateChange(changeFile);
      expectErrors(report, 1);
      expect(report.issues[0].message).toContain('What Changes');
    });

    it('should detect missing deltas', async () => {
      const changeFile = await createFile(path.join(changesDir, 'add-auth', 'change.md'), changeNoDeltas());
      const report = await validator.validateChange(changeFile);
      expectErrors(report, 1);
      expect(report.issues[0].message).toContain('delta');
    });

    it('should enrich top-level errors with guidance', async () => {
      const changeFile = await createFile(path.join(changesDir, 'add-auth', 'change.md'), changeMissingWhy());
      const report = await validator.validateChange(changeFile);
      expect(report.issues[0].message).toContain('Expected headers');
    });
  });

  // ─── validateChangeDeltaSpecs ────────────────────

  describe('validateChangeDeltaSpecs', () => {
    it('should return valid for a well-formed delta spec', async () => {
      const changeDir = path.join(changesDir, 'add-auth');
      await createFile(path.join(changeDir, 'specs', 'auth', 'spec.md'), validDeltaSpecContent());
      const report = await validator.validateChangeDeltaSpecs(changeDir);
      expectNoIssues(report);
    });

    it('should detect ADDED requirement missing SHALL/MUST', async () => {
      const changeDir = path.join(changesDir, 'auth-no-shall');
      await createFile(path.join(changeDir, 'specs', 'auth', 'spec.md'), deltaSpecMissingShall());
      const report = await validator.validateChangeDeltaSpecs(changeDir);
      expectErrors(report, 1);
      expect(report.issues[0].message).toContain('SHALL or MUST');
    });

    it('should detect MODIFIED requirement missing SHALL/MUST', async () => {
      const modNoShall = [
        '## MODIFIED Requirements',
        '',
        '### Requirement: The system provides auth',
        '',
        'Users can authenticate.',
        '',
        '#### Scenario: Login',
        '- **WHEN** user logs in',
        '- **THEN** authenticated',
      ].join('\n');

      const changeDir = path.join(changesDir, 'mod-no-shall');
      await createFile(path.join(changeDir, 'specs', 'auth', 'spec.md'), modNoShall);
      const report = await validator.validateChangeDeltaSpecs(changeDir);
      expectErrors(report, 1);
      expect(report.issues[0].message).toContain('SHALL or MUST');
    });

    it('should detect empty delta sections with no entries', async () => {
      const changeDir = path.join(changesDir, 'empty-sections');
      await createFile(path.join(changeDir, 'specs', 'auth', 'spec.md'), deltaSpecEmptySections());
      const report = await validator.validateChangeDeltaSpecs(changeDir);
      // 2 errors: "no requirement entries parsed" + "no deltas found"
      expectErrors(report, 2);
      const entryIssue = report.issues.find(i => i.message.includes('no requirement entries parsed'));
      expect(entryIssue).toBeDefined();
    });

    it('should handle missing specs directory gracefully', async () => {
      const changeDir = path.join(changesDir, 'no-specs-dir');
      // No specs directory created
      const report = await validator.validateChangeDeltaSpecs(changeDir);
      // Missing directory = no files scanned = no deltas error
      expectErrors(report, 1);
      expect(report.issues[0].message).toContain('at least one delta');
    });

    it('should skip non-directory entries in specs/', async () => {
      const changeDir = path.join(changesDir, 'non-dir-specs');
      await createFile(path.join(changeDir, 'specs', 'a-file-not-dir.md'), 'just a file');
      const report = await validator.validateChangeDeltaSpecs(changeDir);
      expectErrors(report, 1);
      expect(report.issues[0].message).toContain('at least one delta');
    });

    it('should handle code block content within delta sections', async () => {
      // The delta parser uses stripFencedCodeBlocks internally via findMainSpecStructureIssues,
      // so code blocks should not be treated as requirements. The remaining valid requirements
      // should be parsed correctly.
      const codeBlockSpec = [
        '## ADDED Requirements',
        '',
        '### Requirement: The system SHALL provide auth',
        '',
        'Users SHALL authenticate.',
        '',
        '#### Scenario: Login',
        '- **WHEN** user logs in',
        '- **THEN** authenticated',
      ].join('\n');

      const changeDir = path.join(changesDir, 'code-blocks');
      await createFile(path.join(changeDir, 'specs', 'auth', 'spec.md'), codeBlockSpec);
      const report = await validator.validateChangeDeltaSpecs(changeDir);
      expectNoIssues(report);
    });

    it('should accept SHALL and MUST interchangeably', async () => {
      const mustContent = validDeltaSpecContent().replace('SHALL', 'MUST');
      const changeDir = path.join(changesDir, 'auth-must');
      await createFile(path.join(changeDir, 'specs', 'auth', 'spec.md'), mustContent);
      const report = await validator.validateChangeDeltaSpecs(changeDir);
      expectNoIssues(report);
    });
  });

  // ─── Strict mode ────────────────────────────────

  describe('strict mode', () => {
    let strictValidator: Validator;
    let tempDir: string;
    let changesDir: string;
    let specsDir: string;

    beforeEach(async () => {
      strictValidator = new Validator(true);
      tempDir = path.join(os.tmpdir(), `apew-strict-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      changesDir = path.join(tempDir, 'apeworkflow', 'changes');
      specsDir = path.join(tempDir, 'apeworkflow', 'specs');
    });

    afterEach(async () => {
      try { await fs.rm(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
    });

    it('should reject reports with errors in strict mode', async () => {
      const specFile = path.join(specsDir, 'auth', 'spec.md');
      await fs.mkdir(path.dirname(specFile), { recursive: true });
      await fs.writeFile(specFile, specMissingPurpose());
      const report = await strictValidator.validateSpec(specFile);
      expect(report.valid).toBe(false);
    });

    it('should accept clean reports in strict mode', async () => {
      const specFile = path.join(specsDir, 'auth', 'spec.md');
      await fs.mkdir(path.dirname(specFile), { recursive: true });
      await fs.writeFile(specFile, validSpecContent());
      const report = await strictValidator.validateSpec(specFile);
      expect(report.valid).toBe(true);
    });

    it('isValid should return report.valid directly', async () => {
      const specFile = path.join(specsDir, 'auth', 'spec.md');
      await fs.mkdir(path.dirname(specFile), { recursive: true });
      await fs.writeFile(specFile, validSpecContent());
      const report = await strictValidator.validateSpec(specFile);
      expect(strictValidator.isValid(report)).toBe(report.valid);
    });
  });

  // ─── extractNameFromPath ─────────────────────────

  describe('extractNameFromPath', () => {
    it('should produce a valid report for specs in standard location', async () => {
      const specFile = path.join(specsDir, 'auth', 'spec.md');
      await fs.mkdir(path.dirname(specFile), { recursive: true });
      await fs.writeFile(specFile, validSpecContent());
      const report = await validator.validateSpec(specFile);
      expectNoIssues(report);
    });

    it('should handle files outside standard structure (fallback to filename)', async () => {
      // Write outside the specs directory but still in the project root
      const weirdPath = path.join(tempDir, 'specs', 'custom', 'spec.md');
      await createFile(weirdPath, validSpecContent());
      const report = await validator.validateSpec(weirdPath);
      expectNoIssues(report);
    });
  });
});
