// Shipped by @conventions/eslint-plugin-nextjs (binding: drizzle) — NX-DB-05.
// Do not edit; upgrade with the conventions version.
// Translates a database error into names the repository can map to a tagged error. Works with
// node-postgres and postgres.js, and with Drizzle's wrapper around either.

const CONSTRAINT_CODES = new Set(['23505', '23503', '23514', '23502', '23P01']); // unique, fk, check, not-null, exclusion

type DriverError = { code?: unknown; constraint?: unknown; constraint_name?: unknown };

/** The Postgres error code behind a failed query (`23505`, or the code a function raises). */
export function postgresErrorCode(error: unknown): string | undefined {
  const code = driverError(error)?.code;
  return typeof code === 'string' ? code : undefined;
}

/** The violated constraint's name, or undefined when the error is not a constraint violation. */
export function violatedConstraint(error: unknown): string | undefined {
  const e = driverError(error);
  if (!e || typeof e.code !== 'string' || !CONSTRAINT_CODES.has(e.code)) return undefined;
  const name = e.constraint ?? e.constraint_name;
  return typeof name === 'string' ? name : e.code;
}

/** The driver's error: the error itself, or the `cause` Drizzle wraps it in. */
function driverError(error: unknown, depth = 0): DriverError | undefined {
  if (!error || typeof error !== 'object' || depth > 3) return undefined;
  if ('code' in error && typeof error.code === 'string' && /^[0-9A-Z]{5}$/.test(error.code)) return error;
  return 'cause' in error ? driverError(error.cause, depth + 1) : undefined;
}
