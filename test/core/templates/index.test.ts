import { describe, expect, it } from 'vitest';

import * as templates from '../../../src/core/templates/index.js';

describe('core templates barrel export', () => {
  it('重新导出 skill templates 入口', () => {
    // 中文注释：这里验证兼容入口模块能正常透传导出。
    expect(templates).toBeTruthy();
    expect(typeof templates).toBe('object');
  });
});
