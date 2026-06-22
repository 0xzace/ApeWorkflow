import { describe, it, expect } from 'vitest';
import { loadPlanningContext, PlanningGranularity } from '../../src/core/planning-context';

describe('loadPlanningContext', () => {
  const fullData: Record<string, string | string[]> = {
    proposal: 'proposal content',
    specs: 'specs content',
    design: 'design content',
    tasks: 'tasks content',
    plans: ['plan1.md', 'plan2.md'],
  };

  it('fine granularity includes all fields', () => {
    const context = loadPlanningContext('test', 'fine', fullData);
    expect(context.granularity).toBe('fine');
    expect(context.has('proposal')).toBe(true);
    expect(context.has('specs')).toBe(true);
    expect(context.has('design')).toBe(true);
    expect(context.has('tasks')).toBe(true);
    expect(context.has('plans')).toBe(true);
  });

  it('medium granularity includes proposal, specs, design, tasks', () => {
    const context = loadPlanningContext('test', 'medium', fullData);
    expect(context.granularity).toBe('medium');
    expect(context.has('proposal')).toBe(true);
    expect(context.has('specs')).toBe(true);
    expect(context.has('design')).toBe(true);
    expect(context.has('tasks')).toBe(true);
  });

  it('coarse granularity excludes specs and design', () => {
    const context = loadPlanningContext('test', 'coarse', fullData);
    expect(context.granularity).toBe('coarse');
    expect(context.has('proposal')).toBe(true);
    expect(context.has('specs')).toBe(false);
    expect(context.has('design')).toBe(false);
    expect(context.has('tasks')).toBe(true);
    expect(context.has('plans')).toBe(true);
  });

  it('returns empty context when data is empty', () => {
    const context = loadPlanningContext('test', 'fine', {});
    expect(context.granularity).toBe('fine');
    expect(context.has('proposal')).toBe(false);
    expect(context.has('specs')).toBe(false);
  });

  it('coarse granularity without tasks excludes tasks', () => {
    const context = loadPlanningContext('test', 'coarse', {
      proposal: 'p',
      plans: ['plan.md'],
    });
    expect(context.has('tasks')).toBe(false);
  });

  it('coarse granularity with tasks includes tasks', () => {
    const context = loadPlanningContext('test', 'coarse', {
      proposal: 'p',
      plans: ['plan.md'],
      tasks: 't',
    });
    expect(context.has('tasks')).toBe(true);
  });
});
