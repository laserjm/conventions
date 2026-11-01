// Shipped by @conventions/eslint-plugin-nextjs (binding: drizzle) — NX-DB-05.
// Translates a database constraint violation into a name the repository can map to a tagged error.

const CONSTRAINT_CODES = new Set(['23505', '23503', '23514', '23502']); // unique, fk, check, not-null

type PgError = { code?: string; constraint_name?: string; constraint?: string };

/** Returns the violated constraint's name, or undefined when the error is not a constraint violation. */
export function violatedConstraint(error: unknown): string | undefined {
  const e = error as PgError | undefined;
  if (!e || typeof e !== 'object' || !e.code || !CONSTRAINT_CODES.has(e.code)) return undefined;
  return e.constraint_name ?? e.constraint ?? e.code;
}
