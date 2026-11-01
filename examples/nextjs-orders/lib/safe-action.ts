// Shipped by @conventions/eslint-plugin-nextjs (binding: next-safe-action) — NX-NSA-01, NX-NSA-03.
import 'server-only';
import { createSafeActionClient, returnServerError } from 'next-safe-action';
import { randomUUID } from 'node:crypto';
import { signedOut, type SignedOut, type Unexpected } from '@/lib/errors';
import { getRequester } from '@/lib/auth/requester';

/** Actions anyone may call (sign-in, public forms). A thrown error is a bug: logged, the caller gets a trace id. */
export const actionClient = createSafeActionClient({
  handleServerError(error): SignedOut | Unexpected {
    const traceId = randomUUID();
    console.error('[action]', traceId, error);
    return { _tag: 'Unexpected', traceId };
  },
});

/**
 * Actions that need a signed-in member. The caller is signed in once, here (NX-AUTH-01).
 * A visitor without a session gets `serverError: { _tag: 'SignedOut' }` and the action does
 * not run, so `ctx.requester` is never null inside an action.
 */
export const memberActionClient = actionClient.use(async ({ next }) => {
  const requester = await getRequester();
  if (!requester) returnServerError(signedOut());
  return next({ ctx: { requester } });
});
