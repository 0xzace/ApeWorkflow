import { describe, expect, it } from 'vitest';

import { CompletionFactory } from '../../../src/core/completions/factory.js';
import { BashGenerator } from '../../../src/core/completions/generators/bash-generator.js';
import { FishGenerator } from '../../../src/core/completions/generators/fish-generator.js';
import { PowerShellGenerator } from '../../../src/core/completions/generators/powershell-generator.js';
import { ZshGenerator } from '../../../src/core/completions/generators/zsh-generator.js';
import { BashInstaller } from '../../../src/core/completions/installers/bash-installer.js';
import { FishInstaller } from '../../../src/core/completions/installers/fish-installer.js';
import { PowerShellInstaller } from '../../../src/core/completions/installers/powershell-installer.js';
import { ZshInstaller } from '../../../src/core/completions/installers/zsh-installer.js';

describe('CompletionFactory', () => {
  it('should return a copy of supported shells', () => {
    const shells = CompletionFactory.getSupportedShells();

    // 中文注释：返回值必须是独立数组，避免外部修改污染工厂内部常量。
    shells.push('tcsh' as never);

    expect(CompletionFactory.getSupportedShells()).toEqual(['zsh', 'bash', 'fish', 'powershell']);
  });

  it.each([
    ['zsh', ZshGenerator],
    ['bash', BashGenerator],
    ['fish', FishGenerator],
    ['powershell', PowerShellGenerator],
  ] as const)('should create %s generator', (shell, expectedCtor) => {
    const generator = CompletionFactory.createGenerator(shell);
    expect(generator).toBeInstanceOf(expectedCtor);
  });

  it.each([
    ['zsh', ZshInstaller],
    ['bash', BashInstaller],
    ['fish', FishInstaller],
    ['powershell', PowerShellInstaller],
  ] as const)('should create %s installer', (shell, expectedCtor) => {
    const installer = CompletionFactory.createInstaller(shell);
    expect(installer).toBeInstanceOf(expectedCtor);
  });

  it('should report supported shells correctly', () => {
    expect(CompletionFactory.isSupported('zsh')).toBe(true);
    expect(CompletionFactory.isSupported('bash')).toBe(true);
    expect(CompletionFactory.isSupported('fish')).toBe(true);
    expect(CompletionFactory.isSupported('powershell')).toBe(true);
    expect(CompletionFactory.isSupported('tcsh')).toBe(false);
  });
});
