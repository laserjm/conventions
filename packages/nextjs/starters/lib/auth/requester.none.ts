// Starter from @conventions/nextjs (binding: supabase, isolation: none) — NX-AUTH-01, NX-SB-03.
// The project owns this file. No row belongs to a user or tenant here; authorization reads `roles`.
import 'server-only';
import type { Requester } from '@conventions/nextjs/core';
import { createClient } from '@/lib/supabase/server';

/** The signed-in caller from the request's session, or null for a visitor. */
export async function getRequester(): Promise<Requester | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims) return null;
  return { kind: 'user', userId: claims.sub, roles: [] };
}
