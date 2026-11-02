// NX-NSA-01, NX-NSA-03 — the two action clients every project uses, created once in lib/safe-action.ts.
import { createSafeActionClient, returnServerError } from 'next-safe-action';
import { randomUUID } from 'node:crypto';
import { signedOut, type Requester, type SignedOut, type Unexpected } from '../core/index.js';

export type ActionClientsOptions<R extends Requester = Requester> = {
  /**
   * Reads the session once per request (NX-AUTH-01); null for a visitor. Its type is the project's
   * requester (`TenantRequester`, `OwnerRequester` or `Requester`, per the header's `isolation`),
   * and `ctx.requester` inside an action has that type.
   */
  getRequester: () => Promise<R | null>;
  /** Where a thrown error goes before the caller gets a trace id. Default: console.error. */
  log?: (traceId: string, error: unknown) => void;
};

/**
 * `actionClient`: anyone may call (sign-in, public forms). A thrown error is a bug: logged with a
 * trace id, the caller gets `{ _tag: 'Unexpected', traceId }` (NX-NSA-03).
 * `memberActionClient`: the caller is signed in once, here. A visitor gets
 * `serverError: { _tag: 'SignedOut' }` and the action does not run, so `ctx.requester` is never null.
 */
export function createActionClients<R extends Requester = Requester>({ getRequester, log }: ActionClientsOptions<R>) {
  const actionClient = createSafeActionClient({
    handleServerError(error): SignedOut | Unexpected {
      const traceId = randomUUID();
      (log ?? ((id, e) => console.error('[action]', id, e)))(traceId, error);
      return { _tag: 'Unexpected', traceId };
    },
  });

  const memberActionClient = actionClient.use(async ({ next }) => {
    const requester = await getRequester();
    if (!requester) returnServerError(signedOut());
    return next({ ctx: { requester: requester as R } });
  });

  return { actionClient, memberActionClient };
}
