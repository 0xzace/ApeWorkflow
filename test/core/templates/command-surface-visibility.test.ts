import { describe, expect, it } from 'vitest';
import { getOnboardSkillTemplate } from '../../../src/core/templates/workflows/onboard.js';
import { getNewChangeSkillTemplate, getApeNewCommandTemplate } from '../../../src/core/templates/workflows/new-change.js';
import { getContinueChangeSkillTemplate, getApeContinueCommandTemplate } from '../../../src/core/templates/workflows/continue-change.js';
import { getFfChangeSkillTemplate, getApeFfCommandTemplate } from '../../../src/core/templates/workflows/ff-change.js';
import { getSyncSpecsSkillTemplate, getApeSyncCommandTemplate } from '../../../src/core/templates/workflows/sync-specs.js';
import { getApplyChangeSkillTemplate, getApeApplyCommandTemplate } from '../../../src/core/templates/workflows/apply-change.js';

describe('command surface visibility', () => {
  // 这里只检查需要隐藏的命令面，确保对外文案不再泄露它们。
  const hiddenCommands = ['/ape:new', '/ape:continue', '/ape:ff', '/ape:sync'];

  it('keeps hidden commands out of onboarding and workflow guidance', () => {
    const bodies = [
      getOnboardSkillTemplate().instructions,
      getNewChangeSkillTemplate().instructions,
      getApeNewCommandTemplate().content,
      getContinueChangeSkillTemplate().instructions,
      getApeContinueCommandTemplate().content,
      getFfChangeSkillTemplate().instructions,
      getApeFfCommandTemplate().content,
      getSyncSpecsSkillTemplate().instructions,
      getApeSyncCommandTemplate().content,
      getApplyChangeSkillTemplate().instructions,
      getApeApplyCommandTemplate().content,
    ];

    for (const body of bodies) {
      for (const hidden of hiddenCommands) {
        expect(body).not.toContain(hidden);
      }
    }
  });

  it('keeps APE Apply on the shell-only routing form', () => {
    const content = getApeApplyCommandTemplate().content;
    expect(content).not.toContain('Make the code changes required');
    expect(content).not.toContain('Write minimal implementation');
  });
});
