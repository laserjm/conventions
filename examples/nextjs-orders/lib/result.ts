// Shipped by @conventions/eslint-plugin-nextjs — do not edit; upgrade with the conventions version.
// NX-ERR-01: errors cross layer boundaries as values.

export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}

export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

export async function andThen<T, U, E, F>(
  result: Result<T, E>,
  fn: (value: T) => Promise<Result<U, F>> | Result<U, F>,
): Promise<Result<U, E | F>> {
  return result.ok ? fn(result.value) : result;
}

/** Exhaustiveness helper for `switch (error._tag)`. */
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}
