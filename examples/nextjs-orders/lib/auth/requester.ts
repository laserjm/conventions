import { TenantId, type Requester } from '@conventions/nextjs/core';

/** Binding: supabase. Reads the session once per request (NX-AUTH-01). Stubbed in the fixture. */
export async function getRequester(): Promise<Requester | null> {
  return { kind: 'user', userId: 'usr_1', tenantId: TenantId('usr_1'), roles: [] };
}
