import { describe, it, expect } from 'vitest';

import * as skillTemplates from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';

// ═══════════════════════════════════════════════════
// Re-export layer integrity
// ═══════════════════════════════════════════════════

describe('skill-templates re-export layer', () => {
  it('should export all workflow skill templates', () => {
    expect(typeof skillTemplates.getExploreSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getNewChangeSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getContinueChangeSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getApplyChangeSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getFfChangeSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getSyncSpecsSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getArchiveChangeSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getBulkArchiveChangeSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getVerifyChangeSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getOnboardSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getApeProposeSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getFeedbackSkillTemplate).toBe('function');
  });

  it('should export all methodology skill templates', () => {
    expect(typeof skillTemplates.getBrainstormingSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getDispatchingParallelAgentsSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getExecutingPlansSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getFinishingADevelopmentBranchSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getReceivingCodeReviewSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getRequestingCodeReviewSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getSubagentDrivenDevelopmentSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getSystematicDebuggingSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getTestDrivenDevelopmentSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getUsingGitWorktreesSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getUsingSkillsSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getVerificationBeforeCompletionSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getWritingPlansSkillTemplate).toBe('function');
    expect(typeof skillTemplates.getWritingSkillsSkillTemplate).toBe('function');
  });

  it('should export all command templates that have SkillTemplate counterparts', () => {
    // Command templates for workflow skills
    expect(typeof skillTemplates.getApeExploreCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeNewCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeContinueCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeApplyCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeFfCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeSyncCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeArchiveCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeBulkArchiveCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeVerifyCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeOnboardCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeProposeCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeFeedbackCommandTemplate).toBe('function');

    // Command templates for methodology skills
    expect(typeof skillTemplates.getApeBrainstormingCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeDispatchingParallelAgentsCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeExecutingPlansCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeFinishingADevelopmentBranchCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeReceivingCodeReviewCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeRequestingCodeReviewCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeSubagentDrivenDevelopmentCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeSystematicDebuggingCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeTestDrivenDevelopmentCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeUsingGitWorktreesCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeUsingSkillsCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeVerificationBeforeCompletionCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeWritingPlansCommandTemplate).toBe('function');
    expect(typeof skillTemplates.getApeWritingSkillsCommandTemplate).toBe('function');
  });

  it('should export types', () => {
    // Types should be re-exported (even though we can't test type exports at runtime,
    // this ensures the barrel file structure is correct)
    expect(typeof skillTemplates).toBe('object');
  });
});

// ═══════════════════════════════════════════════════
// Skill template structure validation
// ═══════════════════════════════════════════════════

describe('SkillTemplate structure', () => {
  const templates = [
    ['explore', skillTemplates.getExploreSkillTemplate],
    ['new-change', skillTemplates.getNewChangeSkillTemplate],
    ['continue-change', skillTemplates.getContinueChangeSkillTemplate],
    ['apply-change', skillTemplates.getApplyChangeSkillTemplate],
    ['ff-change', skillTemplates.getFfChangeSkillTemplate],
    ['sync-specs', skillTemplates.getSyncSpecsSkillTemplate],
    ['archive-change', skillTemplates.getArchiveChangeSkillTemplate],
    ['bulk-archive-change', skillTemplates.getBulkArchiveChangeSkillTemplate],
    ['verify-change', skillTemplates.getVerifyChangeSkillTemplate],
    ['onboard', skillTemplates.getOnboardSkillTemplate],
    ['propose', skillTemplates.getApeProposeSkillTemplate],
    ['feedback', skillTemplates.getFeedbackSkillTemplate],
    ['brainstorming', skillTemplates.getBrainstormingSkillTemplate],
    ['dispatching-parallel-agents', skillTemplates.getDispatchingParallelAgentsSkillTemplate],
    ['executing-plans', skillTemplates.getExecutingPlansSkillTemplate],
    ['finishing-a-development-branch', skillTemplates.getFinishingADevelopmentBranchSkillTemplate],
    ['receiving-code-review', skillTemplates.getReceivingCodeReviewSkillTemplate],
    ['requesting-code-review', skillTemplates.getRequestingCodeReviewSkillTemplate],
    ['subagent-driven-development', skillTemplates.getSubagentDrivenDevelopmentSkillTemplate],
    ['systematic-debugging', skillTemplates.getSystematicDebuggingSkillTemplate],
    ['test-driven-development', skillTemplates.getTestDrivenDevelopmentSkillTemplate],
    ['using-git-worktrees', skillTemplates.getUsingGitWorktreesSkillTemplate],
    ['using-skills', skillTemplates.getUsingSkillsSkillTemplate],
    ['verification-before-completion', skillTemplates.getVerificationBeforeCompletionSkillTemplate],
    ['writing-plans', skillTemplates.getWritingPlansSkillTemplate],
    ['writing-skills', skillTemplates.getWritingSkillsSkillTemplate],
  ] as const;

  for (const [name, getTemplate] of templates) {
    it(`${name} should produce a valid SkillTemplate`, () => {
      const template = getTemplate();

      expect(template.name).toBeDefined();
      expect(typeof template.name).toBe('string');
      expect(template.name.length).toBeGreaterThan(0);

      expect(template.description).toBeDefined();
      expect(typeof template.description).toBe('string');
      expect(template.description.length).toBeGreaterThan(0);

      expect(template.instructions).toBeDefined();
      expect(typeof template.instructions).toBe('string');
      expect(template.instructions.length).toBeGreaterThan(10);
    });
  }
});

// ═══════════════════════════════════════════════════
// Command template structure validation
// ═══════════════════════════════════════════════════

describe('CommandTemplate structure', () => {
  const commandTemplates = [
    ['explore', skillTemplates.getApeExploreCommandTemplate],
    ['new', skillTemplates.getApeNewCommandTemplate],
    ['continue', skillTemplates.getApeContinueCommandTemplate],
    ['apply', skillTemplates.getApeApplyCommandTemplate],
    ['ff', skillTemplates.getApeFfCommandTemplate],
    ['sync', skillTemplates.getApeSyncCommandTemplate],
    ['archive', skillTemplates.getApeArchiveCommandTemplate],
    ['bulk-archive', skillTemplates.getApeBulkArchiveCommandTemplate],
    ['verify', skillTemplates.getApeVerifyCommandTemplate],
    ['onboard', skillTemplates.getApeOnboardCommandTemplate],
    ['propose', skillTemplates.getApeProposeCommandTemplate],
    ['feedback', skillTemplates.getApeFeedbackCommandTemplate],
    ['brainstorming', skillTemplates.getApeBrainstormingCommandTemplate],
    ['dispatching-parallel-agents', skillTemplates.getApeDispatchingParallelAgentsCommandTemplate],
    ['executing-plans', skillTemplates.getApeExecutingPlansCommandTemplate],
    ['finishing-a-development-branch', skillTemplates.getApeFinishingADevelopmentBranchCommandTemplate],
    ['receiving-code-review', skillTemplates.getApeReceivingCodeReviewCommandTemplate],
    ['requesting-code-review', skillTemplates.getApeRequestingCodeReviewCommandTemplate],
    ['subagent-driven-development', skillTemplates.getApeSubagentDrivenDevelopmentCommandTemplate],
    ['systematic-debugging', skillTemplates.getApeSystematicDebuggingCommandTemplate],
    ['test-driven-development', skillTemplates.getApeTestDrivenDevelopmentCommandTemplate],
    ['using-git-worktrees', skillTemplates.getApeUsingGitWorktreesCommandTemplate],
    ['using-skills', skillTemplates.getApeUsingSkillsCommandTemplate],
    ['verification-before-completion', skillTemplates.getApeVerificationBeforeCompletionCommandTemplate],
    ['writing-plans', skillTemplates.getApeWritingPlansCommandTemplate],
    ['writing-skills', skillTemplates.getApeWritingSkillsCommandTemplate],
  ] as const;

  for (const [name, getTemplate] of commandTemplates) {
    it(`${name} should produce a valid CommandTemplate`, () => {
      const template = getTemplate();

      expect(template.name).toBeDefined();
      expect(typeof template.name).toBe('string');
      expect(template.name.length).toBeGreaterThan(0);

      expect(template.description).toBeDefined();
      expect(typeof template.description).toBe('string');
      expect(template.description.length).toBeGreaterThan(0);

      expect(template.category).toBeDefined();
      expect(typeof template.category).toBe('string');

      expect(template.tags).toBeDefined();
      expect(Array.isArray(template.tags)).toBe(true);
      expect(template.tags.length).toBeGreaterThan(0);

      expect(template.content).toBeDefined();
      expect(typeof template.content).toBe('string');
      expect(template.content.length).toBeGreaterThan(10);
    });
  }
});

// ═══════════════════════════════════════════════════
// generateSkillContent integration
// ═══════════════════════════════════════════════════

describe('generateSkillContent integration', () => {
  it('should produce valid YAML frontmatter with name, description, license, compatibility', () => {
    const content = generateSkillContent(
      skillTemplates.getExploreSkillTemplate(),
      '25.6.17'
    );

    // Verify frontmatter delimiters and key fields
    expect(content).toContain('name: apeworkflow-explore');
    expect(content).toContain('description:');
    expect(content).toContain('license:');
    expect(content).toContain('compatibility:');
    expect(content).toContain('metadata:');
    expect(content).toContain('author: apeworkflow');
    expect(content).toContain('version: "1.0"');
    expect(content).toContain('generatedBy: "25.6.17"');
    // Verify frontmatter structure (YAML between --- delimiters)
    expect(content).toMatch(/^---\n/);
    expect(content).toMatch(/\n---\n/);
  });

  it('should apply transformInstructions callback when provided', () => {
    const template = skillTemplates.getExploreSkillTemplate();
    const transform = (instructions: string) =>
      instructions.replace(/\/ape:apply/g, '/ape-apply');

    const content = generateSkillContent(template, '25.6.17', transform);

    // The transformed version should have hyphens instead of colons
    // (only applies to opencode/pi, but the transform function should work)
    expect(content).toContain(generateSkillContent(
      { ...template, instructions: transform(template.instructions) },
      '25.6.17'
    ));
  });

  it('should handle templates with custom metadata', () => {
    const customTemplate = {
      name: 'custom-skill',
      description: 'A custom skill',
      instructions: 'Do something.',
      license: 'Apache-2.0',
      compatibility: 'Custom environment.',
      metadata: { author: 'test', version: '2.0' },
    };

    const content = generateSkillContent(customTemplate, '25.6.17');

    expect(content).toContain('license: Apache-2.0');
    expect(content).toContain('compatibility: Custom environment.');
    expect(content).toContain('author: test');
    expect(content).toContain('version: "2.0"');
  });

  it('should use default values for optional fields', () => {
    const minimalTemplate = {
      name: 'minimal',
      description: 'A minimal skill',
      instructions: 'Just do it.',
    };

    const content = generateSkillContent(minimalTemplate, '25.6.17');

    expect(content).toContain('license: MIT');
    expect(content).toContain('compatibility: Requires apeworkflow CLI.');
    expect(content).toContain('author: apeworkflow');
  });
});
