import { describe, it, expect } from 'vitest';
import {
  WORKFLOW_COMMAND_IDS,
  GLOBAL_COMMAND_IDS,
  COMMAND_IDS,
  type WorkflowCommandId,
  type GlobalCommandId,
} from '../../../src/core/shared/tool-detection.js';

describe('tool-detection commands', () => {
  describe('WORKFLOW_COMMAND_IDS', () => {
    it('should contain exactly 11 workflow command IDs', () => {
      expect(WORKFLOW_COMMAND_IDS).toHaveLength(11);
    });

    it('should contain all expected workflow commands', () => {
      expect(WORKFLOW_COMMAND_IDS).toContain('explore');
      expect(WORKFLOW_COMMAND_IDS).toContain('new');
      expect(WORKFLOW_COMMAND_IDS).toContain('continue');
      expect(WORKFLOW_COMMAND_IDS).toContain('apply');
      expect(WORKFLOW_COMMAND_IDS).toContain('ff');
      expect(WORKFLOW_COMMAND_IDS).toContain('sync');
      expect(WORKFLOW_COMMAND_IDS).toContain('archive');
      expect(WORKFLOW_COMMAND_IDS).toContain('bulk-archive');
      expect(WORKFLOW_COMMAND_IDS).toContain('verify');
      expect(WORKFLOW_COMMAND_IDS).toContain('onboard');
      expect(WORKFLOW_COMMAND_IDS).toContain('propose');
    });

    it('should have unique IDs', () => {
      const ids = WORKFLOW_COMMAND_IDS as string[];
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('GLOBAL_COMMAND_IDS', () => {
    it('should contain exactly 14 global command IDs', () => {
      expect(GLOBAL_COMMAND_IDS).toHaveLength(14);
    });

    it('should contain all expected global commands', () => {
      expect(GLOBAL_COMMAND_IDS).toContain('brainstorming');
      expect(GLOBAL_COMMAND_IDS).toContain('dispatching-parallel-agents');
      expect(GLOBAL_COMMAND_IDS).toContain('executing-plans');
      expect(GLOBAL_COMMAND_IDS).toContain('finishing-a-development-branch');
      expect(GLOBAL_COMMAND_IDS).toContain('receiving-code-review');
      expect(GLOBAL_COMMAND_IDS).toContain('requesting-code-review');
      expect(GLOBAL_COMMAND_IDS).toContain('subagent-driven-development');
      expect(GLOBAL_COMMAND_IDS).toContain('systematic-debugging');
      expect(GLOBAL_COMMAND_IDS).toContain('test-driven-development');
      expect(GLOBAL_COMMAND_IDS).toContain('using-git-worktrees');
      expect(GLOBAL_COMMAND_IDS).toContain('using-skills');
      expect(GLOBAL_COMMAND_IDS).toContain('verification-before-completion');
      expect(GLOBAL_COMMAND_IDS).toContain('writing-plans');
      expect(GLOBAL_COMMAND_IDS).toContain('writing-skills');
    });

    it('should have unique IDs', () => {
      const ids = GLOBAL_COMMAND_IDS as string[];
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('COMMAND_IDS (backward compatible)', () => {
    it('should contain all 25 IDs (workflow + global)', () => {
      expect(COMMAND_IDS).toHaveLength(25);
    });

    it('should be the concatenation of workflow + global IDs', () => {
      const all = [...WORKFLOW_COMMAND_IDS, ...GLOBAL_COMMAND_IDS] as const;
      expect(COMMAND_IDS).toEqual(all);
    });

    it('should have unique IDs across both categories', () => {
      const ids = COMMAND_IDS as string[];
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should contain all workflow IDs', () => {
      for (const id of WORKFLOW_COMMAND_IDS) {
        expect(COMMAND_IDS).toContain(id);
      }
    });

    it('should contain all global IDs', () => {
      for (const id of GLOBAL_COMMAND_IDS) {
        expect(COMMAND_IDS).toContain(id);
      }
    });
  });

  describe('Type safety', () => {
    it('should accept workflow IDs as WorkflowCommandId', () => {
      const id: WorkflowCommandId = 'explore';
      expect(id).toBe('explore');
    });

    it('should accept global IDs as GlobalCommandId', () => {
      const id: GlobalCommandId = 'brainstorming';
      expect(id).toBe('brainstorming');
    });

    it('should accept any command ID as CommandId', () => {
      const workflowId: CommandId = 'explore';
      const globalId: CommandId = 'brainstorming';
      expect(workflowId).toBe('explore');
      expect(globalId).toBe('brainstorming');
    });
  });
});
