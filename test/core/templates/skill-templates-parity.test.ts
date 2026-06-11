import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  type SkillTemplate,
  getApplyChangeSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getExploreSkillTemplate,
  getFeedbackSkillTemplate,
  getFfChangeSkillTemplate,
  getNewChangeSkillTemplate,
  getOnboardSkillTemplate,
  getApeApplyCommandTemplate,
  getApeArchiveCommandTemplate,
  getApeBulkArchiveCommandTemplate,
  getApeContinueCommandTemplate,
  getApeExploreCommandTemplate,
  getApeFfCommandTemplate,
  getApeNewCommandTemplate,
  getApeOnboardCommandTemplate,
  getApeSyncCommandTemplate,
  getApeProposeCommandTemplate,
  getApeProposeSkillTemplate,
  getApeVerifyCommandTemplate,
  getSyncSpecsSkillTemplate,
  getVerifyChangeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: 'de87aaeb968795c7f82a1582d83c0dde4a864b26d76de4b390597c7d4a58438d',
  getNewChangeSkillTemplate: '95ab5fcd6a5b326ad5a507e125fac3c69277eb9d9f4d889f348052043d1dedcc',
  getContinueChangeSkillTemplate: 'bc5991255833f89c37fb4845e6c40a551a33069ccadf783e20d01c0e56cfa848',
  getApplyChangeSkillTemplate: '2a08a59c59da1c27591be29d0794ab8cfa1721b29e4ff305c41655669833a76e',
  getFfChangeSkillTemplate: 'c43093d05453a380bbc2a721bb0284af932df2515f7f62ba3331ae91e2856894',
  getSyncSpecsSkillTemplate: '494052dee37f5c9434aeb27d0035b5aee646ff6c38ca5fa5350da74f4ea342fc',
  getOnboardSkillTemplate: 'c0e64731f7b6d4c5a3e9fabf3bcb616fdf638a6d11e44f5b1a844c4aa4c96c81',
  getApeExploreCommandTemplate: 'bfd76832653be61bb230dc8d493c440cc23d4026d46b7f3296944f9f173c2b3f',
  getApeNewCommandTemplate: '25ed53b94fe3d379a114c8adeb79e93d4029dbd0c548fae98059bf960aab4cca',
  getApeContinueCommandTemplate: 'fcf034a3e8d6ce3d4aeb2e1ae7b9c237648f17528a3418eda8183573b95c9e39',
  getApeApplyCommandTemplate: 'ea299b4748ec8206ffb3c31060700f36f76d251f449afe6c7c277da53a2402ed',
  getApeFfCommandTemplate: '780e67903bb0eb0cd9012ef23c3eb05a0e4b16ba706d262eb3e00eeccd06b434',
  getArchiveChangeSkillTemplate: 'a76b64311af651d4b98e55bda2c67e8580aec8c6fa85e94ee9d6584ff62a680d',
  getBulkArchiveChangeSkillTemplate: 'cde0b69b7592661a2efad7333089c661087417c5e79bf19b8a05f58d5ef43d10',
  getApeSyncCommandTemplate: '3dc761b1a3957c20e734ec5ee1449fda572f73be5884bb8f87a19b36d4859c79',
  getVerifyChangeSkillTemplate: 'b733dc9ed78407040968c43302ccd0f758d29c90bc1c1caf6862d85b9c951ceb',
  getApeArchiveCommandTemplate: 'b756253420746e04f3d84c8388ed98244ce88ba02e4e867d8e329dac22845607',
  getApeOnboardCommandTemplate: 'bfbaa10f46e783c4e2bf0cf3b0c3cb7d5c55d73151bb0782f39b3bb418f337a3',
  getApeBulkArchiveCommandTemplate: 'a6c3854ae4eb61cf8922f277b6e1dcd58e6fa19f072dbbfd413cf38c19bb65f6',
  getApeVerifyCommandTemplate: '60dfe1dd95eed7ee9be92f9aa51779ca5bd7aa578d6161a180786dea7399f884',
  getApeProposeSkillTemplate: '7fabe0809175846374676cc2e7ed8946e9d42d1a99159aa20c8c23cbde8b026e',
  getApeProposeCommandTemplate: '42b897c1c42e9485ce2318826aeadfe964f0f6e7b685f20c008c123a28cf7a2a',
  getFeedbackSkillTemplate: '1062057eab299213fdc18db1922cc0b94030c2db04ce80e0641bf3b920cfb92f',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'apeworkflow-explore': 'ca1362af2da916e88b11ab34200313aca6c000b8e0fedf5271afdf4ca240da6d',
  'apeworkflow-new-change': 'edb99062c155391fafde9f17b6be19acba2e1df749dc356521b6dab8f9d259fc',
  'apeworkflow-continue-change': '8262d1bb1c408340fb4f29caa71d553c82e02927247a8f84b4aab4c388937ee9',
  'apeworkflow-apply-change': '98cb79caec3b5ac4f8118a070eb67ce062115785901ee3e025cb29c64c738cf1',
  'apeworkflow-ff-change': 'ca0e9c4434810a0c13eb4cd93a33dceedf20e2254feb275dc28cc765738f4668',
  'apeworkflow-sync-specs': '0de8739f01806377482308895decde1095f7d4af03dadb775a95246fb993720a',
  'apeworkflow-archive-change': 'a8f91d6bfb35c28696bc3804eed0eb736623ae6c3607f4ab6a7bcabc57cd08e0',
  'apeworkflow-bulk-archive-change': 'c76c4ed42b0c4ceb35132c58b322bae5008705d6f4f911fb57bfde67361bbc2d',
  'apeworkflow-verify-change': 'd38309e8f2dfd18478398bab0d690af9cb596fd4878677ab2143d63540ef9e95',
  'apeworkflow-onboard': 'da7f4e43257800c35bac2f065046ccf05e192d702897c9ceda70eb74744911b8',
  'apeworkflow-propose': 'c2f3dfd021550dde7438087923c5ab813a47a953ca117e41a6820bd8e04dc299',
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
      getApeProposeSkillTemplate,
      getApeProposeCommandTemplate,
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
      ['apeworkflow-apply-change', getApplyChangeSkillTemplate],
      ['apeworkflow-ff-change', getFfChangeSkillTemplate],
      ['apeworkflow-sync-specs', getSyncSpecsSkillTemplate],
      ['apeworkflow-archive-change', getArchiveChangeSkillTemplate],
      ['apeworkflow-bulk-archive-change', getBulkArchiveChangeSkillTemplate],
      ['apeworkflow-verify-change', getVerifyChangeSkillTemplate],
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
