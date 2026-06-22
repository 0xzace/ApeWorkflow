export interface RetryOptions {
  maxAttempts?: number;
  onWarning?: (error: Error, attempt: number) => void;
}

export async function retryWithFallback<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T | null> {
  const maxAttempts = options.maxAttempts ?? 2;
  const { onWarning } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (onWarning && attempt < maxAttempts) {
        onWarning(err instanceof Error ? err : new Error(String(err)), attempt);
      }
    }
  }

  return null;
}
