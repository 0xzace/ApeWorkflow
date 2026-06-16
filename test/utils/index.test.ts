import { describe, expect, it } from 'vitest';

import {
  createChange,
  FileSystemUtils,
  removeMarkerBlock,
  transformToHyphenCommands,
  validateChangeName,
  readChangeMetadata,
  writeChangeMetadata,
  resolveSchemaForChange,
  validateSchemaName,
} from '../../src/utils/index.js';

describe('utils barrel export', () => {
  it('导出核心工具函数', () => {
    // 中文注释：这里直接通过 barrel 入口取值，确保 src/utils/index.ts 真的被执行到。
    expect(validateChangeName('demo')).toEqual({ valid: true });
    expect(typeof createChange).toBe('function');
    expect(typeof readChangeMetadata).toBe('function');
    expect(typeof writeChangeMetadata).toBe('function');
    expect(typeof resolveSchemaForChange).toBe('function');
    expect(typeof validateSchemaName).toBe('function');
    expect(typeof transformToHyphenCommands).toBe('function');
    expect(typeof removeMarkerBlock).toBe('function');
    expect(typeof FileSystemUtils.canonicalizeExistingPath).toBe('function');
  });
});
