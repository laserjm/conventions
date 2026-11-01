// Shipped by @conventions/eslint-plugin-nextjs (binding: next-safe-action) — NX-NSA-01, NX-NSA-03.
import { createSafeActionClient } from 'next-safe-action';
import { randomUUID } from 'node:crypto';
import type { Requester } from '@/lib/errors';
import { getRequester } from '@/lib/auth/requester';

/** Actions anyone may call (sign-in, public forms). */
export const actionClient = createSafeActionClient({
  handleServerError(error) {
    const traceId = randomUUID();
    console.error('[action]', traceId, error);
    return { _tag: 'Unexpected' as const, traceId };
  },
});

/** Actions that need a signed-in member. `ctx.requester` is the Requester (NX-AUTH-01). */
export const memberActionClient = actionClient.use(async ({ next }) => {
  const requester: Requester | null = await getRequester();
  if (!requester) {
    // Returned, not thrown: the client switches on `_tag` (NX-ERR-02).
    return next({ ctx: { requester: null as Requester | null, signedOut: true } });
  }
  return next({ ctx: { requester, signedOut: false } });
});
