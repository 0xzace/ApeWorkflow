import { describe, expect, it } from 'vitest';

import {
  getDispatchingParallelAgentsSkillTemplate,
  getApeDispatchingParallelAgentsCommandTemplate,
  getExecutingPlansSkillTemplate,
  getApeExecutingPlansCommandTemplate,
  getFinishingADevelopmentBranchSkillTemplate,
  getApeFinishingADevelopmentBranchCommandTemplate,
  getReceivingCodeReviewSkillTemplate,
  getApeReceivingCodeReviewCommandTemplate,
  getRequestingCodeReviewSkillTemplate,
  getApeRequestingCodeReviewCommandTemplate,
  getSubagentDrivenDevelopmentSkillTemplate,
  getApeSubagentDrivenDevelopmentCommandTemplate,
  getSystematicDebuggingSkillTemplate,
  getApeSystematicDebuggingCommandTemplate,
  getTestDrivenDevelopmentSkillTemplate,
  getApeTestDrivenDevelopmentCommandTemplate,
  getUsingGitWorktreesSkillTemplate,
  getApeUsingGitWorktreesCommandTemplate,
  getUsingSkillsSkillTemplate,
  getApeUsingSkillsCommandTemplate,
  getVerificationBeforeCompletionSkillTemplate,
  getApeVerificationBeforeCompletionCommandTemplate,
  getWritingSkillsSkillTemplate,
  getApeWritingSkillsCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';

// 中文注释：这一组测试专门把剩余的 methodology 模板工厂全部跑一遍，避免模板文件长期零覆盖。
const methodologyCases = [
  {
    id: 'dispatching-parallel-agents',
    skillFactory: getDispatchingParallelAgentsSkillTemplate,
    commandFactory: getApeDispatchingParallelAgentsCommandTemplate,
    skillAnchor: 'Parallel Agents',
    commandName: 'APE: Dispatching Parallel Agents',
  },
  {
    id: 'executing-plans',
    skillFactory: getExecutingPlansSkillTemplate,
    commandFactory: getApeExecutingPlansCommandTemplate,
    skillAnchor: 'Executing Plans',
    commandName: 'APE: Executing Plans',
  },
  {
    id: 'finishing-a-development-branch',
    skillFactory: getFinishingADevelopmentBranchSkillTemplate,
    commandFactory: getApeFinishingADevelopmentBranchCommandTemplate,
    skillAnchor: 'Finishing a Development Branch',
    commandName: 'APE: Finishing a Development Branch',
  },
  {
    id: 'receiving-code-review',
    skillFactory: getReceivingCodeReviewSkillTemplate,
    commandFactory: getApeReceivingCodeReviewCommandTemplate,
    skillAnchor: 'Code Review Reception',
    commandName: 'APE: Receiving Code Review',
  },
  {
    id: 'requesting-code-review',
    skillFactory: getRequestingCodeReviewSkillTemplate,
    commandFactory: getApeRequestingCodeReviewCommandTemplate,
    skillAnchor: 'Requesting Code Review',
    commandName: 'APE: Requesting Code Review',
  },
  {
    id: 'subagent-driven-development',
    skillFactory: getSubagentDrivenDevelopmentSkillTemplate,
    commandFactory: getApeSubagentDrivenDevelopmentCommandTemplate,
    skillAnchor: 'Subagent-Driven Development',
    commandName: 'APE: Subagent-Driven Development',
  },
  {
    id: 'systematic-debugging',
    skillFactory: getSystematicDebuggingSkillTemplate,
    commandFactory: getApeSystematicDebuggingCommandTemplate,
    skillAnchor: 'Systematic Debugging',
    commandName: 'APE: Systematic Debugging',
  },
  {
    id: 'test-driven-development',
    skillFactory: getTestDrivenDevelopmentSkillTemplate,
    commandFactory: getApeTestDrivenDevelopmentCommandTemplate,
    skillAnchor: 'Test-Driven Development',
    commandName: 'APE: Test-Driven Development',
  },
  {
    id: 'using-git-worktrees',
    skillFactory: getUsingGitWorktreesSkillTemplate,
    commandFactory: getApeUsingGitWorktreesCommandTemplate,
    skillAnchor: 'Git Worktrees',
    commandName: 'APE: Using Git Worktrees',
  },
  {
    id: 'using-skills',
    skillFactory: getUsingSkillsSkillTemplate,
    commandFactory: getApeUsingSkillsCommandTemplate,
    skillAnchor: 'Using Skills',
    commandName: 'APE: Using Skills',
  },
  {
    id: 'verification-before-completion',
    skillFactory: getVerificationBeforeCompletionSkillTemplate,
    commandFactory: getApeVerificationBeforeCompletionCommandTemplate,
    skillAnchor: 'Verification Before Completion',
    commandName: 'APE: Verification Before Completion',
  },
  {
    id: 'writing-skills',
    skillFactory: getWritingSkillsSkillTemplate,
    commandFactory: getApeWritingSkillsCommandTemplate,
    skillAnchor: 'Writing Skills',
    commandName: 'APE: Writing Skills',
  },
] as const;

describe('methodology template coverage', () => {
  it.each(methodologyCases)('loads skill template for $id', ({ skillFactory, skillAnchor }) => {
    const template = skillFactory();

    expect(template.name).toBeTruthy();
    expect(template.description).toBeTruthy();
    expect(template.instructions).toContain(skillAnchor);
  });

  it.each(methodologyCases)('loads command template for $id', ({ commandFactory, commandName, skillAnchor }) => {
    const template = commandFactory();

    expect(template.name).toBe(commandName);
    expect(template.category).toBe('Methodology');
    expect(template.content).toContain(skillAnchor);
  });
});
