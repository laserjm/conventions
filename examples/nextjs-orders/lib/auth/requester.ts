import { TenantId, type TenantRequester } from '@conventions/nextjs/core';

/** Binding: supabase, isolation: tenant. Reads the session once per request (NX-AUTH-01). Stubbed in the fixture. */
export async function getRequester(): Promise<TenantRequester | null> {
  return { kind: 'user', userId: 'usr_1', tenantId: TenantId('usr_1'), roles: [] };
}
