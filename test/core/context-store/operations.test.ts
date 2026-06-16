import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  getGlobalDataDir,
  getContextStoreMetadataPath,
  readContextStoreRegistryState,
  writeContextStoreMetadataState,
  writeContextStoreRegistryState,
} from '../../../src/core/index.js';
import {
  doctorContextStores,
  listContextStores,
  normalizeContextStorePathForComparison,
  prepareContextStoreCleanup,
  prepareContextStoreSetup,
  registerExistingContextStore,
  removeContextStore,
  unregisterContextStore,
} from '../../../src/core/context-store/operations.js';

describe('context store operations', () => {
  let tempDir: string;
  let originalEnv: NodeJS.ProcessEnv;
  let originalCwd: string;
  let globalDataDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-context-store-operations-'));
    originalEnv = { ...process.env };
    originalCwd = process.cwd();

    process.env = {
      ...process.env,
      XDG_DATA_HOME: path.join(tempDir, 'data-home'),
      XDG_CONFIG_HOME: path.join(tempDir, 'config-home'),
    };
    process.chdir(tempDir);
    globalDataDir = getGlobalDataDir();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function mkdir(relativePath: string): string {
    const dirPath = path.join(tempDir, relativePath);
    fs.mkdirSync(dirPath, { recursive: true });
    return dirPath;
  }

  function expectSameExistingPath(actualPath: string, expectedPath: string): void {
    expect(fs.realpathSync.native(actualPath)).toBe(fs.realpathSync.native(expectedPath));
  }

  it('会在准备 setup 时拒绝文件、非空目录和嵌套 Git 仓库', async () => {
    const filePath = path.join(tempDir, 'file-target');
    fs.writeFileSync(filePath, 'not a directory\n');

    await expect(
      prepareContextStoreSetup({
        id: 'file-target',
        path: filePath,
      })
    ).rejects.toThrow(/not a directory/u);

    const nonEmptyDir = mkdir('non-empty-target');
    fs.writeFileSync(path.join(nonEmptyDir, 'marker.txt'), 'x\n');

    await expect(
      prepareContextStoreSetup({
        id: 'non-empty-target',
        path: nonEmptyDir,
      })
    ).rejects.toThrow(/non-empty folder yet/u);

    const nestedGitRepo = mkdir('repo');
    fs.mkdirSync(path.join(nestedGitRepo, '.git'), { recursive: true });

    await expect(
      prepareContextStoreSetup({
        id: 'nested-target',
        path: path.join(nestedGitRepo, 'nested-target'),
      })
    ).rejects.toThrow(/inside another Git repository/u);
  });

  it('会注册已有 context store，并覆盖常见错误分支', async () => {
    await expect(registerExistingContextStore({})).rejects.toThrow(/Pass a context store path/u);

    const filePath = path.join(tempDir, 'store-file');
    fs.writeFileSync(filePath, 'file\n');

    await expect(
      registerExistingContextStore({
        path: filePath,
      })
    ).rejects.toThrow(/not a directory/u);

    const mismatchRoot = mkdir('stores/mismatch');
    await writeContextStoreMetadataState(mismatchRoot, {
      version: 1,
      id: 'other-context',
    });

    await expect(
      registerExistingContextStore({
        path: mismatchRoot,
        id: 'mismatch-context',
      })
    ).rejects.toThrow(/does not match --id/u);

    const successRoot = mkdir('stores/alpha-context');
    const registered = await registerExistingContextStore({
      path: successRoot,
    });

    expect(registered.store.id).toBe('alpha-context');
    expectSameExistingPath(registered.store.root, successRoot);
    expect(registered.createdArtifacts).toEqual(['.apeworkflow-store/store.yaml']);
    expect(fs.existsSync(getContextStoreMetadataPath(successRoot))).toBe(true);

    const registry = await readContextStoreRegistryState();
    expect(registry?.stores['alpha-context']).toBeDefined();
    expectSameExistingPath(
      registry?.stores['alpha-context'].backend.local_path ?? '',
      successRoot
    );
  });

  it('会清理和注销已注册的 context store', async () => {
    const storeRoot = mkdir('stores/team-context');
    await writeContextStoreMetadataState(storeRoot, {
      version: 1,
      id: 'team-context',
    });
    await writeContextStoreRegistryState(
      {
        version: 1,
        stores: {
          'team-context': {
            backend: {
              type: 'git',
              local_path: storeRoot,
            },
          },
        },
      },
      { globalDataDir }
    );

    const prepared = await prepareContextStoreCleanup({
      id: 'team-context',
      globalDataDir,
    });
    expect(prepared.id).toBe('team-context');
    expectSameExistingPath(prepared.root, storeRoot);

    const unregistered = await unregisterContextStore({
      id: 'team-context',
      globalDataDir,
    });
    expect(unregistered.store.id).toBe('team-context');
    expect(unregistered.registryCommit.removed).toBe(true);
    expect(unregistered.files.deleted).toBe(false);
    expect(unregistered.files.leftOnDisk).toBe(storeRoot);

    await writeContextStoreMetadataState(storeRoot, {
      version: 1,
      id: 'team-context',
    });
    await writeContextStoreRegistryState(
      {
        version: 1,
        stores: {
          'team-context': {
            backend: {
              type: 'git',
              local_path: storeRoot,
            },
          },
        },
      },
      { globalDataDir }
    );

    const preparedForRemove = await prepareContextStoreCleanup({
      id: 'team-context',
      globalDataDir,
    });
    fs.rmSync(storeRoot, { recursive: true, force: true });

    const removed = await removeContextStore(preparedForRemove);
    expect(removed.registryCommit.removed).toBe(true);
    expect(removed.files.deleted).toBe(false);
    expect(removed.diagnostics).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'context_store_root_missing',
      }),
    ]);
  });

  it('会列出、诊断并比较 context store 路径', async () => {
    fs.mkdirSync(path.join(tempDir, 'stores'), { recursive: true });
    expect(normalizeContextStorePathForComparison(path.join(tempDir, '.', 'stores'))).toBe(
      fs.realpathSync.native(path.join(tempDir, 'stores'))
    );

    await expect(listContextStores()).resolves.toEqual({
      stores: [],
    });
    await expect(doctorContextStores()).resolves.toEqual({
      stores: [],
      diagnostics: [],
    });

    const missingMetadataRoot = mkdir('stores/missing-metadata');
    await writeContextStoreRegistryState(
      {
        version: 1,
        stores: {
          'missing-metadata': {
            backend: {
              type: 'git',
              local_path: missingMetadataRoot,
            },
          },
        },
      },
      { globalDataDir }
    );

    const doctor = await doctorContextStores();
    expect(doctor.stores).toHaveLength(1);
    expect(doctor.stores[0].id).toBe('missing-metadata');
    expect(doctor.stores[0].metadata).toEqual({
      present: false,
      valid: false,
    });
    expect(doctor.stores[0].diagnostics[0]).toEqual(
      expect.objectContaining({
        code: 'context_store_metadata_missing',
      })
    );

    await expect(doctorContextStores('unknown-context')).rejects.toThrow(/Unknown context store/u);

    const teamRoot = mkdir('stores/team-context');
    await writeContextStoreMetadataState(teamRoot, {
      version: 1,
      id: 'team-context',
    });
    await writeContextStoreRegistryState(
      {
        version: 1,
        stores: {
          'missing-metadata': {
            backend: {
              type: 'git',
              local_path: missingMetadataRoot,
            },
          },
          'team-context': {
            backend: {
              type: 'git',
              local_path: teamRoot,
            },
          },
        },
      },
      { globalDataDir }
    );

    const listed = await listContextStores();
    expect(listed.stores.map((store) => store.id)).toEqual(['missing-metadata', 'team-context']);
    expectSameExistingPath(listed.stores[1].root, teamRoot);
  });
});
