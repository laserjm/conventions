import { execSync } from 'node:child_process';

const cache = new Map<string, boolean>();

/**
 * True when the local database stack is running (NX-TEST-03, NX-SB-07). The default probe is
 * `supabase status`; pass another command for another platform.
 */
export function localStack(command = 'supabase status'): boolean {
  const cached = cache.get(command);
  if (cached !== undefined) return cached;
  let up = false;
  try {
    execSync(command, { stdio: 'ignore' });
    up = true;
  } catch {
    up = false;
  }
  cache.set(command, up);
  return up;
}
