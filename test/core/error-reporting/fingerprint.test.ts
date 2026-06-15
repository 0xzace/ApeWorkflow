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
});
