// Shipped by @conventions/eslint-plugin-nextjs (binding: drizzle) — NX-DB-06, NX-DB-07, NX-DRZ-05.
import { sql } from 'drizzle-orm';
import { db } from './client';

export type CallerClass = 'interactive' | 'system';

const STATEMENT_TIMEOUT: Record<CallerClass, string> = {
  interactive: '8s',
  system: '5min',
};

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Transaction = Tx;

/** The only place a transaction is opened. Only `infra/` may import this file. */
export async function withTransaction<T>(
  caller: CallerClass,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`set local statement_timeout = ${sql.raw(`'${STATEMENT_TIMEOUT[caller]}'`)}`);
    return fn(tx);
  });
}
