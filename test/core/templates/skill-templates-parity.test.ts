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
  getExploreSkillTemplate: '7f4a2f4ba949f068417e1a5acaf8213f7f1ecefdc3d4008a61a5f8aadbc152a0',
  getNewChangeSkillTemplate: '95ab5fcd6a5b326ad5a507e125fac3c69277eb9d9f4d889f348052043d1dedcc',
  getContinueChangeSkillTemplate: 'bc5991255833f89c37fb4845e6c40a551a33069ccadf783e20d01c0e56cfa848',
  getApplyChangeSkillTemplate: '7d8151344131a5a915bc49d8e2206e8adfd09e44bc99328fabed8b8688049fad',
  getFfChangeSkillTemplate: 'c43093d05453a380bbc2a721bb0284af932df2515f7f62ba3331ae91e2856894',
  getSyncSpecsSkillTemplate: '494052dee37f5c9434aeb27d0035b5aee646ff6c38ca5fa5350da74f4ea342fc',
  getOnboardSkillTemplate: 'c0e64731f7b6d4c5a3e9fabf3bcb616fdf638a6d11e44f5b1a844c4aa4c96c81',
  getApeExploreCommandTemplate: 'bfd76832653be61bb230dc8d493c440cc23d4026d46b7f3296944f9f173c2b3f',
  getApeNewCommandTemplate: '25ed53b94fe3d379a114c8adeb79e93d4029dbd0c548fae98059bf960aab4cca',
  getApeContinueCommandTemplate: 'fcf034a3e8d6ce3d4aeb2e1ae7b9c237648f17528a3418eda8183573b95c9e39',
  getApeApplyCommandTemplate: 'ea299b4748ec8206ffb3c31060700f36f76d251f449afe6c7c277da53a2402ed',
  getApeFfCommandTemplate: '780e67903bb0eb0cd9012ef23c3eb05a0e4b16ba706d262eb3e00eeccd06b434',
  getArchiveChangeSkillTemplate: '8b1c8e84d04d1668841ffed1ae9757bba7adb32a07ccb39ce91f952817229371',
  getBulkArchiveChangeSkillTemplate: 'cde0b69b7592661a2efad7333089c661087417c5e79bf19b8a05f58d5ef43d10',
  getApeSyncCommandTemplate: '3dc761b1a3957c20e734ec5ee1449fda572f73be5884bb8f87a19b36d4859c79',
  getVerifyChangeSkillTemplate: '473557ee48fe9a494c9f7d66a2191d32da11ba7a8a317de8bfae4f93ef88a7b1',
  getApeArchiveCommandTemplate: 'b756253420746e04f3d84c8388ed98244ce88ba02e4e867d8e329dac22845607',
  getApeOnboardCommandTemplate: 'bfbaa10f46e783c4e2bf0cf3b0c3cb7d5c55d73151bb0782f39b3bb418f337a3',
  getApeBulkArchiveCommandTemplate: 'a6c3854ae4eb61cf8922f277b6e1dcd58e6fa19f072dbbfd413cf38c19bb65f6',
  getApeVerifyCommandTemplate: '60dfe1dd95eed7ee9be92f9aa51779ca5bd7aa578d6161a180786dea7399f884',
  getApeProposeSkillTemplate: '28e57ae4cd5ea155b43b9a971843bb0444ff7fd62155a55009be638780c4778a',
  getApeProposeCommandTemplate: '42b897c1c42e9485ce2318826aeadfe964f0f6e7b685f20c008c123a28cf7a2a',
  getFeedbackSkillTemplate: '1062057eab299213fdc18db1922cc0b94030c2db04ce80e0641bf3b920cfb92f',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'apeworkflow-explore': '4f691c4ab6edb5f3130ab00e1765c66a76d67ec2a2d6935578f960afecc97e1a',
  'apeworkflow-new-change': 'edb99062c155391fafde9f17b6be19acba2e1df749dc356521b6dab8f9d259fc',
  'apeworkflow-continue-change': '8262d1bb1c408340fb4f29caa71d553c82e02927247a8f84b4aab4c388937ee9',
  'apeworkflow-apply-change': '385381de70676b350d82879d7f026e9fde433a04f3492bf8fc2e057543ecdab4',
  'apeworkflow-ff-change': 'ca0e9c4434810a0c13eb4cd93a33dceedf20e2254feb275dc28cc765738f4668',
  'apeworkflow-sync-specs': '0de8739f01806377482308895decde1095f7d4af03dadb775a95246fb993720a',
  'apeworkflow-archive-change': 'ab9f0090dad95211e861530280d902b621f6a11e8b5af1ddd89a34aab7a8adf6',
  'apeworkflow-bulk-archive-change': 'c76c4ed42b0c4ceb35132c58b322bae5008705d6f4f911fb57bfde67361bbc2d',
  'apeworkflow-verify-change': '65d91b1062b9df76d1b9072117990da27b698ae592a539d847fb4256a486e723',
  'apeworkflow-onboard': 'da7f4e43257800c35bac2f065046ccf05e192d702897c9ceda70eb74744911b8',
  'apeworkflow-propose': '3d208d72d62f84fa696635c855ade8b18f78976f68e940a81e8303163e582e24',
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
