import { describe, expect, it } from 'vitest';

import {
  buildActionContext,
  buildNextSteps,
  summarizeAffectedAreas,
  summarizePlanningHome,
} from '../../src/core/change-status-policy.js';

describe('change status policy helpers', () => {
  it('会摘要化 planning home 并在缺失时返回 undefined', () => {
    expect(summarizePlanningHome(undefined)).toBeUndefined();
    expect(
      summarizePlanningHome({
        kind: 'workspace',
        root: '/workspace',
        changesDir: '/workspace/apeworkflow/changes',
        defaultSchema: 'workspace-planning',
        workspace: {
          name: 'platform',
          links: ['api', 'web'],
        },
      })
    ).toEqual({
      kind: 'workspace',
      root: '/workspace',
      changesDir: '/workspace/apeworkflow/changes',
      defaultSchema: 'workspace-planning',
      workspaceName: 'platform',
    });
    expect(
      summarizePlanningHome({
        kind: 'repo',
        root: '/repo',
        changesDir: '/repo/apeworkflow/changes',
        defaultSchema: 'spec-driven',
      })
    ).toEqual({
      kind: 'repo',
      root: '/repo',
      changesDir: '/repo/apeworkflow/changes',
      defaultSchema: 'spec-driven',
    });
  });

  it('会摘要化 affected areas 并去重排序', () => {
    expect(
      summarizeAffectedAreas({
        planningHome: {
          kind: 'workspace',
          root: '/workspace',
          changesDir: '/workspace/apeworkflow/changes',
          defaultSchema: 'workspace-planning',
          workspace: {
            name: 'platform',
            links: ['api', 'web'],
          },
        },
        metadata: {
          affected_areas: ['web', 'api', 'web', 'docs'],
        },
      })
    ).toEqual({
      known: ['api', 'docs', 'web'],
      unresolved: false,
      invalid: ['docs'],
    });

    expect(
      summarizeAffectedAreas({
        planningHome: {
          kind: 'workspace',
          root: '/workspace',
          changesDir: '/workspace/apeworkflow/changes',
          defaultSchema: 'workspace-planning',
          workspace: {
            name: 'platform',
            links: ['api'],
          },
        },
        metadata: {},
      })
    ).toEqual({
      known: [],
      unresolved: true,
      invalid: [],
    });

    expect(
      summarizeAffectedAreas({
        planningHome: {
          kind: 'repo',
          root: '/repo',
          changesDir: '/repo/apeworkflow/changes',
          defaultSchema: 'spec-driven',
        },
        metadata: {
          affected_areas: ['api'],
        },
      })
    ).toBeUndefined();
  });

  it('会构建 repo 和 workspace 两种 action context', () => {
    expect(
      buildActionContext({
        projectRoot: '/repo',
        artifactIds: ['spec', 'change'],
      })
    ).toEqual({
      mode: 'repo-local',
      sourceOfTruth: 'repo',
      planningArtifacts: ['spec', 'change'],
      linkedContext: [],
      allowedEditRoots: ['/repo'],
      requiresAffectedAreaSelection: false,
      availableEditRoots: [],
      constraints: ['Repo-local change artifacts and implementation edits are scoped to this project.'],
    });

    expect(
      buildActionContext({
        projectRoot: '/repo',
        artifactIds: ['spec'],
        planningHome: {
          kind: 'workspace',
          root: '/workspace',
          changesDir: '/workspace/apeworkflow/changes',
          defaultSchema: 'workspace-planning',
          workspace: {
            name: 'platform',
            links: ['api', 'web'],
          },
        },
      })
    ).toEqual({
      mode: 'workspace-planning',
      sourceOfTruth: 'workspace-local',
      planningArtifacts: ['spec'],
      linkedContext: [{ name: 'api' }, { name: 'web' }],
      allowedEditRoots: [],
      requiresAffectedAreaSelection: true,
      availableEditRoots: ['api', 'web'],
      constraints: [
        'Treat workspace-local planning artifacts as compatibility context for this local view.',
        'Use initiatives for durable coordination when initiative context exists.',
        'Treat linked repos and folders as context until an explicit edit root is selected.',
        'Do not make implementation edits without an explicit allowed edit root.',
      ],
    });

    expect(
      buildActionContext({
        projectRoot: '/repo',
        artifactIds: ['spec'],
        planningHome: {
          kind: 'workspace',
          root: '/workspace',
          changesDir: '/workspace/apeworkflow/changes',
          defaultSchema: 'workspace-planning',
          workspace: {
            name: 'platform',
            links: ['api', 'web'],
          },
        },
        availableEditRoots: ['/explicit/root'],
      })
    ).toEqual({
      mode: 'workspace-planning',
      sourceOfTruth: 'workspace-local',
      planningArtifacts: ['spec'],
      linkedContext: [{ name: 'api' }, { name: 'web' }],
      allowedEditRoots: [],
      requiresAffectedAreaSelection: true,
      availableEditRoots: ['/explicit/root'],
      constraints: [
        'Treat workspace-local planning artifacts as compatibility context for this local view.',
        'Use initiatives for durable coordination when initiative context exists.',
        'Treat linked repos and folders as context until an explicit edit root is selected.',
        'Do not make implementation edits without an explicit allowed edit root.',
      ],
    });
  });

  it('会生成不同场景下的 next steps', () => {
    expect(
      buildNextSteps({
        changeName: 'add-login',
        artifactStatuses: [
          { id: 'spec', status: 'ready' },
          { id: 'tasks', status: 'pending' },
        ],
        allArtifactsComplete: false,
        planningHome: {
          kind: 'workspace',
          root: '/workspace',
          changesDir: '/workspace/apeworkflow/changes',
          defaultSchema: 'workspace-planning',
          workspace: {
            name: 'platform',
            links: ['api'],
          },
        },
        affectedAreas: {
          known: ['api'],
          unresolved: true,
          invalid: [],
        },
      })
    ).toEqual([
      'Run apeworkflow instructions spec --change "add-login" --json before writing that artifact.',
      'Identify affected areas in change metadata or coordination tasks as planning continues.',
      'Select an affected area and allowed edit root before implementation edits.',
    ]);

    expect(
      buildNextSteps({
        changeName: 'add-login',
        artifactStatuses: [{ id: 'spec', status: 'pending' }],
        allArtifactsComplete: true,
        planningHome: {
          kind: 'repo',
          root: '/repo',
          changesDir: '/repo/apeworkflow/changes',
          defaultSchema: 'spec-driven',
        },
      })
    ).toEqual(['All planning artifacts are complete; review tasks before implementation.']);
  });
});
