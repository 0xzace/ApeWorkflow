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
  getExploreSkillTemplate: '9c5bfeb15933787b2d141afb9fddd9a4dd046acc9900cc4a1f12698cd4abf20c',
  getNewChangeSkillTemplate: '15210e9373a444d6ea8b889152146f14a5a6c67fc3830f3908be1da0969559b6',
  getBrainstormingSkillTemplate: 'f3af972d16be0cacf6b95135f4630aacf3ddb266561dc9fc55e9dee56feb74d1',
  getContinueChangeSkillTemplate: 'c7e8ec9d0407746ccbabdb5507c96afe75c0ff4b542b723b219e6d81804b5b6b',
  getApplyChangeSkillTemplate: 'd3149797d1f15ae198c38b8fb404b45ad83ba31c36699f8f53da3090f0ccbf17',
  getFfChangeSkillTemplate: 'ed635dbd529279df70c2971939919878d4998d2066940dc1cfdbb053b4f7a50f',
  getSyncSpecsSkillTemplate: '494052dee37f5c9434aeb27d0035b5aee646ff6c38ca5fa5350da74f4ea342fc',
  getOnboardSkillTemplate: 'fb880b4098fd69aaf03ebc8d140e91205a3d6e1f00df2062ddc7bbfa5f285d6a',
  getApeExploreCommandTemplate: '0f193839b57c3880fc45d2434fff0107eb8846a0bc0acb157d02e2ee72804c8b',
  getApeNewCommandTemplate: '8192785fba8d80afd76112732fd15da7fa47ef37d453c5defb2ef87c8f3e4b11',
  getApeContinueCommandTemplate: '8506ea084cf4140d95e4e5f3551862bdbc3492d7cc7397d350934549013805c4',
  getApeApplyCommandTemplate: '28e56e5e32486c3812975938f97593dbcb4f9ba6f328795f6ec550bfe4e9a520',
  getApeFfCommandTemplate: '80a847e22fe5b3b5ccb5bc53cd68dee3394aa0813ea55249e15cfdc5e0b1d450',
  getArchiveChangeSkillTemplate: '93d8bd9ccb14d1a803caf12a7e5c66ee03d8d65e1f0ab8eb319b1ac8533dd604',
  getBulkArchiveChangeSkillTemplate: 'cde0b69b7592661a2efad7333089c661087417c5e79bf19b8a05f58d5ef43d10',
  getApeSyncCommandTemplate: '41165e394b4bf4c6c291699a76842450e0af25e61188e5bcf9bf74d219bfd1ce',
  getVerifyChangeSkillTemplate: 'ab59c261d3de74a72a0611c121d9debc91376cfd6e0d549c39c795379bb8f5ec',
  getApeArchiveCommandTemplate: '22021af19ed7ac17a55b164d526dacd0613d2a286e262fd603d0a4fa40388ab6',
  getApeOnboardCommandTemplate: 'e327989d274443b5c5ae3b1ec5681abf8abccf085348e66de9f573119acfcd52',
  getApeBulkArchiveCommandTemplate: 'a6c3854ae4eb61cf8922f277b6e1dcd58e6fa19f072dbbfd413cf38c19bb65f6',
  getApeVerifyCommandTemplate: 'd677166af933e2c5a2fa31b9c7756da2abc635f629ce00bfea1be0d6653a39b9',
  getApeBrainstormingCommandTemplate: '96e907a0f156982c38bcd50adaf4974ecd2e8e6bba9d82127032341f57e5374e',
  getApeProposeSkillTemplate: 'c384340885af9a28f7bd76ddbd2324f2e67c08405a9e9bac043613233df37ec0',
  getApeProposeCommandTemplate: '67518454a6e2690e56dd6be478c47e84f5422ac4062d7bb996c6bf9f812e7a66',
  getWritingPlansSkillTemplate: '77e91046fa6f275f91e85c05f1cd063d74d496660ceeef154decfc150967cf17',
  getApeWritingPlansCommandTemplate: '10a3b5d25027f8e7b33b87e8f2f03430f2ceb802ba7191a79a0b12fe804f22b3',
  getApeFeedbackCommandTemplate: 'e6f9d657f7c8c5a9005041bb076ed165c8ec5482eec32301ce4cba3a2a6758a1',
  getFeedbackSkillTemplate: '1062057eab299213fdc18db1922cc0b94030c2db04ce80e0641bf3b920cfb92f',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'apeworkflow-explore': 'bfeed2adeeb6e88871bf4c8f6ee28bf8bfb0e23c11ab753d1b6172b6b647201c',
  'apeworkflow-new-change': '869eb643671906f71d954ec7e86cb0f6082cb6504c33bdca59049b511aed9717',
  'apeworkflow-continue-change': '5eac5e2b8dfc48cb2ff49584678ac7916c3b2144e51025de9028200b3551b39f',
  'apeworkflow-apply-change': '1b0530712171ec4580855f6f7508a3284552dc0c58de9fed32bcb694a362099d',
  'apeworkflow-ff-change': 'd1776adb65dc9ca9bedd6da7810e2f9d7c83683ab9833493e91fefe11bc4517b',
  'apeworkflow-sync-specs': '0de8739f01806377482308895decde1095f7d4af03dadb775a95246fb993720a',
  'apeworkflow-archive-change': '011923ebb06b1232484997e16e5a7cceead24c45cf8afba182fb24ebe4fb0a62',
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
      ['apeworkflow-apply-change', getApplyChangeSkillTemplate, 'full workspace apply is not supported'],
      ['apeworkflow-sync-specs', getSyncSpecsSkillTemplate, 'workspace spec sync is not supported'],
      ['apeworkflow-archive-change', getArchiveChangeSkillTemplate, 'workspace archive is not supported'],
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
