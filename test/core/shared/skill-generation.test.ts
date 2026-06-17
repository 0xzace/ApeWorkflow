import { describe, it, expect } from 'vitest';
import {
  getSkillTemplates,
  getCommandTemplates,
  getCommandContents,
  getVisibleCommandContents,
  generateSkillContent,
  isGlobalEntry,
  isWorkflowEntry,
} from '../../../src/core/shared/skill-generation.js';

describe('skill-generation', () => {
  describe('entry type guards', () => {
    it('should identify workflow entries by workflowId', () => {
      expect(isWorkflowEntry({ template: {} as never, dirName: 'apeworkflow-explore', workflowId: 'explore' })).toBe(true);
      expect(isWorkflowEntry({ template: {} as never, dirName: 'apeworkflow-feedback' })).toBe(false);
    });

    it('should identify global entries without workflowId', () => {
      expect(isGlobalEntry({ template: {} as never, dirName: 'apeworkflow-feedback' })).toBe(true);
      expect(isGlobalEntry({ template: {} as never, dirName: 'apeworkflow-explore', workflowId: 'explore' })).toBe(false);
    });
  });

  describe('getSkillTemplates', () => {
    it('should return all skill templates (workflow + global)', () => {
      const templates = getSkillTemplates();
      expect(templates).toHaveLength(26);
    });

    it('should have unique directory names', () => {
      const templates = getSkillTemplates();
      const dirNames = templates.map(t => t.dirName);
      const uniqueDirNames = new Set(dirNames);
      expect(uniqueDirNames.size).toBe(templates.length);
    });

    it('should include all expected skills', () => {
      const templates = getSkillTemplates();
      const dirNames = templates.map(t => t.dirName);

      expect(dirNames).toContain('apeworkflow-explore');
      expect(dirNames).toContain('apeworkflow-new-change');
      expect(dirNames).toContain('apeworkflow-continue-change');
      expect(dirNames).toContain('apeworkflow-apply-change');
      expect(dirNames).toContain('apeworkflow-ff-change');
      expect(dirNames).toContain('apeworkflow-sync-specs');
      expect(dirNames).toContain('apeworkflow-archive-change');
      expect(dirNames).toContain('apeworkflow-bulk-archive-change');
      expect(dirNames).toContain('apeworkflow-verify-change');
      expect(dirNames).toContain('apeworkflow-onboard');
      expect(dirNames).toContain('apeworkflow-propose');
    });

    it('should have valid template structure', () => {
      const templates = getSkillTemplates();

      for (const { template, dirName } of templates) {
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.instructions).toBeTruthy();
        expect(dirName).toBeTruthy();
      }
      // workflowId is optional — present for workflow skills, absent for global skills
    });

    it('should have unique workflow IDs among workflow skills', () => {
      const templates = getSkillTemplates();
      const workflowEntries = templates.filter(t => t.workflowId !== undefined);
      const ids = workflowEntries.map(t => t.workflowId!);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(workflowEntries.length);
    });

    it('should filter by workflow IDs when provided', () => {
      const filtered = getSkillTemplates(['propose', 'explore', 'apply', 'archive']);
      expect(filtered).toHaveLength(19); // 4 workflow + 15 global
      const workflowIds = filtered.filter(t => t.workflowId !== undefined).map(t => t.workflowId!);
      expect(workflowIds).toContain('propose');
      expect(workflowIds).toContain('explore');
      expect(workflowIds).toContain('apply');
      expect(workflowIds).toContain('archive');
      expect(workflowIds).not.toContain('new');
      expect(workflowIds).not.toContain('ff');
    });

    it('should return all templates when filter is undefined', () => {
      const all = getSkillTemplates();
      const noFilter = getSkillTemplates(undefined);
      expect(noFilter).toHaveLength(all.length);
    });

    it('should return global skills when workflow filter matches nothing', () => {
      const filtered = getSkillTemplates(['nonexistent']);
      // Returns global skills only since no workflow skill matches
      expect(filtered.every(t => t.workflowId === undefined)).toBe(true);
    });

    it('should return workflow match + global skills when filter has one workflow', () => {
      const filtered = getSkillTemplates(['propose']);
      // 1 matching workflow skill + 15 global skills = 16
      expect(filtered).toHaveLength(16);
      const workflowMatch = filtered.find(t => t.workflowId === 'propose');
      expect(workflowMatch).toBeTruthy();
      expect(workflowMatch!.dirName).toBe('apeworkflow-propose');
    });
  });

  describe('getCommandTemplates', () => {
    it('should return all 25 command templates (workflow + global)', () => {
      const templates = getCommandTemplates();
      expect(templates).toHaveLength(25);
    });

    it('should have unique IDs', () => {
      const templates = getCommandTemplates();
      const ids = templates.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(templates.length);
    });

    it('should include all expected commands', () => {
      const templates = getCommandTemplates();
      const ids = templates.map(t => t.id);

      // Workflow commands
      expect(ids).toContain('explore');
      expect(ids).toContain('new');
      expect(ids).toContain('continue');
      expect(ids).toContain('apply');
      expect(ids).toContain('ff');
      expect(ids).toContain('sync');
      expect(ids).toContain('archive');
      expect(ids).toContain('bulk-archive');
      expect(ids).toContain('verify');
      expect(ids).toContain('onboard');
      expect(ids).toContain('propose');
      // Global commands
      expect(ids).toContain('brainstorming');
      expect(ids).toContain('dispatching-parallel-agents');
      expect(ids).toContain('executing-plans');
      expect(ids).toContain('finishing-a-development-branch');
      expect(ids).toContain('receiving-code-review');
      expect(ids).toContain('requesting-code-review');
      expect(ids).toContain('subagent-driven-development');
      expect(ids).toContain('systematic-debugging');
      expect(ids).toContain('test-driven-development');
      expect(ids).toContain('using-git-worktrees');
      expect(ids).toContain('using-skills');
      expect(ids).toContain('verification-before-completion');
      expect(ids).toContain('writing-plans');
      expect(ids).toContain('writing-skills');
    });

    it('should filter workflow commands but always include global commands', () => {
      const filtered = getCommandTemplates(['propose', 'explore', 'apply', 'archive']);
      // 4 workflow matches + 14 global = 18
      expect(filtered).toHaveLength(18);
      const ids = filtered.map(t => t.id);
      expect(ids).toContain('propose');
      expect(ids).toContain('explore');
      expect(ids).toContain('apply');
      expect(ids).toContain('archive');
      expect(ids).not.toContain('new');
      expect(ids).not.toContain('ff');
      // Global commands always present
      expect(ids).toContain('brainstorming');
      expect(ids).toContain('writing-plans');
    });

    it('should return all templates when filter is undefined', () => {
      const all = getCommandTemplates();
      const noFilter = getCommandTemplates(undefined);
      expect(noFilter).toHaveLength(all.length);
    });

    it('should return only global commands when filter matches no workflow commands', () => {
      const filtered = getCommandTemplates(['nonexistent']);
      // Global commands are always included
      expect(filtered).toHaveLength(14);
      const ids = filtered.map(t => t.id);
      expect(ids).toContain('brainstorming');
      expect(ids).not.toContain('explore');
    });
  });

  describe('getCommandContents', () => {
    it('should return all 25 command contents (workflow + global)', () => {
      const contents = getCommandContents();
      expect(contents).toHaveLength(25);
    });

    it('should have valid content structure', () => {
      const contents = getCommandContents();

      for (const content of contents) {
        expect(content.id).toBeTruthy();
        expect(content.name).toBeTruthy();
        expect(content.description).toBeTruthy();
        expect(content.body).toBeTruthy();
      }
    });

    it('should have matching IDs with command templates', () => {
      const templates = getCommandTemplates();
      const contents = getCommandContents();

      const templateIds = templates.map(t => t.id).sort();
      const contentIds = contents.map(c => c.id).sort();

      expect(contentIds).toEqual(templateIds);
    });

    it('should filter workflow contents but always include global contents', () => {
      const filtered = getCommandContents(['propose', 'explore']);
      // 2 workflow matches + 14 global = 16
      expect(filtered).toHaveLength(16);
      const ids = filtered.map(c => c.id);
      expect(ids).toContain('propose');
      expect(ids).toContain('explore');
      expect(ids).not.toContain('new');
      // Global commands always present
      expect(ids).toContain('brainstorming');
    });

    it('should return all contents when filter is undefined', () => {
      const all = getCommandContents();
      const noFilter = getCommandContents(undefined);
      expect(noFilter).toHaveLength(all.length);
    });
  });

  describe('getVisibleCommandContents', () => {
    it('should return the eight visible command contents', () => {
      const contents = getVisibleCommandContents();
      const ids = contents.map((content) => content.id);

      expect(contents).toHaveLength(8);
      expect(ids).toEqual([
        'explore',
        'propose',
        'apply',
        'verify',
        'archive',
        'onboard',
        'bulk-archive',
        'feedback',
      ]);
    });
  });

  describe('generateSkillContent', () => {
    it('should generate valid YAML frontmatter', () => {
      const template = {
        name: 'test-skill',
        description: 'Test description',
        instructions: 'Test instructions',
        license: 'MIT',
        compatibility: 'Test compatibility',
        metadata: {
          author: 'test-author',
          version: '2.0',
        },
      };

      const content = generateSkillContent(template, '0.23.0');

      expect(content).toMatch(/^---\n/);
      expect(content).toContain('name: test-skill');
      expect(content).toContain('description: Test description');
      expect(content).toContain('license: MIT');
      expect(content).toContain('compatibility: Test compatibility');
      expect(content).toContain('author: test-author');
      expect(content).toContain('version: "2.0"');
      expect(content).toContain('generatedBy: "0.23.0"');
      expect(content).toContain('Test instructions');
    });

    it('should use default values for optional fields', () => {
      const template = {
        name: 'minimal-skill',
        description: 'Minimal description',
        instructions: 'Minimal instructions',
      };

      const content = generateSkillContent(template, '0.24.0');

      expect(content).toContain('license: MIT');
      expect(content).toContain('compatibility: Requires apeworkflow CLI.');
      expect(content).toContain('author: apeworkflow');
      expect(content).toContain('version: "1.0"');
      expect(content).toContain('generatedBy: "0.24.0"');
    });

    it('should embed the provided version in generatedBy field', () => {
      const template = {
        name: 'version-test',
        description: 'Test version embedding',
        instructions: 'Instructions',
      };

      const content1 = generateSkillContent(template, '0.23.0');
      expect(content1).toContain('generatedBy: "0.23.0"');

      const content2 = generateSkillContent(template, '1.0.0');
      expect(content2).toContain('generatedBy: "1.0.0"');

      const content3 = generateSkillContent(template, '0.24.0-beta.1');
      expect(content3).toContain('generatedBy: "0.24.0-beta.1"');
    });

    it('should end frontmatter with separator and blank line', () => {
      const template = {
        name: 'test',
        description: 'Test',
        instructions: 'Body content',
      };

      const content = generateSkillContent(template, '0.23.0');

      expect(content).toMatch(/---\n\nBody content\n$/);
    });

    it('should apply transformInstructions callback when provided', () => {
      const template = {
        name: 'transform-test',
        description: 'Test transform callback',
        instructions: 'Use /ape:new to start and /ape:apply to implement.',
      };

      const transformer = (text: string) => text.replace(/\/ape:/g, '/ape-');
      const content = generateSkillContent(template, '0.23.0', transformer);

      expect(content).toContain('/ape-new');
      expect(content).toContain('/ape-apply');
      expect(content).not.toContain('/ape:new');
      expect(content).not.toContain('/ape:apply');
    });

    it('should not transform instructions when callback is undefined', () => {
      const template = {
        name: 'no-transform-test',
        description: 'Test without transform',
        instructions: 'Use /ape:new to start.',
      };

      const content = generateSkillContent(template, '0.23.0', undefined);

      expect(content).toContain('/ape:new');
    });

    it('should support custom transformInstructions logic', () => {
      const template = {
        name: 'custom-transform',
        description: 'Test custom transform',
        instructions: 'Some PLACEHOLDER text here.',
      };

      const customTransformer = (text: string) => text.replace('PLACEHOLDER', 'REPLACED');
      const content = generateSkillContent(template, '0.23.0', customTransformer);

      expect(content).toContain('Some REPLACED text here.');
      expect(content).not.toContain('PLACEHOLDER');
    });
  });
});
