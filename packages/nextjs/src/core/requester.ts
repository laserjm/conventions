import type { Brand } from './brand.js';

// Who owns a row is the project's choice, declared once in the ARCHITECTURE.md header:
//   isolation: tenant  — a tenant (workspace, organisation) owns it: `TenantRequester`, `TenantId`
//   isolation: owner   — the signed-in user owns it:                 `OwnerRequester`, `OwnerId`
//   isolation: none    — nobody does (shared data only):             `Requester`
// The ownership rules (NX-AUTH-03/04/05/08, NX-NAME-34) apply to `tenant` and `owner` only.

/**
 * The tenant a row belongs to (`isolation: tenant`). Branded so a repository method on owned data
 * cannot be called with an arbitrary string: the id comes from a `TenantRequester`, and a system
 * caller names its tenant through `systemRequester` (NX-AUTH-03, NX-AUTH-05, NX-AUTH-06).
 */
export type TenantId = Brand<string, 'TenantId'>;

/** The one sanctioned constructor; used by `lib/auth/requester.ts`, mappers and system callers. */
export function TenantId(value: string): TenantId {
  return value as TenantId;
}

/**
 * The user a row belongs to (`isolation: owner`): each user's data is theirs alone and there are
 * no shared workspaces. Branded like `TenantId`, for the same reason.
 */
export type OwnerId = Brand<string, 'OwnerId'>;

/** The one sanctioned constructor; used by `lib/auth/requester.ts`, mappers and system callers. */
export function OwnerId(value: string): OwnerId {
  return value as OwnerId;
}

/** Identity of the caller, produced once per request (NX-AUTH-01). As is under `isolation: none`. */
export type Requester = {
  readonly kind: 'user' | 'system';
  readonly userId: string;
  readonly roles: ReadonlyArray<string>;
};

/** The caller and the tenant it acts for (`isolation: tenant`). */
export type TenantRequester = Requester & { readonly tenantId: TenantId };

/**
 * The caller and the user whose data it acts on (`isolation: owner`). For a signed-in user
 * `ownerId` is their own id; a system caller acts for an owner without being them.
 */
export type OwnerRequester = Requester & { readonly ownerId: OwnerId };

/**
 * A scheduled run, worker or delivery job: the same repositories as users, no bypass (NX-AUTH-06).
 * Under `isolation: tenant` or `owner` it names whose data it works on:
 *
 *   systemRequester('check-runner', { ownerId })
 */
export function systemRequester(name: string): Requester;
export function systemRequester(name: string, owner: { readonly tenantId: TenantId }): TenantRequester;
export function systemRequester(name: string, owner: { readonly ownerId: OwnerId }): OwnerRequester;
export function systemRequester(name: string, owner?: { readonly tenantId: TenantId } | { readonly ownerId: OwnerId }): Requester {
  return { kind: 'system', userId: `system:${name}`, roles: ['system'], ...owner };
}
