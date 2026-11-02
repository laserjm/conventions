// Starter from @conventions/nextjs (binding: supabase, isolation: owner) — NX-AUTH-01, NX-SB-03.
// The project owns this file. Each signed-in user owns their rows; there are no shared workspaces.
// Shared workspaces would make this `isolation: tenant`, recorded in ARCHITECTURE.md.
import 'server-only';
import { OwnerId, type OwnerRequester } from '@conventions/nextjs/core';
import { createClient } from '@/lib/supabase/server';

/** The signed-in caller from the request's session, or null for a visitor. */
export async function getRequester(): Promise<OwnerRequester | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims) return null;
  return { kind: 'user', userId: claims.sub, ownerId: OwnerId(claims.sub), roles: [] };
}
