// Shipped by @conventions/eslint-plugin-nextjs (binding: drizzle) as a STARTER — NX-TYPE-06.
// The project owns this file: adapt the driver and pool to its hosting. Keep `db()` lazy, so
// importing a module needs no DATABASE_URL, and keep `Database`, which transaction.ts uses.
import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  // prepare: false for transaction poolers (Supavisor, PgBouncer), which share sessions.
  return drizzle(postgres(url, { prepare: false }), { schema });
}

let database: ReturnType<typeof connect> | undefined;

/** Connects on first use. */
export function db() {
  database ??= connect();
  return database;
}

export type Database = ReturnType<typeof db>;
