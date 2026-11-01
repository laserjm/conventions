// Shipped by @conventions/eslint-plugin-nextjs (binding: supabase) as a STARTER — NX-AUTH-01.
// The project owns this file. One tenant per member here; a project with workspaces derives
// tenantId and roles from its membership table instead, and records that in ARCHITECTURE.md.
import 'server-only';
import type { Requester } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

/** The signed-in caller from the request's session, or null for a visitor. */
export async function getRequester(): Promise<Requester | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims) return null;
  return { userId: claims.sub, tenantId: claims.sub, roles: [] };
}
