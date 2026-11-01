// Shipped by @conventions/eslint-plugin-nextjs (binding: drizzle) — NX-DB-06, NX-DB-07, NX-DRZ-05.
// Do not edit; upgrade with the conventions version.
import { AsyncLocalStorage } from 'node:async_hooks';
import { sql } from 'drizzle-orm';
import { db, type Database } from './client';

export type CallerClass = 'interactive' | 'system';

/** NX-DRZ-05 defaults; a project that changes them records it in ARCHITECTURE.md. */
const STATEMENT_TIMEOUT: Record<CallerClass, string> = {
  interactive: '8s',
  system: '5min',
};

export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

/** The transaction the current call runs in, so one opened inside it joins it. */
const current = new AsyncLocalStorage<Transaction>();

/**
 * The only place a transaction is opened. Only `infra/` may import this file.
 *
 * Commits when `fn` returns, rolls back when it throws. The timeout is set with `set local`, so
 * it ends with the transaction and never reaches the next client of a pooled connection.
 * `statementTimeout` overrides the caller class's budget (tests, one-off maintenance).
 *
 * Called inside another transaction, `fn` joins it and keeps the outer timeout: a use case that
 * asks another module while it holds a lock reads on the same connection, sees what that lock
 * decided, and never waits for a second pooled connection while it holds the first.
 */
export async function withTransaction<T>(
  caller: CallerClass,
  fn: (tx: Transaction) => Promise<T>,
  options: { statementTimeout?: string } = {},
): Promise<T> {
  const outer = current.getStore();
  if (outer) return fn(outer);
  const timeout = options.statementTimeout ?? STATEMENT_TIMEOUT[caller];
  return db().transaction(async (tx) => {
    await tx.execute(sql`select set_config('statement_timeout', ${timeout}, true)`);
    return current.run(tx, () => fn(tx));
  });
}
