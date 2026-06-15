import path from 'path';
import * as fs from 'fs';
import { AI_TOOLS } from './config.js';
import type { Delivery } from './global-config.js';
import { ALL_WORKFLOWS } from './profiles.js';
import { CommandAdapterRegistry } from './command-generation/index.js';
import { COMMAND_IDS, getConfiguredTools } from './shared/index.js';
import { VISIBLE_COMMAND_IDS } from './templates/visible-command-surface.js';

type WorkflowId = (typeof ALL_WORKFLOWS)[number];
const INSTALL_COMMAND_IDS = Array.from(new Set<string>([
  ...COMMAND_IDS,
  ...VISIBLE_COMMAND_IDS,
]));

/**
 * Maps workflow IDs to their skill directory names.
 */
export const WORKFLOW_TO_SKILL_DIR: Record<WorkflowId, string> = {
  'explore': 'apeworkflow-explore',
  'new': 'apeworkflow-new-change',
  'continue': 'apeworkflow-continue-change',
  'apply': 'apeworkflow-apply-change',
  'ff': 'apeworkflow-ff-change',
  'sync': 'apeworkflow-sync-specs',
  'archive': 'apeworkflow-archive-change',
  'bulk-archive': 'apeworkflow-bulk-archive-change',
  'verify': 'apeworkflow-verify-change',
  'onboard': 'apeworkflow-onboard',
  'propose': 'apeworkflow-propose',
};

function toKnownWorkflows(workflows: readonly string[]): WorkflowId[] {
  return workflows.filter(
    (workflow): workflow is WorkflowId =>
      (ALL_WORKFLOWS as readonly string[]).includes(workflow)
  );
}

/**
 * Checks whether a tool has at least one generated ApeWorkflow command file.
 */
export function toolHasAnyConfiguredCommand(projectPath: string, toolId: string): boolean {
  const adapter = CommandAdapterRegistry.get(toolId);
  if (!adapter) return false;

  for (const commandId of INSTALL_COMMAND_IDS) {
    const cmdPath = adapter.getFilePath(commandId);
    const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);
    if (fs.existsSync(fullPath)) {
      return true;
    }
  }

  return false;
}

/**
 * Returns tools with at least one generated command file on disk.
 */
export function getCommandConfiguredTools(projectPath: string): string[] {
  return AI_TOOLS
    .filter((tool) => {
      if (!tool.skillsDir) return false;
      const toolDir = path.join(projectPath, tool.skillsDir);
      try {
        return fs.statSync(toolDir).isDirectory();
      } catch {
        return false;
      }
    })
    .map((tool) => tool.value)
    .filter((toolId) => toolHasAnyConfiguredCommand(projectPath, toolId));
}

/**
 * Returns tools that are configured via either skills or commands.
 */
export function getConfiguredToolsForProfileSync(projectPath: string): string[] {
  const skillConfigured = getConfiguredTools(projectPath);
  const commandConfigured = getCommandConfiguredTools(projectPath);
  return [...new Set([...skillConfigured, ...commandConfigured])];
}

/**
 * Detects if a single tool has profile/delivery drift against the desired state.
 *
 * This function covers:
 * - required artifacts missing for selected workflows
 * - artifacts that should not exist for the selected delivery mode
 * - artifacts for workflows that were deselected from the current profile
 */
export function hasToolProfileOrDeliveryDrift(
  projectPath: string,
  toolId: string,
  desiredWorkflows: readonly string[],
  delivery: Delivery
): boolean {
  const tool = AI_TOOLS.find((t) => t.value === toolId);
  if (!tool?.skillsDir) return false;

  const knownDesiredWorkflows = toKnownWorkflows(desiredWorkflows);
  const desiredWorkflowSet = new Set<WorkflowId>(knownDesiredWorkflows);
  const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');
  const adapter = CommandAdapterRegistry.get(toolId);
  const shouldGenerateSkills = delivery !== 'commands';
  const shouldGenerateCommands = delivery !== 'skills';

  if (shouldGenerateSkills) {
    for (const workflow of knownDesiredWorkflows) {
      const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
      const skillFile = path.join(skillsDir, dirName, 'SKILL.md');
      if (!fs.existsSync(skillFile)) {
        return true;
      }
    }

    // Deselecting workflows in a profile should trigger sync.
    for (const workflow of ALL_WORKFLOWS) {
      if (desiredWorkflowSet.has(workflow)) continue;
      const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
      const skillDir = path.join(skillsDir, dirName);
      if (fs.existsSync(skillDir)) {
        return true;
      }
    }
  } else {
    for (const workflow of ALL_WORKFLOWS) {
      const dirName = WORKFLOW_TO_SKILL_DIR[workflow];
      const skillDir = path.join(skillsDir, dirName);
      if (fs.existsSync(skillDir)) {
        return true;
      }
    }
  }

  if (shouldGenerateCommands && adapter) {
    const desiredCommandSet = new Set<string>(VISIBLE_COMMAND_IDS);

    for (const commandId of VISIBLE_COMMAND_IDS) {
      const cmdPath = adapter.getFilePath(commandId);
      const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);
      if (!fs.existsSync(fullPath)) {
        return true;
      }
    }

    // Extra generated commands outside the visible surface should trigger sync.
    for (const commandId of INSTALL_COMMAND_IDS) {
      if (desiredCommandSet.has(commandId)) continue;
      const cmdPath = adapter.getFilePath(commandId);
      const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);
      if (fs.existsSync(fullPath)) {
        return true;
      }
    }
  } else if (!shouldGenerateCommands && adapter) {
    for (const commandId of INSTALL_COMMAND_IDS) {
      const cmdPath = adapter.getFilePath(commandId);
      const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectPath, cmdPath);
      if (fs.existsSync(fullPath)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Returns configured tools that currently need a profile/delivery sync.
 */
export function getToolsNeedingProfileSync(
  projectPath: string,
  desiredWorkflows: readonly string[],
  delivery: Delivery,
  configuredTools?: readonly string[]
): string[] {
  const tools = configuredTools ? [...new Set(configuredTools)] : getConfiguredToolsForProfileSync(projectPath);
  return tools.filter((toolId) =>
    hasToolProfileOrDeliveryDrift(projectPath, toolId, desiredWorkflows, delivery)
  );
}

/**
 * Detects whether the current project has any profile/delivery drift.
 */
export function hasProjectConfigDrift(
  projectPath: string,
  desiredWorkflows: readonly string[],
  delivery: Delivery
): boolean {
  const configuredTools = getConfiguredToolsForProfileSync(projectPath);
  if (getToolsNeedingProfileSync(projectPath, desiredWorkflows, delivery, configuredTools).length > 0) {
    return true;
  }

  return false;
}
