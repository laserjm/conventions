// Shipped by @conventions/eslint-plugin-nextjs — do not edit; upgrade with the conventions version.
// NX-ERR-03: the standard error catalogue. Modules add domain errors on top.

export type ValidationFailed = {
  readonly _tag: 'ValidationFailed';
  readonly issues: ReadonlyArray<{ path: string; message: string }>;
};
export type SignedOut = { readonly _tag: 'SignedOut' };
export type Forbidden = { readonly _tag: 'Forbidden'; readonly reason?: string };
export type NotFound = { readonly _tag: 'NotFound'; readonly entity: string; readonly id?: string };
export type Conflict = { readonly _tag: 'Conflict'; readonly constraint: string };
export type Unexpected = { readonly _tag: 'Unexpected'; readonly traceId: string };

export type StandardError = ValidationFailed | SignedOut | Forbidden | NotFound | Conflict | Unexpected;

export const signedOut = (): SignedOut => ({ _tag: 'SignedOut' });
export const forbidden = (reason?: string): Forbidden => ({ _tag: 'Forbidden', reason });
export const notFound = (entity: string, id?: string): NotFound => ({ _tag: 'NotFound', entity, id });
export const conflict = (constraint: string): Conflict => ({ _tag: 'Conflict', constraint });
export const unexpected = (traceId: string): Unexpected => ({ _tag: 'Unexpected', traceId });

/** Identity of the caller, produced once per request (NX-AUTH-01). */
export type Requester = {
  readonly userId: string;
  readonly tenantId: string;
  readonly roles: ReadonlyArray<string>;
};
