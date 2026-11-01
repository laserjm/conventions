import 'server-only';
// The module's write use cases, wired to what they run on (NX-LAYER-11). The caller names the
// requester it signed in: an action takes it from `ctx`, a worker or a test brings its own.
// Commands trust their input's type; the action's schema validated it at the edge.
import { conflict, type Requester } from '@/lib/errors';
import type { PayOrderInput } from './contracts';
import { payOrder as pay } from './application/pay-order';
import type { OrderEvent } from './domain/events';
import { orderRepository, OrderConstraintViolation } from './infra/order.repository';
import { unitOfWork } from './infra/unit-of-work';

export async function payOrder(requester: Requester, input: PayOrderInput) {
  const events: OrderEvent[] = [];
  try {
    const result = await pay(input, {
      requester,
      orders: orderRepository,
      clock: { now: () => new Date() },
      events: { collect: (e) => events.push(e) },
      uow: unitOfWork,
    });
    // NX-XMOD-02: the transaction has committed; `events` are dispatched here when result.ok.
    // The fixture has no subscribers yet, so nothing is sent.
    return result;
  } catch (error) {
    // infra may throw; the command turns a known constraint into a value (NX-ERR-*)
    if (error instanceof OrderConstraintViolation) return { ok: false as const, error: conflict(error.constraint) };
    throw error; // → Unexpected via handleServerError (NX-NSA-03)
  }
}
