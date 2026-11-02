// NX-ERR-03: the standard error catalogue. Modules add domain errors on top; nothing redefines these.
export type ValidationFailed = {
  readonly _tag: 'ValidationFailed';
  readonly issues: ReadonlyArray<{ path: string; message: string }>;
};
export type SignedOut = { readonly _tag: 'SignedOut' };
export type Forbidden = { readonly _tag: 'Forbidden'; readonly reason?: string };
export type NotFound = { readonly _tag: 'NotFound'; readonly entity: string; readonly id?: string };
/** A constraint refused the write: a unique key, a check, a foreign key (NX-DB-05). */
export type Conflict = { readonly _tag: 'Conflict'; readonly constraint: string };
/** An edit named the revision it started from, and the row has moved on since: optimistic concurrency. */
export type RevisionConflict = { readonly _tag: 'RevisionConflict' };
export type Unexpected = { readonly _tag: 'Unexpected'; readonly traceId: string };

export type StandardError = ValidationFailed | SignedOut | Forbidden | NotFound | Conflict | RevisionConflict | Unexpected;

export const signedOut = (): SignedOut => ({ _tag: 'SignedOut' });
export const forbidden = (reason?: string): Forbidden => ({ _tag: 'Forbidden', reason });
export const notFound = (entity: string, id?: string): NotFound => ({ _tag: 'NotFound', entity, id });
export const conflict = (constraint: string): Conflict => ({ _tag: 'Conflict', constraint });
export const revisionConflict = (): RevisionConflict => ({ _tag: 'RevisionConflict' });
export const unexpected = (traceId: string): Unexpected => ({ _tag: 'Unexpected', traceId });

/** Thrown by a repository when a constraint refused the write; the command turns it into `Conflict` (NX-DB-05). */
export class ConstraintViolation extends Error {
  constructor(
    public readonly constraint: string,
    entity: string,
  ) {
    super(`${entity}: constraint ${constraint} violated`);
    this.name = 'ConstraintViolation';
  }
}
