/**
 * Agent Skill Templates
 *
 * Compatibility facade that re-exports split workflow template modules.
 */

export type { SkillTemplate, CommandTemplate } from './types.js';

export { getExploreSkillTemplate, getApeExploreCommandTemplate } from './workflows/explore.js';
export { getNewChangeSkillTemplate, getApeNewCommandTemplate } from './workflows/new-change.js';
export { getContinueChangeSkillTemplate, getApeContinueCommandTemplate } from './workflows/continue-change.js';
export { getApplyChangeSkillTemplate, getApeApplyCommandTemplate } from './workflows/apply-change.js';
export { getFfChangeSkillTemplate, getApeFfCommandTemplate } from './workflows/ff-change.js';
export { getSyncSpecsSkillTemplate, getApeSyncCommandTemplate } from './workflows/sync-specs.js';
export { getArchiveChangeSkillTemplate, getApeArchiveCommandTemplate } from './workflows/archive-change.js';
export { getBulkArchiveChangeSkillTemplate, getApeBulkArchiveCommandTemplate } from './workflows/bulk-archive-change.js';
export { getVerifyChangeSkillTemplate, getApeVerifyCommandTemplate } from './workflows/verify-change.js';
export { getOnboardSkillTemplate, getApeOnboardCommandTemplate } from './workflows/onboard.js';
export { getApeProposeSkillTemplate, getApeProposeCommandTemplate } from './workflows/propose.js';
export { getFeedbackSkillTemplate, getApeFeedbackCommandTemplate } from './workflows/feedback.js';
export { getBrainstormingSkillTemplate } from './workflows/apeworkflow-brainstorming.js';
export { getDispatchingParallelAgentsSkillTemplate } from './workflows/apeworkflow-dispatching-parallel-agents.js';
export { getExecutingPlansSkillTemplate } from './workflows/apeworkflow-executing-plans.js';
export { getFinishingADevelopmentBranchSkillTemplate } from './workflows/apeworkflow-finishing-a-development-branch.js';
export { getReceivingCodeReviewSkillTemplate } from './workflows/apeworkflow-receiving-code-review.js';
export { getRequestingCodeReviewSkillTemplate } from './workflows/apeworkflow-requesting-code-review.js';
export { getSubagentDrivenDevelopmentSkillTemplate } from './workflows/apeworkflow-subagent-driven-development.js';
export { getSystematicDebuggingSkillTemplate } from './workflows/apeworkflow-systematic-debugging.js';
export { getTestDrivenDevelopmentSkillTemplate } from './workflows/apeworkflow-test-driven-development.js';
export { getUsingGitWorktreesSkillTemplate } from './workflows/apeworkflow-using-git-worktrees.js';
export { getUsingSkillsSkillTemplate } from './workflows/apeworkflow-using-skills.js';
export { getVerificationBeforeCompletionSkillTemplate } from './workflows/apeworkflow-verification-before-completion.js';
export { getWritingPlansSkillTemplate } from './workflows/apeworkflow-writing-plans.js';
export { getWritingSkillsSkillTemplate } from './workflows/apeworkflow-writing-skills.js';

export { getApeBrainstormingCommandTemplate } from './workflows/apeworkflow-brainstorming.js';
export { getApeDispatchingParallelAgentsCommandTemplate } from './workflows/apeworkflow-dispatching-parallel-agents.js';
export { getApeExecutingPlansCommandTemplate } from './workflows/apeworkflow-executing-plans.js';
export { getApeFinishingADevelopmentBranchCommandTemplate } from './workflows/apeworkflow-finishing-a-development-branch.js';
export { getApeReceivingCodeReviewCommandTemplate } from './workflows/apeworkflow-receiving-code-review.js';
export { getApeRequestingCodeReviewCommandTemplate } from './workflows/apeworkflow-requesting-code-review.js';
export { getApeSubagentDrivenDevelopmentCommandTemplate } from './workflows/apeworkflow-subagent-driven-development.js';
export { getApeSystematicDebuggingCommandTemplate } from './workflows/apeworkflow-systematic-debugging.js';
export { getApeTestDrivenDevelopmentCommandTemplate } from './workflows/apeworkflow-test-driven-development.js';
export { getApeUsingGitWorktreesCommandTemplate } from './workflows/apeworkflow-using-git-worktrees.js';
export { getApeUsingSkillsCommandTemplate } from './workflows/apeworkflow-using-skills.js';
export { getApeVerificationBeforeCompletionCommandTemplate } from './workflows/apeworkflow-verification-before-completion.js';
export { getApeWritingPlansCommandTemplate } from './workflows/apeworkflow-writing-plans.js';
export { getApeWritingSkillsCommandTemplate } from './workflows/apeworkflow-writing-skills.js';
