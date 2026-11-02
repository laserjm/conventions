import { describe } from 'vitest';
import { localStack } from './local-stack.js';

export type DescribeIntegrationOptions = {
  /** Shell command whose success means a stack runs; default `supabase status`. */
  probe?: string;
  /**
   * The project's own check, used instead of `probe`: truthy when a stack runs. For a project
   * that also picks a worktree's stack, sets its address and keys, or fails when a selected stack
   * is down: `describeIntegration('…', fn, { when: localStack })` with its own `localStack`.
   */
  when?: () => unknown;
};

/**
 * `describe` for tests that need the real database. Skips with a visible reason when no local
 * stack runs; never silently passes (NX-TEST-03).
 */
export function describeIntegration(name: string, fn: () => void, options: DescribeIntegrationOptions = {}): void {
  const up = options.when ? Boolean(options.when()) : localStack(options.probe);
  if (up) describe(name, fn);
  else describe.skip(`${name} (skipped: no local database stack — start it to run integration tests)`, fn);
}
