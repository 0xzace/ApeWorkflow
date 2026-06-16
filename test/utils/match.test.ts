import { describe, expect, it } from 'vitest';

import { levenshtein, nearestMatches } from '../../src/utils/match.js';

describe('match utilities', () => {
  it('计算编辑距离并返回最近匹配', () => {
    // 中文注释：这里直接校验排序结果，确保提示词推荐能稳定命中最近项。
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(nearestMatches('abc', ['ab', 'a', 'z'], 2)).toEqual(['ab', 'a']);
  });

  it('按最大数量截断结果', () => {
    expect(nearestMatches('alpha', ['alpha', 'al', 'a'], 1)).toEqual(['alpha']);
  });
});
