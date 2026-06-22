import { describe, it, expect } from 'vitest';
import { matchSkills } from '../../src/utils/skill-matcher.js';

describe('matchSkills', () => {
  it('matches propose + apply for implementation intent', () => {
    const skills = matchSkills('help me implement a new feature');
    expect(skills).toContain('apeworkflow-propose');
    expect(skills).toContain('apeworkflow-apply-change');
  });

  it('matches debugging for fix intent', () => {
    const skills = matchSkills('I have a bug in the auth module');
    expect(skills).toContain('apeworkflow-systematic-debugging');
  });

  it('matches review skills for review intent', () => {
    const skills = matchSkills('can you review my code');
    expect(skills).toContain('apeworkflow-requesting-code-review');
  });

  it('matches no skills for read-only operations', () => {
    const skills = matchSkills('list all changes');
    expect(skills).toEqual([]);
  });

  it('returns at most 3 skills', () => {
    const skills = matchSkills('please help me write a complete plan and implement it with TDD and review');
    expect(skills.length).toBeLessThanOrEqual(3);
  });

  it('matches write plan skill', () => {
    const skills = matchSkills('write an implementation plan');
    expect(skills).toContain('apeworkflow-writing-plans');
  });
});

describe('matchSkills edge cases', () => {
  it('empty string returns no skills', () => {
    const skills = matchSkills('');
    expect(skills).toEqual([]);
  });

  it('whitespace only returns no skills', () => {
    const skills = matchSkills('   ');
    expect(skills).toEqual([]);
  });

  it('mixed case matches correctly', () => {
    const result = matchSkills('HELP ME IMPLEMENT A NEW FEATURE');
    expect(result).toContain('apeworkflow-propose');
    expect(result).toContain('apeworkflow-apply-change');
  });

  it('chinese text does not trigger english keyword matches', () => {
    const skills = matchSkills('帮我修复一个错误');
    expect(skills).toEqual([]);
  });

  it('returns at most 3 skills even with many matches', () => {
    const skills = matchSkills('review plan implementing a new feature for testing debugging');
    expect(skills.length).toBeLessThanOrEqual(3);
  });

  it('help alone does not match proposal or apply', () => {
    const skills = matchSkills('help me with something');
    expect(skills).not.toContain('apeworkflow-propose');
    expect(skills).not.toContain('apeworkflow-apply-change');
  });

  it('debug matches debugging skill', () => {
    const skills = matchSkills('debug');
    expect(skills).toContain('apeworkflow-systematic-debugging');
  });

  it('archive keyword matches archive skill', () => {
    const skills = matchSkills('I want to archive this change');
    expect(skills).toContain('apeworkflow-archive-change');
  });

  it('explore keyword matches explore skill', () => {
    const skills = matchSkills('let me explore this idea');
    expect(skills).toContain('apeworkflow-explore');
  });
});
