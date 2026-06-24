import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CompletionCommand } from '../../src/commands/completion.js';
import { CompletionProvider } from '../../src/core/completions/completion-provider.js';
import * as shellDetection from '../../src/utils/shell-detection.js';
import * as itemDiscovery from '../../src/utils/item-discovery.js';

// Mock the shell detection module
vi.mock('../../src/utils/shell-detection.js', () => ({
  detectShell: vi.fn(),
}));

// 中文注释：completion 命令会直接读取 archived changes，这里固定数据方便覆盖各个分支。
vi.mock('../../src/utils/item-discovery.js', () => ({
  getArchivedChangeIds: vi.fn(),
}));

// Mock the ZshInstaller
vi.mock('../../src/core/completions/installers/zsh-installer.js', () => ({
  ZshInstaller: vi.fn().mockImplementation(() => ({
    install: vi.fn().mockResolvedValue({
      success: true,
      installedPath: '/home/user/.oh-my-zsh/completions/_apeworkflow',
      isOhMyZsh: true,
      message: 'Completion script installed successfully for Oh My Zsh',
      instructions: [
        'Completion script installed to Oh My Zsh completions directory.',
        'Restart your shell or run: exec zsh',
        'Completions should activate automatically.',
      ],
    }),
    uninstall: vi.fn().mockResolvedValue({
      success: true,
      message: 'Completion script removed from /home/user/.oh-my-zsh/completions/_apeworkflow',
    }),
  })),
}));

describe('CompletionCommand', () => {
  let command: CompletionCommand;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  const restoreSpies: Array<() => void> = [];

  beforeEach(() => {
    command = new CompletionCommand();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    process.exitCode = 0;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    // 中文注释：只恢复本文件里临时挂上的原型桩，保留模块级 mock。
    while (restoreSpies.length > 0) {
      restoreSpies.pop()?.();
    }
    vi.clearAllMocks();
  });

  describe('generate subcommand', () => {
    it('should generate Zsh completion script to stdout', async () => {
      await command.generate({ shell: 'zsh' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('#compdef apeworkflow');
      expect(output).toContain('_apeworkflow() {');
    });

    it('should auto-detect Zsh shell when no shell specified', async () => {
      vi.mocked(shellDetection.detectShell).mockReturnValue({ shell: 'zsh', detected: 'zsh' });

      await command.generate({});

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('#compdef apeworkflow');
    });

    it('should show error when shell cannot be auto-detected', async () => {
      vi.mocked(shellDetection.detectShell).mockReturnValue({ shell: undefined, detected: undefined });

      await command.generate({});

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error: Could not auto-detect your shell.')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Usage: apeworkflow completion generate'));
      expect(process.exitCode).toBe(1);
    });

    it('should show error for unsupported shell', async () => {
      await command.generate({ shell: 'tcsh' });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error: Shell 'tcsh' is not supported yet.")
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Currently supported:'));
      expect(process.exitCode).toBe(1);
    });

    it('should handle shell parameter case-insensitively', async () => {
      await command.generate({ shell: 'ZSH' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('#compdef apeworkflow');
    });
  });

  describe('install subcommand', () => {
    it('should install Zsh completion script', async () => {
      await command.install({ shell: 'zsh' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Completion script installed successfully')
      );
      expect(process.exitCode).toBe(0);
    });

    it('should show verbose output when --verbose flag is provided', async () => {
      await command.install({ shell: 'zsh', verbose: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Installed to:')
      );
    });

    it('should auto-detect Zsh shell when no shell specified', async () => {
      vi.mocked(shellDetection.detectShell).mockReturnValue({ shell: 'zsh', detected: 'zsh' });

      await command.install({});

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Completion script installed successfully')
      );
    });

    it('should show error when shell cannot be auto-detected', async () => {
      vi.mocked(shellDetection.detectShell).mockReturnValue({ shell: undefined, detected: undefined });

      await command.install({});

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error: Could not auto-detect your shell.')
      );
      expect(process.exitCode).toBe(1);
    });

    it('should show error for unsupported shell', async () => {
      await command.install({ shell: 'tcsh' });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error: Shell 'tcsh' is not supported yet.")
      );
      expect(process.exitCode).toBe(1);
    });

    it('should display installation instructions', async () => {
      await command.install({ shell: 'zsh' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Restart your shell or run: exec zsh')
      );
    });
  });

  describe('uninstall subcommand', () => {
    it('should uninstall Zsh completion script', async () => {
      await command.uninstall({ shell: 'zsh', yes: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Completion script removed')
      );
      expect(process.exitCode).toBe(0);
    });

    it('should auto-detect Zsh shell when no shell specified', async () => {
      vi.mocked(shellDetection.detectShell).mockReturnValue({ shell: 'zsh', detected: 'zsh' });

      await command.uninstall({ yes: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Completion script removed')
      );
    });

    it('should show error when shell cannot be auto-detected', async () => {
      vi.mocked(shellDetection.detectShell).mockReturnValue({ shell: undefined, detected: undefined });

      await command.uninstall({ yes: true });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error: Could not auto-detect your shell.')
      );
      expect(process.exitCode).toBe(1);
    });

    it('should show error for unsupported shell', async () => {
      await command.uninstall({ shell: 'tcsh', yes: true });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error: Shell 'tcsh' is not supported yet.")
      );
      expect(process.exitCode).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle installation failures gracefully', async () => {
      const { ZshInstaller } = await import('../../src/core/completions/installers/zsh-installer.js');
      vi.mocked(ZshInstaller).mockImplementationOnce(() => ({
        install: vi.fn().mockResolvedValue({
          success: false,
          isOhMyZsh: false,
          message: 'Permission denied',
        }),
        uninstall: vi.fn(),
        isInstalled: vi.fn(),
        getInstallationInfo: vi.fn(),
        isOhMyZshInstalled: vi.fn(),
        getInstallationPath: vi.fn(),
        backupExistingFile: vi.fn(),
      } as any));

      const cmd = new CompletionCommand();
      await cmd.install({ shell: 'zsh' });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Permission denied')
      );
      expect(process.exitCode).toBe(1);
    });

    it('should handle uninstallation failures gracefully', async () => {
      const { ZshInstaller } = await import('../../src/core/completions/installers/zsh-installer.js');
      vi.mocked(ZshInstaller).mockImplementationOnce(() => ({
        install: vi.fn(),
        uninstall: vi.fn().mockResolvedValue({
          success: false,
          message: 'Completion script is not installed',
        }),
        isInstalled: vi.fn(),
        getInstallationInfo: vi.fn(),
        isOhMyZshInstalled: vi.fn(),
        getInstallationPath: vi.fn(),
        backupExistingFile: vi.fn(),
      } as any));

      const cmd = new CompletionCommand();
      await cmd.uninstall({ shell: 'zsh', yes: true });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Completion script is not installed')
      );
      expect(process.exitCode).toBe(1);
    });
  });

  describe('dynamic completion data', () => {
    it('should output schema names for shell completion', async () => {
      await command.complete({ type: 'schemas' });

      expect(consoleLogSpy).toHaveBeenCalledWith('spec-driven\tschema');
      expect(process.exitCode).toBe(0);
    });

    it('should output active change ids for shell completion', async () => {
      const spy = vi.spyOn(CompletionProvider.prototype, 'getChangeIds').mockResolvedValue(['change-a', 'change-b']);
      restoreSpies.push(() => spy.mockRestore());

      await command.complete({ type: 'changes' });

      expect(consoleLogSpy).toHaveBeenNthCalledWith(1, 'change-a\tactive change');
      expect(consoleLogSpy).toHaveBeenNthCalledWith(2, 'change-b\tactive change');
      expect(process.exitCode).toBe(0);
    });

    it('should output spec ids for shell completion', async () => {
      const spy = vi.spyOn(CompletionProvider.prototype, 'getSpecIds').mockResolvedValue(['spec-a']);
      restoreSpies.push(() => spy.mockRestore());

      await command.complete({ type: 'specs' });

      expect(consoleLogSpy).toHaveBeenCalledWith('spec-a\tspecification');
      expect(process.exitCode).toBe(0);
    });

    it('should output archived change ids for shell completion', async () => {
      vi.mocked(itemDiscovery.getArchivedChangeIds).mockResolvedValue(['archived-a']);

      await command.complete({ type: 'archived-changes' });

      expect(consoleLogSpy).toHaveBeenCalledWith('archived-a\tarchived change');
      expect(process.exitCode).toBe(0);
    });

    it('should exit with an error for unsupported completion types', async () => {
      await command.complete({ type: 'unknown' });

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(process.exitCode).toBe(1);
    });

    it('should exit with an error when completion data lookup fails', async () => {
      const spy = vi.spyOn(CompletionProvider.prototype, 'getSchemaNames').mockRejectedValue(new Error('boom'));
      restoreSpies.push(() => spy.mockRestore());

      await command.complete({ type: 'schemas' });

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(process.exitCode).toBe(1);
    });
  });

  describe('shell detection integration', () => {
    it('should show appropriate error when detected shell is unsupported', async () => {
      vi.mocked(shellDetection.detectShell).mockReturnValue({ shell: undefined, detected: 'tcsh' });

      await command.generate({});

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error: Shell 'tcsh' is not supported yet.")
      );
      expect(process.exitCode).toBe(1);
    });

    it('should respect explicit shell parameter over auto-detection', async () => {
      vi.mocked(shellDetection.detectShell).mockReturnValue({ shell: undefined, detected: 'bash' });

      await command.generate({ shell: 'zsh' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('#compdef apeworkflow');
    });
  });
});
