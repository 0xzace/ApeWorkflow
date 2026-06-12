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
  type SkillTemplate,
} from '../templates/skill-templates.js';
import type { WorkflowId } from '../profiles.js';
import type { CommandContent } from '../command-generation/index.js';

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

  // Global skills (methodology) — empty for now, feedback already registered
  const globalEntries: SkillTemplateEntry[] = [
    { template: getFeedbackSkillTemplate(), dirName: 'apeworkflow-feedback' },
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
  const all: CommandTemplateEntry[] = [
    { template: getApeExploreCommandTemplate(), id: 'explore' },
    { template: getApeNewCommandTemplate(), id: 'new' },
    { template: getApeContinueCommandTemplate(), id: 'continue' },
    { template: getApeApplyCommandTemplate(), id: 'apply' },
    { template: getApeFfCommandTemplate(), id: 'ff' },
    { template: getApeSyncCommandTemplate(), id: 'sync' },
    { template: getApeArchiveCommandTemplate(), id: 'archive' },
    { template: getApeBulkArchiveCommandTemplate(), id: 'bulk-archive' },
    { template: getApeVerifyCommandTemplate(), id: 'verify' },
    { template: getApeOnboardCommandTemplate(), id: 'onboard' },
    { template: getApeProposeCommandTemplate(), id: 'propose' },
  ];

  if (!workflowFilter) return all;

  const filterSet = new Set(workflowFilter);
  return all.filter(entry => filterSet.has(entry.id));
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
