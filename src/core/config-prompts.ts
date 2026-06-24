import type { ProjectConfig } from './project-config.js';

/**
 * Serialize config to YAML string with helpful comments.
 *
 * @param config - Partial config object (schema required, context/rules optional)
 * @returns YAML string ready to write to file
 */
export function serializeConfig(config: Partial<ProjectConfig>): string {
  const lines: string[] = [];

  // Schema (required)
  lines.push(`schema: ${config.schema}`);
  lines.push('');

  // Context section with comments
  lines.push('# Project context (optional)');
  lines.push('# This is shown to AI when creating artifacts.');
  lines.push('# Add your tech stack, conventions, style guides, domain knowledge, etc.');
  lines.push('# Example:');
  lines.push('#   context: |');
  lines.push('#     Tech stack: TypeScript, React, Node.js');
  lines.push('#     We use conventional commits');
  lines.push('#     Domain: e-commerce platform');
  lines.push('');

  // Rules section with comments
  lines.push('# Per-artifact rules (optional)');
  lines.push('# Add custom rules for specific artifacts.');
  lines.push('# Example:');
  lines.push('#   rules:');
  lines.push('#     proposal:');
  lines.push('#       - Keep proposals under 500 words');
  lines.push('#       - Always include a "Non-goals" section');
  lines.push('#     tasks:');
  lines.push('#       - Break tasks into chunks of max 2 hours');
  lines.push('');

  // Strictness section (hidden by default — documented for discoverability)
  lines.push('# Methodology strictness (optional)');
  lines.push('# Controls how strictly methodology skills are enforced.');
  lines.push('# strictness:');
  lines.push('#   selectionPolicy: auto-if-single  # or "always-prompt" — change selection strategy');
  lines.push('#   tdd: true                        # true=iron-clad TDD, false=recommended, skip=disabled');
  lines.push('#   noGratitude: false               # true=disable performative thanks from AI');
  lines.push('');

  // Plan section (hidden by default — documented for discoverability)
  lines.push('# Implementation plan settings (optional)');
  lines.push('# Controls how granular plan files are generated.');
  lines.push('# plan:');
  lines.push('#   granularity: medium  # fine=2-5min steps, medium=3-5 steps per task, coarse=1 paragraph');
  lines.push('');

  // Skills section (hidden by default — documented for discoverability)
  lines.push('# Skill loading strategy (optional)');
  lines.push('# Controls how skills are discovered and loaded during use.');
  lines.push('# skills:');
  lines.push('#   loadPolicy: smart    # smart=keyword-based matching, strict=load on any chance');
  lines.push('#   maxDepth: 5          # Maximum skill nesting depth (prevents infinite loops)');
  lines.push('');

  // Onboarding section (hidden by default — documented for discoverability)
  lines.push('# Onboarding experience (optional)');
  lines.push('# Tunes the /ape:onboard guided tour.');
  lines.push('# onboarding:');
  lines.push('#   maxPauses: 5  # Maximum PAUSE points during onboarding (prevents excessive interactivity)');

  return lines.join('\n') + '\n';
}
