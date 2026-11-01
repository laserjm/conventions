// Shipped by @conventions/eslint-plugin-nextjs (binding: drizzle) — NX-TYPE-06.
// DATABASE_URL is validated on first connection so importing this file needs no configuration.
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return url;
}

let client: ReturnType<typeof postgres> | undefined;
function sqlClient() {
  client ??= postgres(connectionString(), { prepare: false });
  return client;
}

export const db = drizzle(sqlClient(), { schema });
