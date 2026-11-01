// Starter from @conventions/nextjs (binding: drizzle) — NX-TYPE-06, NX-DB-06. The project owns this file.
import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createTransactionRunner } from '@conventions/nextjs/drizzle';
import * as schema from './schema';

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return drizzle(postgres(url, { prepare: false }), { schema });
}

let database: ReturnType<typeof connect> | undefined;

/** Connects on first use. */
export function db() {
  database ??= connect();
  return database;
}

export type Database = ReturnType<typeof db>;

/** The only place a transaction is opened; only infra/ imports it (NX-DB-06). */
export const withTransaction = createTransactionRunner(() => db());
