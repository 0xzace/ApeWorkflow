import * as fs from 'node:fs/promises';
import path from 'node:path';
import { getGlobalConfigDir } from '../global-config.js';
import type { ErrorReportingConfig } from './types.js';

export const DEFAULT_ERROR_REPORTING_REPOSITORY = '0xzace/ApeWorkflow';
export const DEFAULT_ERROR_REPORTING_STATE_FILE_NAME = 'error-reporting-state.json';
export const DEFAULT_ERROR_REPORTING_CONFIG_FILE_NAME = 'error-reporting.json';

function getDefaultErrorReportingStatePath(): string {
  return path.join(getGlobalConfigDir(), DEFAULT_ERROR_REPORTING_STATE_FILE_NAME);
}

function getDefaultErrorReportingConfig(): ErrorReportingConfig {
  return {
    enabled: true,
    repository: DEFAULT_ERROR_REPORTING_REPOSITORY,
    statePath: getDefaultErrorReportingStatePath(),
  };
}

export function getErrorReportingConfigPath(): string {
  // 中文注释：错误上报配置和全局配置一样放在用户级配置目录下，便于所有命令共享。
  return path.join(getGlobalConfigDir(), DEFAULT_ERROR_REPORTING_CONFIG_FILE_NAME);
}

async function readConfigFile(configPath: string): Promise<Partial<ErrorReportingConfig> | null> {
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content) as Partial<ErrorReportingConfig>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }

    return null;
  }
}

async function writeConfigFile(configPath: string, config: ErrorReportingConfig): Promise<void> {
  // 中文注释：写入前先确保目录存在，避免首次启用时写文件失败。
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');
}

export async function readErrorReportingConfig(): Promise<ErrorReportingConfig> {
  // 中文注释：缺省开启，并把状态文件固定放到全局配置目录。
  const defaults = getDefaultErrorReportingConfig();
  const configPath = getErrorReportingConfigPath();
  const loaded = await readConfigFile(configPath);

  if (!loaded) {
    return defaults;
  }

  return {
    ...defaults,
    ...loaded,
    statePath: loaded.statePath ?? defaults.statePath,
    repository: loaded.repository ?? defaults.repository,
    enabled: loaded.enabled ?? defaults.enabled,
  };
}

export async function updateErrorReportingConfig(
  updates: Partial<ErrorReportingConfig>
): Promise<ErrorReportingConfig> {
  // 中文注释：只覆盖调用方传入的字段，其他字段保持现状。
  const current = await readErrorReportingConfig();
  const merged: ErrorReportingConfig = {
    ...current,
    ...updates,
    statePath: updates.statePath ?? current.statePath,
    repository: updates.repository ?? current.repository,
    enabled: updates.enabled ?? current.enabled,
  };

  await writeConfigFile(getErrorReportingConfigPath(), merged);
  return merged;
}
