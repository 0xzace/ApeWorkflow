import { describe, it, expect } from 'vitest';
import { ProjectConfigSchema, readProjectConfigWithDefaults, DEFAULT_PROJECT_CONFIG } from '../../src/core/project-config.js';
import { matchSkills } from '../../src/utils/skill-matcher.js';
import { retryWithFallback } from '../../src/cli/retry.js';
import { loadPlanningContext } from '../../src/core/planning-context.js';
import { resolveEditScope } from '../../src/core/change-status-policy.js';
import { generateArchiveName } from '../../src/core/archive.js';
import { scanForTasks } from '../../src/core/init.js';

describe('UX Fixes Integration', () => {
  it('full pipeline: config -> planning -> matching', async () => {
    // 1. Valid config with all 4 keys
    const configResult = ProjectConfigSchema.safeParse({
      schema: 'spec-driven',
      strictness: { tdd: true, selectionPolicy: 'auto-if-single' },
      plan: { granularity: 'medium' },
      skills: { loadPolicy: 'smart', maxDepth: 2 },
      onboarding: { maxPauses: 3 },
    });
    expect(configResult.success).toBe(true);

    // 2. Defaults have correct values
    expect(DEFAULT_PROJECT_CONFIG.strictness.tdd).toBe(true);
    expect(DEFAULT_PROJECT_CONFIG.plan.granularity).toBe('medium');
    expect(DEFAULT_PROJECT_CONFIG.skills.loadPolicy).toBe('smart');
    expect(DEFAULT_PROJECT_CONFIG.skills.maxDepth).toBe(2);
    expect(DEFAULT_PROJECT_CONFIG.onboarding.maxPauses).toBe(3);
    expect(DEFAULT_PROJECT_CONFIG.strictness.selectionPolicy).toBe('auto-if-single');

    // 3. Config-aware planning loads correct subset
    const context = loadPlanningContext('test', 'medium', {
      proposal: 'p', specs: 's', design: 'd', tasks: 't',
    });
    expect(context.granularity).toBe('medium');
    expect(context.has('specs')).toBe(true);
    expect(context.has('tasks')).toBe(true);
    expect(context.has('design')).toBe(true);

    // 4. Skill matching works with config's loadPolicy
    const skills = matchSkills('implement new feature');
    expect(skills.length).toBeGreaterThan(0);
    expect(skills.length).toBeLessThanOrEqual(3);

    // 5. Retry works in the pipeline
    const result = await retryWithFallback(async () => 'ok');
    expect(result).toBe('ok');

    // 6. Archive name generation doesn't collide
    const name = generateArchiveName('test', '2026-06-18');
    expect(name).toBe('2026-06-18-test');

    // 7. Onboarding degrades gracefully
    const scan = scanForTasks([]);
    expect(scan.status).toBe('empty');

    // 8. Partial execution works
    const scope = resolveEditScope({
      mode: 'workspace-planning',
      allowedEditRoots: [],
      availableEditRoots: ['/repo'],
    });
    expect(scope.mode).toBe('partial');

    // 9. readProjectConfigWithDefaults works
    const defaults = readProjectConfigWithDefaults('/tmp/nonexistent-path-' + Date.now());
    expect(defaults.schema).toBe('spec-driven');
    expect(defaults.strictness.tdd).toBe(true);

    // 10. Coarse granularity excludes specs and design
    const coarseContext = loadPlanningContext('test', 'coarse', {
      proposal: 'p', plans: ['plan.md'],
    });
    expect(coarseContext.has('specs')).toBe(false);
    expect(coarseContext.has('design')).toBe(false);
    expect(coarseContext.has('proposal')).toBe(true);
  });
});
