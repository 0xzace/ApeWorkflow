import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  type SkillTemplate,
  getApplyChangeSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getBrainstormingSkillTemplate,
  getContinueChangeSkillTemplate,
  getExploreSkillTemplate,
  getFeedbackSkillTemplate,
  getFfChangeSkillTemplate,
  getNewChangeSkillTemplate,
  getOnboardSkillTemplate,
  getApeApplyCommandTemplate,
  getApeArchiveCommandTemplate,
  getApeBulkArchiveCommandTemplate,
  getApeBrainstormingCommandTemplate,
  getApeContinueCommandTemplate,
  getApeExploreCommandTemplate,
  getApeFfCommandTemplate,
  getApeNewCommandTemplate,
  getApeOnboardCommandTemplate,
  getApeSyncCommandTemplate,
  getApeProposeCommandTemplate,
  getApeProposeSkillTemplate,
  getApeFeedbackCommandTemplate,
  getApeVerifyCommandTemplate,
  getApeWritingPlansCommandTemplate,
  getSyncSpecsSkillTemplate,
  getVerifyChangeSkillTemplate,
  getWritingPlansSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: '131cdcb0dc264bd0ca04c6aed4a9497182739423e40c38f67c4f3b06cf06d3e7',
  getNewChangeSkillTemplate: '15210e9373a444d6ea8b889152146f14a5a6c67fc3830f3908be1da0969559b6',
  getBrainstormingSkillTemplate: 'f3af972d16be0cacf6b95135f4630aacf3ddb266561dc9fc55e9dee56feb74d1',
  getContinueChangeSkillTemplate: 'c7e8ec9d0407746ccbabdb5507c96afe75c0ff4b542b723b219e6d81804b5b6b',
  getApplyChangeSkillTemplate: '134fc15be752a376fb82708641162fd2a0db7d41b5efee8b0d69febbcd56431a',
  getFfChangeSkillTemplate: 'ed635dbd529279df70c2971939919878d4998d2066940dc1cfdbb053b4f7a50f',
  getSyncSpecsSkillTemplate: '99e53834c5ae95422d26a3fc2c1ace91ff725a3f11166947ea919f98b1d13850',
  getOnboardSkillTemplate: 'fb880b4098fd69aaf03ebc8d140e91205a3d6e1f00df2062ddc7bbfa5f285d6a',
  getApeExploreCommandTemplate: '0f193839b57c3880fc45d2434fff0107eb8846a0bc0acb157d02e2ee72804c8b',
  getApeNewCommandTemplate: '8192785fba8d80afd76112732fd15da7fa47ef37d453c5defb2ef87c8f3e4b11',
  getApeContinueCommandTemplate: '8506ea084cf4140d95e4e5f3551862bdbc3492d7cc7397d350934549013805c4',
  getApeApplyCommandTemplate: '74236d81ebb70f11fbb631d442bb5eaca42a507539e8b456be1d0b2de1d12204',
  getApeFfCommandTemplate: '80a847e22fe5b3b5ccb5bc53cd68dee3394aa0813ea55249e15cfdc5e0b1d450',
  getArchiveChangeSkillTemplate: '3762e579fec5c146cbc19accd37c458c37ee8246d88796d2d72e4c0c31ea1069',
  getBulkArchiveChangeSkillTemplate: 'cde0b69b7592661a2efad7333089c661087417c5e79bf19b8a05f58d5ef43d10',
  getApeSyncCommandTemplate: '8556723e50ba7fac3fbee439406e1c2ed11566f3d08c13ca340bc35e9bc445f7',
  getVerifyChangeSkillTemplate: 'ab59c261d3de74a72a0611c121d9debc91376cfd6e0d549c39c795379bb8f5ec',
  getApeArchiveCommandTemplate: '62cde76558a2ea360586601a6c5cfefb242d363d85f7af3d7cf695780dc265a5',
  getApeOnboardCommandTemplate: 'e327989d274443b5c5ae3b1ec5681abf8abccf085348e66de9f573119acfcd52',
  getApeBulkArchiveCommandTemplate: 'a6c3854ae4eb61cf8922f277b6e1dcd58e6fa19f072dbbfd413cf38c19bb65f6',
  getApeVerifyCommandTemplate: 'd677166af933e2c5a2fa31b9c7756da2abc635f629ce00bfea1be0d6653a39b9',
  getApeBrainstormingCommandTemplate: '96e907a0f156982c38bcd50adaf4974ecd2e8e6bba9d82127032341f57e5374e',
  getApeProposeSkillTemplate: 'c384340885af9a28f7bd76ddbd2324f2e67c08405a9e9bac043613233df37ec0',
  getApeProposeCommandTemplate: '67518454a6e2690e56dd6be478c47e84f5422ac4062d7bb996c6bf9f812e7a66',
  getWritingPlansSkillTemplate: '77e91046fa6f275f91e85c05f1cd063d74d496660ceeef154decfc150967cf17',
  getApeWritingPlansCommandTemplate: '10a3b5d25027f8e7b33b87e8f2f03430f2ceb802ba7191a79a0b12fe804f22b3',
  getApeFeedbackCommandTemplate: 'e6f9d657f7c8c5a9005041bb076ed165c8ec5482eec32301ce4cba3a2a6758a1',
  getFeedbackSkillTemplate: '33398a868805b6f6f6a45bf1f5ae53f3731aaa941fdbad566129678769d43a49',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'apeworkflow-explore': 'ca7949efc425c171d502f365a9eeb213a50897ca37bba0f3da8db61bd1d198d3',
  'apeworkflow-new-change': '869eb643671906f71d954ec7e86cb0f6082cb6504c33bdca59049b511aed9717',
  'apeworkflow-continue-change': '5eac5e2b8dfc48cb2ff49584678ac7916c3b2144e51025de9028200b3551b39f',
  'apeworkflow-apply-change': 'ef92dae60d17c2e4d0a4faae9d04239c2517cd2bcbe42b03da5c2c6593e8a70c',
  'apeworkflow-ff-change': 'd1776adb65dc9ca9bedd6da7810e2f9d7c83683ab9833493e91fefe11bc4517b',
  'apeworkflow-sync-specs': 'be281e3e04958b50bb15bd0537fed68d5eea7e593992193fb2b9559cc020afbd',
  'apeworkflow-archive-change': '8911e6f8c4507a83ffd5f535ad4271f678eb9ca13c9e523045ddc4f3cb667d60',
  'apeworkflow-bulk-archive-change': 'c76c4ed42b0c4ceb35132c58b322bae5008705d6f4f911fb57bfde67361bbc2d',
  'apeworkflow-verify-change': '47c865011354277ea358728c1762317f85a8a99b883d960243ada081fefda104',
  'apeworkflow-onboard': '51502e41521e7c7a960f39e7d28bd31a6b9770bdff28a714f2bc1735b98b3a06',
  'apeworkflow-brainstorming': 'f8483ed52510b073755fb79fe8ae01f170a6e41c2cfa160bec00bc9adaa0c0a6',
  'apeworkflow-propose': 'f94ec5b3f3b28132eb759c2eb88f2ed62572b15105d649842507c95a24818add',
  'apeworkflow-writing-plans': 'e82fce5ad552b5481fc51c82ba359ab2c6260ac4850b62c9bfd3a5398c0b16a6',
};

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);

    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('skill templates split parity', () => {
  it('preserves all template function payloads exactly', () => {
    const functionFactories: Record<string, () => unknown> = {
      getExploreSkillTemplate,
      getNewChangeSkillTemplate,
      getContinueChangeSkillTemplate,
      getBrainstormingSkillTemplate,
      getApplyChangeSkillTemplate,
      getFfChangeSkillTemplate,
      getSyncSpecsSkillTemplate,
      getOnboardSkillTemplate,
      getApeExploreCommandTemplate,
      getApeNewCommandTemplate,
      getApeContinueCommandTemplate,
      getApeApplyCommandTemplate,
      getApeFfCommandTemplate,
      getArchiveChangeSkillTemplate,
      getBulkArchiveChangeSkillTemplate,
      getApeSyncCommandTemplate,
      getVerifyChangeSkillTemplate,
      getApeArchiveCommandTemplate,
      getApeOnboardCommandTemplate,
      getApeBulkArchiveCommandTemplate,
      getApeVerifyCommandTemplate,
      getApeBrainstormingCommandTemplate,
      getApeProposeSkillTemplate,
      getApeProposeCommandTemplate,
      getWritingPlansSkillTemplate,
      getApeWritingPlansCommandTemplate,
      getApeFeedbackCommandTemplate,
      getFeedbackSkillTemplate,
    };

    const actualHashes = Object.fromEntries(
      Object.entries(functionFactories).map(([name, fn]) => [name, hash(stableStringify(fn()))])
    );

    expect(actualHashes).toEqual(EXPECTED_FUNCTION_HASHES);
  });

  it('preserves generated skill file content exactly', () => {
    // Intentionally excludes getFeedbackSkillTemplate: skillFactories only models templates
    // deployed via generateSkillContent, while feedback is covered in function payload parity.
    const skillFactories: Array<[string, () => SkillTemplate]> = [
      ['apeworkflow-explore', getExploreSkillTemplate],
      ['apeworkflow-new-change', getNewChangeSkillTemplate],
      ['apeworkflow-continue-change', getContinueChangeSkillTemplate],
      ['apeworkflow-brainstorming', getBrainstormingSkillTemplate],
      ['apeworkflow-apply-change', getApplyChangeSkillTemplate],
      ['apeworkflow-ff-change', getFfChangeSkillTemplate],
      ['apeworkflow-sync-specs', getSyncSpecsSkillTemplate],
      ['apeworkflow-archive-change', getArchiveChangeSkillTemplate],
      ['apeworkflow-bulk-archive-change', getBulkArchiveChangeSkillTemplate],
      ['apeworkflow-verify-change', getVerifyChangeSkillTemplate],
      ['apeworkflow-writing-plans', getWritingPlansSkillTemplate],
      ['apeworkflow-onboard', getOnboardSkillTemplate],
      ['apeworkflow-propose', getApeProposeSkillTemplate],
    ];

    const actualHashes = Object.fromEntries(
      skillFactories.map(([dirName, createTemplate]) => [
        dirName,
        hash(generateSkillContent(createTemplate(), 'PARITY-BASELINE')),
      ])
    );

    expect(actualHashes).toEqual(EXPECTED_GENERATED_SKILL_CONTENT_HASHES);
  });

  it('guards unsupported workspace workflows from repo-local fallback edits', () => {
    const guardedSkills: Array<[string, () => SkillTemplate, string]> = [
      ['apeworkflow-apply-change', getApplyChangeSkillTemplate, 'resolveEditScope()'],
      ['apeworkflow-sync-specs', getSyncSpecsSkillTemplate, 'resolveEditScope()'],
      ['apeworkflow-archive-change', getArchiveChangeSkillTemplate, 'resolveEditScope()'],
      ['apeworkflow-bulk-archive-change', getBulkArchiveChangeSkillTemplate, 'workspace bulk archive is not supported'],
      ['apeworkflow-verify-change', getVerifyChangeSkillTemplate, 'full workspace implementation verification is not supported'],
    ];

    for (const [dirName, createTemplate, guardText] of guardedSkills) {
      const content = generateSkillContent(createTemplate(), 'PARITY-BASELINE');

      expect(content, dirName).toContain('actionContext.mode: "workspace-planning"');
      expect(content, dirName).toContain(guardText);
      expect(content, dirName).not.toContain('apeworkflow/changes/<name>');
      expect(content, dirName).not.toContain('mv apeworkflow/changes');
    }
  });
});
