import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  getContextStoreMetadataPath,
  readContextStoreRegistryState,
  writeContextStoreMetadataState,
  writeContextStoreRegistryState,
} from '../../../src/core/index.js';
import {
  createContextStoreBindingFromSelected,
  createPathContextStoreBinding,
  createRegisteredContextStoreBinding,
  formatContextStoreBinding,
  formatContextStoreBindingSelector,
  formatContextStoreSelector,
  normalizeContextStoreBinding,
  requireContextStoreSelector,
  resolveSelectedContextStore,
  sameContextStoreBinding,
} from '../../../src/core/context-store/binding.js';

describe('context store binding helpers', () => {
  let tempDir: string;

  beforeEach(() => {
    // 中文注释：这里使用独立临时目录，避免和其他 context-store 测试互相污染。
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apeworkflow-context-store-binding-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('会创建 registry 和 path binding，并保持标准化结果一致', () => {
    const registryBinding = createRegisteredContextStoreBinding('team-context');
    const pathBinding = createPathContextStoreBinding({
      id: 'team-context',
      path: path.join(tempDir, 'team-context'),
    });

    expect(registryBinding).toEqual({
      id: 'team-context',
      selector: {
        kind: 'registry',
        id: 'team-context',
      },
    });
    expect(pathBinding).toEqual({
      id: 'team-context',
      selector: {
        kind: 'path',
        path: path.join(tempDir, 'team-context'),
        observed_id: 'team-context',
      },
    });
    expect(normalizeContextStoreBinding(registryBinding)).toEqual(registryBinding);
    expect(normalizeContextStoreBinding(pathBinding)).toEqual(pathBinding);
  });

  it('会比较和格式化 binding 选择器', () => {
    const registryBinding = createRegisteredContextStoreBinding('team-context');
    const pathBinding = createPathContextStoreBinding({
      id: 'team-context',
      path: path.join(tempDir, 'team-context'),
    });
    const selectedRegistry = { id: 'team-context', root: tempDir, source: 'registry' as const };
    const selectedPath = { id: 'team-context', root: path.join(tempDir, 'team-context'), source: 'path' as const };

    expect(sameContextStoreBinding(registryBinding, createRegisteredContextStoreBinding('team-context'))).toBe(true);
    expect(sameContextStoreBinding(pathBinding, createPathContextStoreBinding({
      id: 'team-context',
      path: path.join(tempDir, 'team-context'),
    }))).toBe(true);
    expect(sameContextStoreBinding(registryBinding, pathBinding)).toBe(false);
    expect(formatContextStoreBinding(registryBinding)).toBe('team-context');
    expect(formatContextStoreBinding(pathBinding)).toBe(`team-context via ${path.join(tempDir, 'team-context')}`);
    expect(formatContextStoreBindingSelector(registryBinding)).toBe('--store team-context');
    expect(formatContextStoreBindingSelector(pathBinding)).toBe(`--store-path ${path.join(tempDir, 'team-context')}`);
    expect(formatContextStoreSelector(selectedRegistry)).toBe('--store team-context');
    expect(formatContextStoreSelector(selectedPath)).toBe(`--store-path ${path.join(tempDir, 'team-context')}`);
    expect(createContextStoreBindingFromSelected(selectedRegistry)).toEqual(registryBinding);
    expect(createContextStoreBindingFromSelected(selectedPath)).toEqual(pathBinding);
  });

  it('会拒绝空路径和缺失选择器', () => {
    expect(() =>
      createPathContextStoreBinding({
        id: 'team-context',
        path: '',
      })
    ).toThrow(/must not be empty/u);

    expect(() =>
      requireContextStoreSelector({} as any, 'context-store setup')
    ).toThrow(/Pass --store <id> or --store-path <path>\./u);

    expect(() =>
      requireContextStoreSelector({ store: 'team-context', storePath: path.join(tempDir, 'team-context') } as any, 'context-store setup')
    ).toThrow(/Pass either --store <id> or --store-path <path>, not both\./u);
  });

  it('会解析 registry 和 path 选择器', async () => {
    const registryRoot = path.join(tempDir, 'registry-context');
    const pathRoot = path.join(tempDir, 'path-context');

    fs.mkdirSync(registryRoot, { recursive: true });
    fs.mkdirSync(pathRoot, { recursive: true });

    await writeContextStoreMetadataState(registryRoot, {
      version: 1,
      id: 'registry-context',
    });
    await writeContextStoreMetadataState(pathRoot, {
      version: 1,
      id: 'path-context',
    });
    await writeContextStoreRegistryState(
      {
        version: 1,
        stores: {
          'registry-context': {
            backend: {
              type: 'git',
              local_path: registryRoot,
            },
          },
        },
      },
      { globalDataDir: tempDir }
    );

    const selectedRegistry = await resolveSelectedContextStore(
      { store: 'registry-context' },
      'context-store doctor',
      { globalDataDir: tempDir }
    );
    const selectedPath = await resolveSelectedContextStore(
      { storePath: pathRoot },
      'context-store doctor'
    );

    expect(selectedRegistry).toEqual({
      id: 'registry-context',
      root: expect.any(String),
      source: 'registry',
    });
    expect(fs.realpathSync.native(selectedRegistry.root)).toBe(fs.realpathSync.native(registryRoot));
    expect(selectedPath).toEqual({
      id: 'path-context',
      root: expect.any(String),
      source: 'path',
    });
    expect(fs.realpathSync.native(selectedPath.root)).toBe(fs.realpathSync.native(pathRoot));
    expect(await readContextStoreRegistryState({ globalDataDir: tempDir })).toEqual(
      expect.objectContaining({
        stores: expect.objectContaining({
          'registry-context': expect.any(Object),
        }),
      })
    );
  });

  it('会在注册 binding 的路径不存在时返回可读错误', async () => {
    const missingRoot = path.join(tempDir, 'missing-context');
    fs.mkdirSync(missingRoot, { recursive: true });

    await expect(
      resolveSelectedContextStore(
        { storePath: missingRoot },
        'context-store doctor'
      )
    ).rejects.toThrow(/context_store_metadata_not_found|Context store metadata not found/u);
  });

  it('会拒绝把文件路径当作 context store 根目录', async () => {
    const filePath = path.join(tempDir, 'store-file');
    fs.writeFileSync(filePath, 'not a directory\n');

    await expect(
      resolveSelectedContextStore(
        { storePath: filePath },
        'context-store doctor'
      )
    ).rejects.toThrow(/Context store local path does not exist|not a directory|directory/u);
  });
});
