// NX-DB-06, NX-DB-07, NX-DRZ-05 — the only place a transaction is opened; only infra/ may call it.
import { AsyncLocalStorage } from 'node:async_hooks';
import { sql } from 'drizzle-orm';

export type CallerClass = 'interactive' | 'system';

/** NX-DRZ-05 defaults; a project that changes them passes `timeouts` and records it in ARCHITECTURE.md. */
export const DEFAULT_STATEMENT_TIMEOUT: Record<CallerClass, string> = {
  interactive: '8s',
  system: '5min',
};

type Executes = { execute(query: never): Promise<unknown> };
type Transactional<Tx> = { transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> };

export type TransactionRunner<Tx> = <T>(
  caller: CallerClass,
  fn: (tx: Tx) => Promise<T>,
  options?: { statementTimeout?: string },
) => Promise<T>;

/**
 * Builds `withTransaction` for a lazy database client:
 *
 *   export const withTransaction = createTransactionRunner(() => db());
 *
 * Commits when `fn` returns, rolls back when it throws. The timeout is set with `set local`, so
 * it ends with the transaction and never reaches the next client of a pooled connection.
 * Called inside another transaction, `fn` joins it and keeps the outer timeout.
 */
export function createTransactionRunner<Tx extends Executes>(
  getDb: () => Transactional<Tx>,
  timeouts: Record<CallerClass, string> = DEFAULT_STATEMENT_TIMEOUT,
): TransactionRunner<Tx> {
  const current = new AsyncLocalStorage<Tx>();
  return async (caller, fn, options = {}) => {
    const outer = current.getStore();
    if (outer) return fn(outer);
    const timeout = options.statementTimeout ?? timeouts[caller];
    return getDb().transaction(async (tx) => {
      await tx.execute(sql`select set_config('statement_timeout', ${timeout}, true)` as never);
      return current.run(tx, () => fn(tx));
    });
  };
}
