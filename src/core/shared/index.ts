/**
 * Shared Utilities
 *
 * Common code shared between init and update commands.
 */

export {
  SKILL_NAMES,
  type SkillName,
  WORKFLOW_SKILL_NAMES,
  GLOBAL_SKILL_NAMES,
  WORKFLOW_COMMAND_IDS,
  GLOBAL_COMMAND_IDS,
  COMMAND_IDS,
  type WorkflowCommandId,
  type GlobalCommandId,
  type CommandId,
  type ToolSkillStatus,
  type ToolVersionStatus,
  getToolsWithSkillsDir,
  getToolSkillStatus,
  getToolStates,
  extractGeneratedByVersion,
  getToolVersionStatus,
  getConfiguredTools,
  getAllToolVersionStatus,
} from './tool-detection.js';

export {
  type SkillTemplateEntry,
  type CommandTemplateEntry,
  getSkillTemplates,
  isWorkflowEntry,
  isGlobalEntry,
  getCommandTemplates,
  getCommandContents,
  generateSkillContent,
} from './skill-generation.js';
