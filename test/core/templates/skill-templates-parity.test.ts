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
  getBrainstormingSkillTemplate: 'dba8b65ca449c69e4a4b428963e9e6b5a6b5a6bcec69097de5b4d0d9a746a6c1',
  getContinueChangeSkillTemplate: 'c7e8ec9d0407746ccbabdb5507c96afe75c0ff4b542b723b219e6d81804b5b6b',
  getApplyChangeSkillTemplate: '85868af40135ecafbf3f0d422dcc32663e1556554bdbd000be117c9fc06764f0',
  getFfChangeSkillTemplate: 'ed635dbd529279df70c2971939919878d4998d2066940dc1cfdbb053b4f7a50f',
  getSyncSpecsSkillTemplate: '494052dee37f5c9434aeb27d0035b5aee646ff6c38ca5fa5350da74f4ea342fc',
  getOnboardSkillTemplate: '41263103a8369be56e6e182c73f94d5d1dc484b16cfedf0d94496341767abe43',
  getApeExploreCommandTemplate: 'cd2fdac013fa17aead29fd1541341bbf8ea253d916ab58dbcef02ec9f8108c9a',
  getApeNewCommandTemplate: '8192785fba8d80afd76112732fd15da7fa47ef37d453c5defb2ef87c8f3e4b11',
  getApeContinueCommandTemplate: '8506ea084cf4140d95e4e5f3551862bdbc3492d7cc7397d350934549013805c4',
  getApeApplyCommandTemplate: '9f075f9d8bb25f78bc630aef6f8c033f7801677389a40e0256b72835f0fbc513',
  getApeFfCommandTemplate: '80a847e22fe5b3b5ccb5bc53cd68dee3394aa0813ea55249e15cfdc5e0b1d450',
  getArchiveChangeSkillTemplate: '919542a8d7812d6026244d20071cb26827fa5feb4dab0e6ff25d32d4ad444988',
  getBulkArchiveChangeSkillTemplate: 'cde0b69b7592661a2efad7333089c661087417c5e79bf19b8a05f58d5ef43d10',
  getApeSyncCommandTemplate: '41165e394b4bf4c6c291699a76842450e0af25e61188e5bcf9bf74d219bfd1ce',
  getVerifyChangeSkillTemplate: '25768008d077719fd6b19bef5f04896ab236544395289a6d2fd74105b31e496a',
  getApeArchiveCommandTemplate: 'cce248624e2c03007f110cdabe1b37022047fd597790ed81ea36c75bc12847f8',
  getApeOnboardCommandTemplate: 'f88fbabe4cf7fe12750d0ad6e36fba6dbdbeb4824fcd86f6adddcde22f7bd4a9',
  getApeBulkArchiveCommandTemplate: 'a6c3854ae4eb61cf8922f277b6e1dcd58e6fa19f072dbbfd413cf38c19bb65f6',
  getApeVerifyCommandTemplate: '6113d7d69fbb5efc0897104d883da57113d5ce519212efec11b3878c8e55c9c5',
  getApeBrainstormingCommandTemplate: '8e2b8c4cc2a33e7326844ed152d05dd9b0ae354bcbc41442d7346cd1fb24edff',
  getApeProposeSkillTemplate: 'c384340885af9a28f7bd76ddbd2324f2e67c08405a9e9bac043613233df37ec0',
  getApeProposeCommandTemplate: '558cf11e8e59da7c93d634b0ca90a7947b8da0f22eca5123084940c352666356',
  getWritingPlansSkillTemplate: '77e91046fa6f275f91e85c05f1cd063d74d496660ceeef154decfc150967cf17',
  getApeWritingPlansCommandTemplate: '10a3b5d25027f8e7b33b87e8f2f03430f2ceb802ba7191a79a0b12fe804f22b3',
  getApeFeedbackCommandTemplate: '64a41ece5a3dcb7f5806af0e178c74e396d2b03c6437ad87c847220f693b207b',
  getFeedbackSkillTemplate: '1062057eab299213fdc18db1922cc0b94030c2db04ce80e0641bf3b920cfb92f',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'apeworkflow-explore': 'bfeed2adeeb6e88871bf4c8f6ee28bf8bfb0e23c11ab753d1b6172b6b647201c',
  'apeworkflow-new-change': '869eb643671906f71d954ec7e86cb0f6082cb6504c33bdca59049b511aed9717',
  'apeworkflow-continue-change': '5eac5e2b8dfc48cb2ff49584678ac7916c3b2144e51025de9028200b3551b39f',
  'apeworkflow-apply-change': 'f8ad1f08c8d6a998785e59e4720420f7733160e69674cf12ba0c19fe68bddf63',
  'apeworkflow-ff-change': 'd1776adb65dc9ca9bedd6da7810e2f9d7c83683ab9833493e91fefe11bc4517b',
  'apeworkflow-sync-specs': '0de8739f01806377482308895decde1095f7d4af03dadb775a95246fb993720a',
  'apeworkflow-archive-change': 'c02d5641cda61464b3a1409032446fb250fe8fa2a29ba7e020553eae2ee06e2d',
  'apeworkflow-bulk-archive-change': 'c76c4ed42b0c4ceb35132c58b322bae5008705d6f4f911fb57bfde67361bbc2d',
  'apeworkflow-verify-change': 'e511a6b9ad9370cbc1c020b0e074eaff17de46a2f667f7044897f7d00d6ac372',
  'apeworkflow-onboard': '6004a8279cd631fc69f9d7d0ca4c7f9860050b69b03e063920c130f025866912',
  'apeworkflow-brainstorming': '400c3a443a599c5aeb2b5e81f0e386f74f98d55e9b899b2aafea52ef9ec13d8a',
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
