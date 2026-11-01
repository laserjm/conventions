import { describe } from 'vitest';
import { localStack } from './local-stack';

/**
 * `describe` for tests that need the real database. Skips with a visible reason when no local
 * stack runs; never silently passes (NX-TEST-03).
 */
export function describeIntegration(name: string, fn: () => void, options: { probe?: string } = {}): void {
  if (localStack(options.probe)) describe(name, fn);
  else describe.skip(`${name} (skipped: no local database stack — start it to run integration tests)`, fn);
}
