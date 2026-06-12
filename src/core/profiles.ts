/**
 * Profile System
 *
 * Defines workflow profiles that control which workflows are installed.
 * Profiles determine WHICH workflows; delivery (in global config) determines HOW.
 */

import type { Profile } from './global-config.js';

/**
 * Core workflows included in the 'core' profile.
 * These provide the streamlined experience for new users.
 */
export const CORE_WORKFLOWS = ['propose', 'explore', 'apply', 'sync', 'archive'] as const;

/**
 * All available workflows in the system.
 */
export const ALL_WORKFLOWS = [
  'propose',
  'explore',
  'new',
  'continue',
  'apply',
  'ff',
  'sync',
  'archive',
  'bulk-archive',
  'verify',
  'onboard',
] as const;

/**
 * Global (methodology) skills that are always present, independent of profile.
 */
export const ALL_GLOBAL_SKILLS = [
  'apeworkflow-brainstorming',
  'apeworkflow-dispatching-parallel-agents',
  'apeworkflow-executing-plans',
  'apeworkflow-finishing-a-development-branch',
  'apeworkflow-receiving-code-review',
  'apeworkflow-requesting-code-review',
  'apeworkflow-subagent-driven-development',
  'apeworkflow-systematic-debugging',
  'apeworkflow-test-driven-development',
  'apeworkflow-using-git-worktrees',
  'apeworkflow-using-skills',
  'apeworkflow-verification-before-completion',
  'apeworkflow-writing-plans',
  'apeworkflow-writing-skills',
  'apeworkflow-feedback',
] as const;

export type WorkflowId = (typeof ALL_WORKFLOWS)[number];
export type CoreWorkflowId = (typeof CORE_WORKFLOWS)[number];

/**
 * Resolves which workflows should be active for a given profile configuration.
 *
 * - 'core' profile always returns CORE_WORKFLOWS
 * - 'custom' profile returns the provided customWorkflows, or empty array if not provided
 */
export function getProfileWorkflows(
  profile: Profile,
  customWorkflows?: string[]
): readonly string[] {
  if (profile === 'custom') {
    return customWorkflows ?? [];
  }
  return CORE_WORKFLOWS;
}
