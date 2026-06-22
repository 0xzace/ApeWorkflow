import { describe, it, expect, vi } from 'vitest';
import { retryWithFallback } from '../../src/cli/retry';

describe('retryWithFallback', () => {
  it('returns result on first attempt', async () => {
    const result = await retryWithFallback(async () => 'success');
    expect(result).toBe('success');
  });

  it('retries on failure then returns null after maxAttempts', async () => {
    let attempts = 0;
    const result = await retryWithFallback(
      async () => {
        attempts++;
        if (attempts < 2) throw new Error('transient');
        throw new Error('still failing');
      },
      { maxAttempts: 2 }
    );
    expect(result).toBeNull();
    expect(attempts).toBe(2);
  });

  it('onWarning is called on each retry', async () => {
    const warnings: Error[] = [];
    const result = await retryWithFallback(
      async () => { throw new Error('fail'); },
      { maxAttempts: 3, onWarning: (err) => warnings.push(err) }
    );
    expect(result).toBeNull();
    expect(warnings).toHaveLength(2); // 2 retries = 2 warnings
  });

  it('returns result after transient failure recovers', async () => {
    let attempts = 0;
    const result = await retryWithFallback(
      async () => {
        attempts++;
        if (attempts === 1) throw new Error('transient');
        return 'recovered';
      },
      { maxAttempts: 3 }
    );
    expect(result).toBe('recovered');
    expect(attempts).toBe(2);
  });
});
