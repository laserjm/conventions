// Shipped by @conventions/eslint-plugin-nextjs (binding: supabase) — NX-TEST-03, NX-SB-07.
import { execSync } from 'node:child_process';

let cached: boolean | undefined;

/** True when the local Supabase stack is running. Integration tests use `describe.skipIf(!localStack())`. */
export function localStack(): boolean {
  if (cached !== undefined) return cached;
  try {
    execSync('supabase status', { stdio: 'ignore' });
    cached = true;
  } catch {
    cached = false;
  }
  return cached;
}
