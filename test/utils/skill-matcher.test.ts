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
