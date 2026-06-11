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
export { getFeedbackSkillTemplate } from './workflows/feedback.js';
