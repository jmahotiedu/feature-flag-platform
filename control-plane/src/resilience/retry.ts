export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterRatio?: number;
}

export interface RetryRuntime {
  random?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

export function computeBackoffDelay(
  attempt: number,
  policy: RetryPolicy,
  random: () => number = Math.random
): number {
  const expDelay = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** Math.max(0, attempt - 1));
  const jitterRatio = policy.jitterRatio ?? 0;
  if (jitterRatio <= 0) {
    return expDelay;
  }
  const jitterRange = expDelay * jitterRatio;
  const jitter = (random() * 2 - 1) * jitterRange;
  return Math.max(0, Math.round(expDelay + jitter));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  policy: RetryPolicy,
  runtime: RetryRuntime = {}
): Promise<T> {
  const sleep =
    runtime.sleep ??
    (async (ms: number) => {
      await new Promise<void>((resolve) => setTimeout(resolve, ms));
    });

  let attempt = 1;
  let lastError: unknown;

  while (attempt <= policy.maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= policy.maxAttempts) {
        break;
      }
      const delay = computeBackoffDelay(attempt, policy, runtime.random ?? Math.random);
      await sleep(delay);
      attempt += 1;
    }
  }

  throw lastError;
}
