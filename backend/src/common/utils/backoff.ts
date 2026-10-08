export interface BackoffOptions {
  baseMs?: number;
  maxMs?: number;
  jitter?: boolean;
}

export function computeBackoff(attempt: number, opts: BackoffOptions = {}): number {
  const { baseMs = 100, maxMs = 8_000, jitter = true } = opts;
  const raw = Math.min(maxMs, baseMs * 2 ** attempt);
  if (!jitter) return raw;
  // Full jitter — prevents thundering herd on retry storms.
  return Math.floor(Math.random() * raw);
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));