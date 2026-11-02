// Use case: defineUseCase pins (input, deps) => Promise<Result> (NX-LAYER-07, NX-ERR-01). One value export, named after the file (NX-NAME-03).
import { defineUseCase, err, ok, forbidden, notFound, type Forbidden, type NotFound, type TenantRequester } from '@conventions/nextjs/core';
import type { PayOrderInput } from '../contracts';
import { applyPayment } from '../domain/order';
import type { OrderError } from '../domain/errors';
import type { Clock, EventCollector, OrderRepository, UnitOfWork } from './ports';

export type PayOrderDeps = {
  requester: TenantRequester;
  orders: OrderRepository;
  clock: Clock;
  events: EventCollector;
  uow: UnitOfWork;
};

export type PayOrderOutput = { orderId: PayOrderInput['orderId']; paidAt: Date };

export const payOrder = defineUseCase<PayOrderInput, PayOrderOutput, OrderError | NotFound | Forbidden, PayOrderDeps>(
  async (input, { requester, orders, clock, events, uow }) => {
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
  },
);
