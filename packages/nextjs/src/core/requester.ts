import type { Brand } from './brand.js';

/**
 * The tenant a row belongs to. Branded so a repository method on tenant-owned data cannot be
 * called with an arbitrary string: the id comes from a `Requester`, and a system caller names
 * its tenant through `systemRequester` (NX-AUTH-03, NX-AUTH-05, NX-AUTH-06).
 */
export type TenantId = Brand<string, 'TenantId'>;

/** The one sanctioned constructor; used by `lib/auth/requester.ts`, mappers and system callers. */
export function TenantId(value: string): TenantId {
  return value as TenantId;
}

/** Identity of the caller, produced once per request (NX-AUTH-01). */
export type Requester = {
  readonly kind: 'user' | 'system';
  readonly userId: string;
  readonly tenantId: TenantId;
  readonly roles: ReadonlyArray<string>;
};

/** A scheduled run, worker or delivery job names its tenant explicitly; there is no bypass (NX-AUTH-06). */
export function systemRequester(tenantId: TenantId, name: string): Requester {
  return { kind: 'system', userId: `system:${name}`, tenantId, roles: ['system'] };
}
