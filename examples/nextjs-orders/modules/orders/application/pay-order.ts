// Use case: (input, deps) => Promise<Result>. One value export named after the file (NX-NAME-03).
import { err, ok, type Result } from '@/lib/result';
import { forbidden, notFound, type Forbidden, type NotFound, type Requester } from '@/lib/errors';
import type { PayOrderInput } from '../contracts';
import { applyPayment } from '../domain/order';
import type { OrderError } from '../domain/errors';
import type { Clock, EventCollector, OrderRepository, UnitOfWork } from './ports';

export type PayOrderDeps = {
  requester: Requester;
  orders: OrderRepository;
  clock: Clock;
  events: EventCollector;
  uow: UnitOfWork;
};

export type PayOrderOutput = { orderId: PayOrderInput['orderId']; paidAt: Date };

export async function payOrder(
  input: PayOrderInput,
  deps: PayOrderDeps,
): Promise<Result<PayOrderOutput, OrderError | NotFound | Forbidden>> {
  const { requester, orders, clock, events, uow } = deps;
  if (!requester.roles.includes('member') && requester.tenantId !== input.tenantId) {
    return err(forbidden('not your order')); // NX-AUTH-02: authorization is a use-case decision
  }
  return uow.run(async () => {
    const order = await orders.findById(requester.tenantId, input.orderId);
    if (!order) return err(notFound('Order', input.orderId));
    const result = applyPayment(order, input.payment, clock.now());
    if (!result.ok) return result;
    await orders.save(requester.tenantId, result.value.order);
    events.collect(result.value.event);
    return ok({ orderId: order.id, paidAt: result.value.event.paidAt });
  });
}
