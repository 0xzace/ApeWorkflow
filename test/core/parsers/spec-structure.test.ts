import { describe, it, expect } from 'vitest';
import {
  findMainSpecStructureIssues,
  stripFencedCodeBlocksPreservingLines,
  type MainSpecStructureIssue,
} from '../../../src/core/parsers/spec-structure.js';

// ═══════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════

function wellFormedMainSpec(): string {
  return [
    '# Purpose',
    'This is a comprehensive spec for the authentication system.',
    '',
    '## Requirements',
    '### Requirement: The system SHALL provide auth',
    '',
    'Users SHALL authenticate with credentials.',
    '',
    '#### Scenario: Login',
    '- **WHEN** user logs in',
    '- **THEN** authenticated',
    '',
    '### Requirement: The system SHALL manage sessions',
    '',
    'Users SHALL have persistent sessions.',
    '',
    '#### Scenario: Session created',
    '- **WHEN** user logs in',
    '- **THEN** session is created',
  ].join('\n');
}

function specWithDeltaHeader(): string {
  return [
    '# Purpose',
    'Main spec for auth.',
    '',
    '## Requirements',
    '### Requirement: The system SHALL provide auth',
    '',
    'Users SHALL authenticate.',
    '',
    '#### Scenario: Login',
    '- **WHEN** user logs in',
    '- **THEN** authenticated',
    '',
    '## ADDED Requirements',
    '',
    '### Requirement: The system SHALL support OAuth',
    '',
    'Users SHALL be able to use OAuth.',
  ].join('\n');
}

function specWithRequirementOutsideSection(): string {
  return [
    '# Purpose',
    'Main spec for auth.',
    '',
    '### Requirement: The system SHALL provide auth',
    '',
    'Users SHALL authenticate.',
    '',
    '#### Scenario: Login',
    '- **WHEN** user logs in',
    '- **THEN** authenticated',
    '',
    '## Requirements',
    '### Requirement: The system SHALL manage sessions',
    '',
    'Users SHALL have persistent sessions.',
  ].join('\n');
}

function specWithNoRequirementsSection(): string {
  return [
    '# Purpose',
    'Main spec for auth.',
    '',
    '### Requirement: Orphaned requirement',
    '',
    'Users SHALL authenticate.',
  ].join('\n');
}

function emptyContent(): string {
  return '';
}

function specWithCrlf(): string {
  return [
    '# Purpose',
    'Main spec for auth.',
    '',
    '## Requirements',
    '### Requirement: The system SHALL provide auth',
    '',
    'Users SHALL authenticate.',
    '',
    '#### Scenario: Login',
    '- **WHEN** user logs in',
    '- **THEN** authenticated',
  ].join('\r\n');
}

// ═══════════════════════════════════════════════════
// findMainSpecStructureIssues
// ═══════════════════════════════════════════════════

describe('findMainSpecStructureIssues', () => {
  it('should return empty for a well-formed main spec', () => {
    const issues = findMainSpecStructureIssues(wellFormedMainSpec());
    expect(issues).toEqual([]);
  });

  it('should detect delta header in main spec', () => {
    const issues = findMainSpecStructureIssues(specWithDeltaHeader());
    expect(issues.length).toBeGreaterThanOrEqual(1);

    const deltaIssues = issues.filter(i => i.kind === 'delta-header');
    expect(deltaIssues.length).toBe(1);
    expect(deltaIssues[0].header).toBe('## ADDED Requirements');
    expect(deltaIssues[0].message).toContain('Delta headers are only valid inside');
  });

  it('should detect requirement header outside Requirements section', () => {
    const issues = findMainSpecStructureIssues(specWithRequirementOutsideSection());
    const outsideIssues = issues.filter(i => i.kind === 'requirement-outside-requirements');
    expect(outsideIssues.length).toBe(1);
    expect(outsideIssues[0].header).toBe('### Requirement: The system SHALL provide auth');
    expect(outsideIssues[0].message).toContain('outside the main');
  });

  it('should detect orphaned requirement when no Requirements section exists', () => {
    const issues = findMainSpecStructureIssues(specWithNoRequirementsSection());
    const outsideIssues = issues.filter(i => i.kind === 'requirement-outside-requirements');
    expect(outsideIssues.length).toBe(1);
    expect(outsideIssues[0].header).toBe('### Requirement: Orphaned requirement');
  });

  it('should handle completely empty content', () => {
    const issues = findMainSpecStructureIssues(emptyContent());
    expect(issues).toEqual([]);
  });

  it('should handle CRLF line endings', () => {
    const issues = findMainSpecStructureIssues(specWithCrlf());
    // No issues expected — CRLF should be normalized
    expect(issues).toEqual([]);
  });

  it('should handle content with only a Purpose section', () => {
    const onlyPurpose = [
      '# Purpose',
      'This is a spec with no requirements.',
    ].join('\n');

    const issues = findMainSpecStructureIssues(onlyPurpose);
    expect(issues).toEqual([]);
  });

  it('should detect multiple delta headers', () => {
    const multiDelta = [
      '# Purpose',
      'Main spec.',
      '',
      '## Requirements',
      '### Requirement: The system SHALL provide auth',
      '',
      'Users SHALL authenticate.',
      '',
      '#### Scenario: Login',
      '- **WHEN** user logs in',
      '- **THEN** authenticated',
      '',
      '## ADDED Requirements',
      '',
      '### Requirement: The system SHALL support OAuth',
      '',
      '## MODIFIED Requirements',
      '',
      '### Requirement: The system SHALL manage sessions',
    ].join('\n');

    const issues = findMainSpecStructureIssues(multiDelta);
    const deltaIssues = issues.filter(i => i.kind === 'delta-header');
    expect(deltaIssues.length).toBe(2);
    expect(deltaIssues[0].header).toBe('## ADDED Requirements');
    expect(deltaIssues[1].header).toBe('## MODIFIED Requirements');
  });

  it('should detect multiple requirement-outside-Requirements issues', () => {
    const multiOutside = [
      '# Purpose',
      'Main spec.',
      '',
      '### Requirement: First orphaned',
      '',
      'First SHALL work.',
      '',
      '## Purpose Duplicate',
      '',
      '### Requirement: Second orphaned',
      '',
      'Second SHALL work.',
    ].join('\n');

    const issues = findMainSpecStructureIssues(multiOutside);
    const outsideIssues = issues.filter(i => i.kind === 'requirement-outside-requirements');
    expect(outsideIssues.length).toBe(2);
  });

  it('should not flag requirement inside Requirements section', () => {
    const correctPlacement = [
      '# Purpose',
      'Main spec.',
      '',
      '## Requirements',
      '### Requirement: The system SHALL provide auth',
      '',
      'Users SHALL authenticate.',
      '',
      '#### Scenario: Login',
      '- **WHEN** user logs in',
      '- **THEN** authenticated',
      '',
      '### Requirement: The system SHALL manage sessions',
      '',
      'Users SHALL have sessions.',
    ].join('\n');

    const issues = findMainSpecStructureIssues(correctPlacement);
    const outsideIssues = issues.filter(i => i.kind === 'requirement-outside-requirements');
    expect(outsideIssues.length).toBe(0);
  });

  it('should include correct line numbers in issues', () => {
    const spec = specWithRequirementOutsideSection();
    // The orphaned requirement is at line 4 (1-indexed)
    const issues = findMainSpecStructureIssues(spec);
    const outsideIssues = issues.filter(i => i.kind === 'requirement-outside-requirements');
    expect(outsideIssues[0].line).toBe(4);
  });

  it('should not flag requirements after another top-level section in Requirements section', () => {
    // Requirements ends when another ## section appears
    const specWithSubSection = [
      '# Purpose',
      'Main spec.',
      '',
      '## Requirements',
      '### Requirement: The system SHALL provide auth',
      '',
      'Users SHALL authenticate.',
      '',
      '#### Scenario: Login',
      '- **WHEN** user logs in',
      '- **THEN** authenticated',
      '',
      '## Metadata',
      '',
      'Format: apeworkflow',
    ].join('\n');

    const issues = findMainSpecStructureIssues(specWithSubSection);
    // The requirement before ## Metadata should be detected as inside Requirements
    const outsideIssues = issues.filter(i => i.kind === 'requirement-outside-requirements');
    expect(outsideIssues.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════
// stripFencedCodeBlocksPreservingLines
// ═══════════════════════════════════════════════════

describe('stripFencedCodeBlocksPreservingLines', () => {
  it('should preserve total line count by replacing fenced blocks with empty lines', () => {
    const input = [
      'Line 1',
      '```',
      'Line inside block',
      'Another inside',
      '```',
      'Line 6',
    ].join('\n');

    const output = stripFencedCodeBlocksPreservingLines(input);
    const outputLines = output.split('\n');
    const inputLines = input.split('\n');
    expect(outputLines.length).toBe(inputLines.length);
  });

  it('should replace content inside code blocks with empty lines', () => {
    const input = [
      'Line 1',
      '```',
      'Line inside block',
      '```',
      'Line 4',
    ].join('\n');

    const output = stripFencedCodeBlocksPreservingLines(input);
    const outputLines = output.split('\n');
    expect(outputLines[0]).toBe('Line 1');
    expect(outputLines[1]).toBe('');     // opening fence
    expect(outputLines[2]).toBe('');     // inside content
    expect(outputLines[3]).toBe('');     // closing fence
    expect(outputLines[4]).toBe('Line 4');
  });

  it('should match backtick fence (```)', () => {
    const input = [
      '```',
      'inside',
      '```',
    ].join('\n');

    const output = stripFencedCodeBlocksPreservingLines(input);
    expect(output.split('\n').length).toBe(3);
  });

  it('should match tilde fence (~~~)', () => {
    const input = [
      '~~~',
      'inside',
      '~~~',
    ].join('\n');

    const output = stripFencedCodeBlocksPreservingLines(input);
    expect(output.split('\n').length).toBe(3);
  });

  it('should require closing fence to match opening marker type', () => {
    // ``` opens, ~~~ closes — should NOT close, remaining lines stay marked
    const input = [
      '```',
      'inside with backtick fence',
      '~~~',
      'after ~~~ (still inside ```)',
      '~~~',
    ].join('\n');

    const output = stripFencedCodeBlocksPreservingLines(input);
    const outputLines = output.split('\n');
    // All lines inside and after the mismatched ~~~ should be empty
    // because the ``` was never closed
    for (const line of outputLines.slice(1)) {
      expect(line).toBe('');
    }
  });

  it('should require closing fence to have >= number of markers', () => {
    // ``` (3) opens, ~~~~ (4) closes — should close (4 >= 3, same marker)
    const input = [
      '```',
      'inside',
      '~~~~',
    ].join('\n');

    const output = stripFencedCodeBlocksPreservingLines(input);
    expect(output.split('\n').length).toBe(3);
  });

  it('should not close with fewer markers', () => {
    // ````` (5) opens, ``` (3) closes — should NOT close
    const input = [
      '`````',
      'inside',
      '```',
      'after',
    ].join('\n');

    const output = stripFencedCodeBlocksPreservingLines(input);
    const outputLines = output.split('\n');
    // Only the opening fence line is empty; the rest (including closing fence) should be empty too since it's still inside
    expect(outputLines[0]).toBe(''); // opening fence
    expect(outputLines[1]).toBe(''); // inside
    expect(outputLines[2]).toBe(''); // "closing" fence (still inside)
    expect(outputLines[3]).toBe(''); // after (still inside)
  });

  it('should handle nested-looking fences inside code blocks', () => {
    const input = [
      '```python',
      'def foo():',
      '    print("```")',
      '```',
      'After block',
    ].join('\n');

    const output = stripFencedCodeBlocksPreservingLines(input);
    const outputLines = output.split('\n');
    expect(outputLines[0]).toBe('');        // opening
    expect(outputLines[1]).toBe('');        // inside
    expect(outputLines[2]).toBe('');        // "```" inside (not a closing fence)
    expect(outputLines[3]).toBe('');        // closing
    expect(outputLines[4]).toBe('After block'); // preserved
  });

  it('should preserve non-fence code lines', () => {
    const input = [
      'Line before',
      'Regular line',
      '```',
      'Inside block',
      '```',
      'Line after',
    ].join('\n');

    const output = stripFencedCodeBlocksPreservingLines(input);
    const outputLines = output.split('\n');
    expect(outputLines[0]).toBe('Line before');
    expect(outputLines[1]).toBe('Regular line');
    expect(outputLines[2]).toBe('');
    expect(outputLines[3]).toBe('');
    expect(outputLines[4]).toBe('');
    expect(outputLines[5]).toBe('Line after');
  });

  it('should handle empty content', () => {
    const output = stripFencedCodeBlocksPreservingLines('');
    expect(output).toBe('');
  });

  it('should handle content with no fences', () => {
    const input = [
      'Line 1',
      'Line 2',
      'Line 3',
    ].join('\n');

    const output = stripFencedCodeBlocksPreservingLines(input);
    expect(output).toBe(input);
  });

  it('should handle multiple consecutive code blocks', () => {
    const input = [
      'Before',
      '```',
      'Block 1',
      '```',
      'Between',
      '~~~',
      'Block 2',
      '~~~',
      'After',
    ].join('\n');

    const output = stripFencedCodeBlocksPreservingLines(input);
    const outputLines = output.split('\n');
    expect(outputLines[0]).toBe('Before');
    expect(outputLines[1]).toBe('');
    expect(outputLines[2]).toBe('');
    expect(outputLines[3]).toBe('');
    expect(outputLines[4]).toBe('Between');
    expect(outputLines[5]).toBe('');
    expect(outputLines[6]).toBe('');
    expect(outputLines[7]).toBe('');
    expect(outputLines[8]).toBe('After');
  });

  it('should handle leading whitespace on fence markers', () => {
    const input = [
      '  ```',
      '  inside',
      '  ```',
    ].join('\n');

    const output = stripFencedCodeBlocksPreservingLines(input);
    expect(output.split('\n').length).toBe(3);
  });
});
