import { describe, expect, it } from 'vitest';
import { buildErrorFingerprint, normalizeError } from '../../../src/core/error-reporting/fingerprint.js';

describe('error-reporting/fingerprint', () => {
  it('normalizes string rejections into a structured event', () => {
    const event = normalizeError('workspace update failed', {
      commandPath: 'workspace:update',
      source: 'command',
      workspaceRoot: '/tmp/workspace',
    });

    expect(event.name).toBe('Error');
    expect(event.message).toBe('workspace update failed');
    expect(event.commandPath).toBe('workspace:update');
    expect(event.workspaceRoot).toBe('/tmp/workspace');
    expect(event.stack).toContain('workspace update failed');
  });

  it('returns the same fingerprint for the same error shape', () => {
    const first = buildErrorFingerprint(
      normalizeError(new Error('missing link path'), {
        commandPath: 'workspace:link',
        source: 'command',
        workspaceRoot: '/tmp/workspace',
      })
    );
    const second = buildErrorFingerprint(
      normalizeError(new Error('missing link path'), {
        commandPath: 'workspace:link',
        source: 'command',
        workspaceRoot: '/tmp/workspace',
      })
    );

    expect(first).toBe(second);
  });

  it('normalizes plain objects and primitive values into error reports', () => {
    const objectEvent = normalizeError(
      { name: '   ', message: '   ', stack: 'custom stack' },
      {
        commandPath: 'context-store:setup',
        source: 'command',
      }
    );
    const primitiveEvent = normalizeError(42, {
      commandPath: 'context-store:setup',
      source: 'process',
      workspaceName: 'demo-workspace',
    });

    expect(objectEvent.name).toBe('Error');
    expect(objectEvent.message).toBe('Unknown error');
    expect(objectEvent.stack).toBe('custom stack');
    expect(primitiveEvent.name).toBe('Error');
    expect(primitiveEvent.message).toBe('42');
    expect(primitiveEvent.workspaceName).toBe('demo-workspace');
  });

  it('ignores stack line numbers when building fingerprints', () => {
    const first = buildErrorFingerprint({
      name: 'Error',
      message: 'missing link path',
      stack: 'Error: missing link path\n    at foo (/tmp/a.ts:12:34)',
      commandPath: 'workspace:link',
      source: 'command',
      workspaceRoot: '/tmp/workspace',
    });
    const second = buildErrorFingerprint({
      name: 'Error',
      message: 'missing link path',
      stack: 'Error: missing link path\n    at foo (/tmp/a.ts:99:88)',
      commandPath: 'workspace:link',
      source: 'command',
      workspaceRoot: '/tmp/workspace',
    });

    expect(first).toBe(second);
  });
});
