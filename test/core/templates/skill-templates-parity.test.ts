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
  getNewChangeSkillTemplate: '15210e9373a444d6ea8b889152146f14a5a6c67fc3830f3908be1da0969559b6',
  getContinueChangeSkillTemplate: 'bc5991255833f89c37fb4845e6c40a551a33069ccadf783e20d01c0e56cfa848',
  getApplyChangeSkillTemplate: '7d8151344131a5a915bc49d8e2206e8adfd09e44bc99328fabed8b8688049fad',
  getFfChangeSkillTemplate: '4d694f967e07abfb6b8f7f975c2dfed24bae69cf51a98ad741908d0a363758c6',
  getSyncSpecsSkillTemplate: '494052dee37f5c9434aeb27d0035b5aee646ff6c38ca5fa5350da74f4ea342fc',
  getOnboardSkillTemplate: '5ff28653f53908fc5e59b37b106b24d6e94ff25317406c52c1a2cd70b480e161',
  getApeExploreCommandTemplate: 'bfd76832653be61bb230dc8d493c440cc23d4026d46b7f3296944f9f173c2b3f',
  getApeNewCommandTemplate: '8192785fba8d80afd76112732fd15da7fa47ef37d453c5defb2ef87c8f3e4b11',
  getApeContinueCommandTemplate: '78caaee6ac4ab123d93bcd30e70e90bba24e1bb9237e97be43b5a99c4a323c3d',
  getApeApplyCommandTemplate: '05ad3f25aef3abe089ad22f56d4adb1ab3061672ad7d2d1092e68a93ef164b5f',
  getApeFfCommandTemplate: '0c26b3f1a4fe68ae7daa047de9c169432f508f1504da999f39560444938c84b5',
  getArchiveChangeSkillTemplate: '8b1c8e84d04d1668841ffed1ae9757bba7adb32a07ccb39ce91f952817229371',
  getBulkArchiveChangeSkillTemplate: 'cde0b69b7592661a2efad7333089c661087417c5e79bf19b8a05f58d5ef43d10',
  getApeSyncCommandTemplate: '41165e394b4bf4c6c291699a76842450e0af25e61188e5bcf9bf74d219bfd1ce',
  getVerifyChangeSkillTemplate: '473557ee48fe9a494c9f7d66a2191d32da11ba7a8a317de8bfae4f93ef88a7b1',
  getApeArchiveCommandTemplate: '88c48b747afae79852d7b92203c7f331234407eddc3f867d4a7b04fa5c932d95',
  getApeOnboardCommandTemplate: 'd30d3069671ad2124f7bfebd94257e2c8ce884725ee0490c9d92cebc2b6ae1fd',
  getApeBulkArchiveCommandTemplate: 'a6c3854ae4eb61cf8922f277b6e1dcd58e6fa19f072dbbfd413cf38c19bb65f6',
  getApeVerifyCommandTemplate: '4c666c6452a32a3c53efe225a03e206dfd2362f00a22260124bbea7f7b8a32a9',
  getApeProposeSkillTemplate: '28e57ae4cd5ea155b43b9a971843bb0444ff7fd62155a55009be638780c4778a',
  getApeProposeCommandTemplate: '42b897c1c42e9485ce2318826aeadfe964f0f6e7b685f20c008c123a28cf7a2a',
  getFeedbackSkillTemplate: '1062057eab299213fdc18db1922cc0b94030c2db04ce80e0641bf3b920cfb92f',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'apeworkflow-explore': '4f691c4ab6edb5f3130ab00e1765c66a76d67ec2a2d6935578f960afecc97e1a',
  'apeworkflow-new-change': '869eb643671906f71d954ec7e86cb0f6082cb6504c33bdca59049b511aed9717',
  'apeworkflow-continue-change': '8262d1bb1c408340fb4f29caa71d553c82e02927247a8f84b4aab4c388937ee9',
  'apeworkflow-apply-change': '385381de70676b350d82879d7f026e9fde433a04f3492bf8fc2e057543ecdab4',
  'apeworkflow-ff-change': 'fd1e51a8435f77107ab6ec5be1c4e6fdf4bcf58082210561b80f52ed031a4db3',
  'apeworkflow-sync-specs': '0de8739f01806377482308895decde1095f7d4af03dadb775a95246fb993720a',
  'apeworkflow-archive-change': 'ab9f0090dad95211e861530280d902b621f6a11e8b5af1ddd89a34aab7a8adf6',
  'apeworkflow-bulk-archive-change': 'c76c4ed42b0c4ceb35132c58b322bae5008705d6f4f911fb57bfde67361bbc2d',
  'apeworkflow-verify-change': '65d91b1062b9df76d1b9072117990da27b698ae592a539d847fb4256a486e723',
  'apeworkflow-onboard': 'b6eeb4ecd3725d9d56446a7471660d2ef5d194ffc5dc98151a2f301137b37138',
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
