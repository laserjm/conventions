import type { Requester } from '@/lib/errors';

/** Binding: supabase. Reads the session once per request (NX-AUTH-01). Stubbed in the fixture. */
export async function getRequester(): Promise<Requester | null> {
  return { userId: 'usr_1', tenantId: 'usr_1', roles: [] };
}
