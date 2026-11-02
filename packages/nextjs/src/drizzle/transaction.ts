// NX-DB-06, NX-DB-07, NX-DRZ-05 — the only place a transaction is opened; only infra/ may call it.
import { AsyncLocalStorage } from 'node:async_hooks';
import { sql } from 'drizzle-orm';
import { bug } from '../core/bug.js';
import type { Result } from '../core/result.js';

export type CallerClass = 'interactive' | 'system';

/** NX-DRZ-05 defaults; a project that changes them passes `timeouts` and records it in ARCHITECTURE.md. */
export const DEFAULT_STATEMENT_TIMEOUT: Record<CallerClass, string> = {
  interactive: '8s',
  system: '5min',
};

export type TransactionOptions = {
  /** Overrides the caller class's timeout for this transaction (ignored when joining). */
  statementTimeout?: string;
  /**
   * `'optional'` (default): join the caller's transaction when there is one, otherwise open one.
   * `'required'`: join the caller's transaction, and stop with a bug when there is none. For a
   * command that only means something inside another module's unit of work: a row lock taken on
   * its behalf, a write that must commit or roll back with the caller (NX-XMOD-01).
   */
  join?: 'optional' | 'required';
};

export type TransactionRunner<Tx> = {
  /**
   * `fn` returns a `Result`: commits on `ok`, rolls back on `err` and returns that `err`
   * unchanged, so a use case that refuses after it wrote keeps nothing (NX-DB-06). Joined to an
   * outer transaction, it returns the `err` to the outer unit of work, whose own `rollbackOnErr`
   * rolls everything back.
   */
  <R extends Result<unknown, unknown>>(caller: CallerClass, fn: (tx: Tx) => Promise<R>, options: TransactionOptions & { rollbackOnErr: true }): Promise<R>;
  /** Commits when `fn` returns, rolls back when it throws. */
  <T>(caller: CallerClass, fn: (tx: Tx) => Promise<T>, options?: TransactionOptions & { rollbackOnErr?: false }): Promise<T>;
};

type Executes = { execute(query: never): Promise<unknown> };
type Transactional<Tx> = { transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> };

/** Carries a refusal out of `transaction()` so the driver rolls back; never leaves the runner. */
class Refused {
  constructor(readonly result: { ok: false }) {}
}

const isErr = (value: unknown): value is { ok: false } =>
  typeof value === 'object' && value !== null && (value as { ok?: unknown }).ok === false;

/**
 * Builds `withTransaction` for a lazy database client:
 *
 *   export const withTransaction = createTransactionRunner(() => db());
 *
 * Commits when `fn` returns, rolls back when it throws; with `{ rollbackOnErr: true }`, also
 * rolls back when `fn` returns an `err`. The timeout is set with `set local`, so it ends with the
 * transaction and never reaches the next client of a pooled connection. Called inside another
 * transaction, `fn` joins it and keeps the outer timeout; `{ join: 'required' }` makes joining
 * the only option.
 */
export function createTransactionRunner<Tx extends Executes>(
  getDb: () => Transactional<Tx>,
  timeouts: Record<CallerClass, string> = DEFAULT_STATEMENT_TIMEOUT,
): TransactionRunner<Tx> {
  const current = new AsyncLocalStorage<Tx>();
  const run = async (
    caller: CallerClass,
    fn: (tx: Tx) => Promise<unknown>,
    options: TransactionOptions & { rollbackOnErr?: boolean } = {},
  ): Promise<unknown> => {
    const outer = current.getStore();
    if (outer) return fn(outer);
    if (options.join === 'required') bug(`withTransaction('${caller}'): this call must join the caller's transaction, and none is open`);
    const timeout = options.statementTimeout ?? timeouts[caller];
    try {
      return await getDb().transaction(async (tx) => {
        await tx.execute(sql`select set_config('statement_timeout', ${timeout}, true)` as never);
        const value = await current.run(tx, () => fn(tx));
        if (options.rollbackOnErr && isErr(value)) throw new Refused(value);
        return value;
      });
    } catch (e) {
      if (e instanceof Refused) return e.result;
      throw e;
    }
  };
  return run as TransactionRunner<Tx>;
}
