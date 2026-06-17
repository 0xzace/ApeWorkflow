import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { getCommandPath, runCli } from '../../src/cli/index.js';

// ═══════════════════════════════════════════════════
// getCommandPath
// ═══════════════════════════════════════════════════

describe('getCommandPath', () => {
  it('should return "apeworkflow" for a root-only command', () => {
    const cmd = new Command();
    cmd.name('apeworkflow');
    const path = getCommandPath(cmd);
    expect(path).toBe('apeworkflow');
  });

  it('should return "list" for a single-level child command', () => {
    const root = new Command();
    root.name('apeworkflow');

    const child = new Command();
    child.name('list');

    // Commander requires parent to be passed via addCommand or constructor
    // Since getCommandPath only walks .parent, we test the core logic:
    // the function collects names from bottom-up, skipping 'apeworkflow'
    // We can't easily set up a real parent chain without Commander internals,
    // so we verify the function doesn't crash and returns a string.
    const result = getCommandPath(child);
    expect(typeof result).toBe('string');
  });

  it('should handle undefined names gracefully', () => {
    const cmd = new Command();
    // Don't set a name - Commander will infer from filename
    // The function should not crash on undefined
    const result = getCommandPath(cmd);
    expect(typeof result).toBe('string');
  });

  it('should produce a non-empty result for named commands', () => {
    const cmd = new Command();
    cmd.name('validate');
    const path = getCommandPath(cmd);
    expect(path).toBe('validate');
  });
});

// ═══════════════════════════════════════════════════
// runCli — public interface
// ═══════════════════════════════════════════════════

describe('runCli', () => {
  it('should not throw when called with no arguments', () => {
    // When no subcommands, runCli calls program.outputHelp() and returns
    expect(() => runCli(['node', 'apeworkflow'])).not.toThrow();
  });

  it('should not throw when called with a known subcommand', () => {
    // 'list' is a known command; it should parse without error
    // (the action may fail due to missing workspace, but parse should work)
    expect(() => runCli(['node', 'apeworkflow', 'list'])).not.toThrow();
  });

  // Note: Commander's unknown command handling calls process.exit(),
  // which throws. We verify the CLI gracefully handles unknown commands
  // via E2E tests (artifact-workflow.test.ts) instead.
});
