// Starter from @conventions/nextjs (binding: supabase) — NX-AUTH-01, NX-SB-03. The project owns
// this file. One tenant per member here; a project with workspaces derives tenantId and roles
// from its membership table instead, and records that in ARCHITECTURE.md.
import 'server-only';
import { TenantId, type Requester } from '@conventions/nextjs/core';
import { createClient } from '@/lib/supabase/server';

/** The signed-in caller from the request's session, or null for a visitor. */
export async function getRequester(): Promise<Requester | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims) return null;
  return { kind: 'user', userId: claims.sub, tenantId: TenantId(claims.sub), roles: [] };
}
