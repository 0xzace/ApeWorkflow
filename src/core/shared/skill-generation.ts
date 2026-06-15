/**
 * Skill Generation Utilities
 *
 * Shared utilities for generating skill and command files.
 */

import {
  getExploreSkillTemplate,
  getNewChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getApplyChangeSkillTemplate,
  getFfChangeSkillTemplate,
  getSyncSpecsSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getVerifyChangeSkillTemplate,
  getOnboardSkillTemplate,
  getApeProposeSkillTemplate,
  getFeedbackSkillTemplate,
  getApeFeedbackCommandTemplate,
  getBrainstormingSkillTemplate,
  getDispatchingParallelAgentsSkillTemplate,
  getExecutingPlansSkillTemplate,
  getFinishingADevelopmentBranchSkillTemplate,
  getReceivingCodeReviewSkillTemplate,
  getRequestingCodeReviewSkillTemplate,
  getSubagentDrivenDevelopmentSkillTemplate,
  getWritingPlansSkillTemplate,
  getWritingSkillsSkillTemplate,
  getSystematicDebuggingSkillTemplate,
  getTestDrivenDevelopmentSkillTemplate,
  getUsingGitWorktreesSkillTemplate,
  getUsingSkillsSkillTemplate,
  getVerificationBeforeCompletionSkillTemplate,
  getApeExploreCommandTemplate,
  getApeNewCommandTemplate,
  getApeContinueCommandTemplate,
  getApeApplyCommandTemplate,
  getApeFfCommandTemplate,
  getApeSyncCommandTemplate,
  getApeArchiveCommandTemplate,
  getApeBulkArchiveCommandTemplate,
  getApeVerifyCommandTemplate,
  getApeOnboardCommandTemplate,
  getApeProposeCommandTemplate,
  getApeBrainstormingCommandTemplate,
  getApeDispatchingParallelAgentsCommandTemplate,
  getApeExecutingPlansCommandTemplate,
  getApeFinishingADevelopmentBranchCommandTemplate,
  getApeReceivingCodeReviewCommandTemplate,
  getApeRequestingCodeReviewCommandTemplate,
  getApeSubagentDrivenDevelopmentCommandTemplate,
  getApeSystematicDebuggingCommandTemplate,
  getApeTestDrivenDevelopmentCommandTemplate,
  getApeUsingGitWorktreesCommandTemplate,
  getApeUsingSkillsCommandTemplate,
  getApeVerificationBeforeCompletionCommandTemplate,
  getApeWritingPlansCommandTemplate,
  getApeWritingSkillsCommandTemplate,
  type SkillTemplate,
  type CommandTemplate,
} from '../templates/skill-templates.js';
import type { WorkflowId } from '../profiles.js';
import type { CommandContent } from '../command-generation/index.js';
import { VISIBLE_COMMAND_IDS } from '../templates/visible-command-surface.js';

/**
 * Skill template with directory name and workflow ID mapping.
 * Global skills (methodology) have no workflowId; workflow skills have one.
 */
export interface SkillTemplateEntry {
  template: SkillTemplate;
  dirName: string;
  workflowId?: WorkflowId;
}

/**
 * Determines if a skill template entry is a workflow skill (has a workflow ID).
 */
export function isWorkflowEntry(e: SkillTemplateEntry): boolean {
  return e.workflowId !== undefined;
}

/**
 * Determines if a skill template entry is a global skill (no workflow ID).
 */
export function isGlobalEntry(e: SkillTemplateEntry): boolean {
  return e.workflowId === undefined;
}

/**
 * Command template with ID mapping.
 */
export interface CommandTemplateEntry {
  template: ReturnType<typeof getApeExploreCommandTemplate>;
  id: string;
  scope?: 'workflow' | 'global';
}

/**
 * Gets skill templates with their directory names, optionally filtered by workflow IDs.
 *
 * Returns workflow-scoped entries (filtered by workflowFilter if provided)
 * merged with all global-scoped entries (always included).
 *
 * @param workflowFilter - If provided, only return workflow entries whose workflowId is in this array
 */
export function getSkillTemplates(workflowFilter?: readonly string[]): SkillTemplateEntry[] {
  const workflowEntries: SkillTemplateEntry[] = [
    { template: getExploreSkillTemplate(), dirName: 'apeworkflow-explore', workflowId: 'explore' },
    { template: getNewChangeSkillTemplate(), dirName: 'apeworkflow-new-change', workflowId: 'new' },
    { template: getContinueChangeSkillTemplate(), dirName: 'apeworkflow-continue-change', workflowId: 'continue' },
    { template: getApplyChangeSkillTemplate(), dirName: 'apeworkflow-apply-change', workflowId: 'apply' },
    { template: getFfChangeSkillTemplate(), dirName: 'apeworkflow-ff-change', workflowId: 'ff' },
    { template: getSyncSpecsSkillTemplate(), dirName: 'apeworkflow-sync-specs', workflowId: 'sync' },
    { template: getArchiveChangeSkillTemplate(), dirName: 'apeworkflow-archive-change', workflowId: 'archive' },
    { template: getBulkArchiveChangeSkillTemplate(), dirName: 'apeworkflow-bulk-archive-change', workflowId: 'bulk-archive' },
    { template: getVerifyChangeSkillTemplate(), dirName: 'apeworkflow-verify-change', workflowId: 'verify' },
    { template: getOnboardSkillTemplate(), dirName: 'apeworkflow-onboard', workflowId: 'onboard' },
    { template: getApeProposeSkillTemplate(), dirName: 'apeworkflow-propose', workflowId: 'propose' },
  ];

  // Global skills (methodology)
  const globalEntries: SkillTemplateEntry[] = [
    { template: getFeedbackSkillTemplate(), dirName: 'apeworkflow-feedback' },
    { template: getBrainstormingSkillTemplate(), dirName: 'apeworkflow-brainstorming' },
    { template: getDispatchingParallelAgentsSkillTemplate(), dirName: 'apeworkflow-dispatching-parallel-agents' },
    { template: getExecutingPlansSkillTemplate(), dirName: 'apeworkflow-executing-plans' },
    { template: getFinishingADevelopmentBranchSkillTemplate(), dirName: 'apeworkflow-finishing-a-development-branch' },
    { template: getReceivingCodeReviewSkillTemplate(), dirName: 'apeworkflow-receiving-code-review' },
    { template: getRequestingCodeReviewSkillTemplate(), dirName: 'apeworkflow-requesting-code-review' },
    { template: getSubagentDrivenDevelopmentSkillTemplate(), dirName: 'apeworkflow-subagent-driven-development' },
    { template: getWritingPlansSkillTemplate(), dirName: 'apeworkflow-writing-plans' },
    { template: getWritingSkillsSkillTemplate(), dirName: 'apeworkflow-writing-skills' },
    { template: getSystematicDebuggingSkillTemplate(), dirName: 'apeworkflow-systematic-debugging' },
    { template: getTestDrivenDevelopmentSkillTemplate(), dirName: 'apeworkflow-test-driven-development' },
    { template: getUsingGitWorktreesSkillTemplate(), dirName: 'apeworkflow-using-git-worktrees' },
    { template: getUsingSkillsSkillTemplate(), dirName: 'apeworkflow-using-skills' },
    { template: getVerificationBeforeCompletionSkillTemplate(), dirName: 'apeworkflow-verification-before-completion' },
  ];

  const all: SkillTemplateEntry[] = [...workflowEntries, ...globalEntries];

  if (!workflowFilter) return all;

  const filterSet = new Set(workflowFilter);
  return all.filter(
    entry => isGlobalEntry(entry) || filterSet.has(entry.workflowId!)
  );
}

/**
 * Gets command templates with their IDs, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return templates whose id is in this array
 */
export function getCommandTemplates(workflowFilter?: readonly string[]): CommandTemplateEntry[] {
  // Workflow commands (subject to profile filtering)
  const workflowCommands: CommandTemplateEntry[] = [
    { template: getApeExploreCommandTemplate(), id: 'explore', scope: 'workflow' },
    { template: getApeNewCommandTemplate(), id: 'new', scope: 'workflow' },
    { template: getApeContinueCommandTemplate(), id: 'continue', scope: 'workflow' },
    { template: getApeApplyCommandTemplate(), id: 'apply', scope: 'workflow' },
    { template: getApeFfCommandTemplate(), id: 'ff', scope: 'workflow' },
    { template: getApeSyncCommandTemplate(), id: 'sync', scope: 'workflow' },
    { template: getApeArchiveCommandTemplate(), id: 'archive', scope: 'workflow' },
    { template: getApeBulkArchiveCommandTemplate(), id: 'bulk-archive', scope: 'workflow' },
    { template: getApeVerifyCommandTemplate(), id: 'verify', scope: 'workflow' },
    { template: getApeOnboardCommandTemplate(), id: 'onboard', scope: 'workflow' },
    { template: getApeProposeCommandTemplate(), id: 'propose', scope: 'workflow' },
  ];

  // Global commands (always available, not profile-controlled) — 14 total
  const globalCommands: CommandTemplateEntry[] = [
    { template: getApeBrainstormingCommandTemplate(), id: 'brainstorming', scope: 'global' },
    { template: getApeDispatchingParallelAgentsCommandTemplate(), id: 'dispatching-parallel-agents', scope: 'global' },
    { template: getApeExecutingPlansCommandTemplate(), id: 'executing-plans', scope: 'global' },
    { template: getApeFinishingADevelopmentBranchCommandTemplate(), id: 'finishing-a-development-branch', scope: 'global' },
    { template: getApeReceivingCodeReviewCommandTemplate(), id: 'receiving-code-review', scope: 'global' },
    { template: getApeRequestingCodeReviewCommandTemplate(), id: 'requesting-code-review', scope: 'global' },
    { template: getApeSubagentDrivenDevelopmentCommandTemplate(), id: 'subagent-driven-development', scope: 'global' },
    { template: getApeSystematicDebuggingCommandTemplate(), id: 'systematic-debugging', scope: 'global' },
    { template: getApeTestDrivenDevelopmentCommandTemplate(), id: 'test-driven-development', scope: 'global' },
    { template: getApeUsingGitWorktreesCommandTemplate(), id: 'using-git-worktrees', scope: 'global' },
    { template: getApeUsingSkillsCommandTemplate(), id: 'using-skills', scope: 'global' },
    { template: getApeVerificationBeforeCompletionCommandTemplate(), id: 'verification-before-completion', scope: 'global' },
    { template: getApeWritingPlansCommandTemplate(), id: 'writing-plans', scope: 'global' },
    { template: getApeWritingSkillsCommandTemplate(), id: 'writing-skills', scope: 'global' },
  ];

  if (!workflowFilter) return [...workflowCommands, ...globalCommands];

  const filterSet = new Set(workflowFilter);
  const filteredWorkflow = workflowCommands.filter(entry => filterSet.has(entry.id));
  return [...filteredWorkflow, ...globalCommands];
}

/**
 * Converts command templates to CommandContent array, optionally filtered by workflow IDs.
 *
 * @param workflowFilter - If provided, only return contents whose id is in this array
 */
export function getCommandContents(workflowFilter?: readonly string[]): CommandContent[] {
  const commandTemplates = getCommandTemplates(workflowFilter);
  return commandTemplates.map(({ template, id }) => ({
    id,
    name: template.name,
    description: template.description,
    category: template.category,
    tags: template.tags,
    body: template.content,
  }));
}

const VISIBLE_COMMAND_TEMPLATES: Array<{ id: (typeof VISIBLE_COMMAND_IDS)[number]; template: CommandTemplate }> = [
  { id: 'explore', template: getApeExploreCommandTemplate() },
  { id: 'propose', template: getApeProposeCommandTemplate() },
  { id: 'apply', template: getApeApplyCommandTemplate() },
  { id: 'verify', template: getApeVerifyCommandTemplate() },
  { id: 'archive', template: getApeArchiveCommandTemplate() },
  { id: 'onboard', template: getApeOnboardCommandTemplate() },
  { id: 'bulk-archive', template: getApeBulkArchiveCommandTemplate() },
  { id: 'feedback', template: getApeFeedbackCommandTemplate() },
] as const;

export function getVisibleCommandContents(): CommandContent[] {
  return VISIBLE_COMMAND_TEMPLATES.map(({ id, template }) => ({
    id,
    name: template.name,
    description: template.description,
    category: template.category,
    tags: template.tags,
    body: template.content,
  }));
}

/**
 * Generates skill file content with YAML frontmatter.
 *
 * @param template - The skill template
 * @param generatedByVersion - The ApeWorkflow version to embed in the file
 * @param transformInstructions - Optional callback to transform the instructions content
 */
export function generateSkillContent(
  template: SkillTemplate,
  generatedByVersion: string,
  transformInstructions?: (instructions: string) => string
): string {
  const instructions = transformInstructions
    ? transformInstructions(template.instructions)
    : template.instructions;

  return `---
name: ${template.name}
description: ${template.description}
license: ${template.license || 'MIT'}
compatibility: ${template.compatibility || 'Requires apeworkflow CLI.'}
metadata:
  author: ${template.metadata?.author || 'apeworkflow'}
  version: "${template.metadata?.version || '1.0'}"
  generatedBy: "${generatedByVersion}"
---

${instructions}
`;
}
