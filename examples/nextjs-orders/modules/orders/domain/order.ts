// Aggregate root: plain types and pure functions (NX-RICH-03). Imports only own domain + lib/result (NX-LAYER-01).
import { err, ok, type Result } from '@/lib/result';
import type { OrderError } from './errors';
import type { OrderPaid } from './events';
import type { Money } from './money';
import type { OrderId } from './order-id';

export type OrderStatus = 'draft' | 'paid' | 'shipped';

export type Order = {
  readonly id: OrderId;
  readonly tenantId: string;
  readonly status: OrderStatus;
  readonly total: Money;
  readonly paidAt: Date | null;
};

export function createOrder(input: { id: OrderId; tenantId: string; total: Money }): Order {
  return { ...input, status: 'draft', paidAt: null };
}

export function isPaid(order: Order): boolean {
  return order.status !== 'draft';
}

export function applyPayment(
  order: Order,
  payment: Money,
  now: Date,
): Result<{ order: Order; event: OrderPaid }, OrderError> {
  if (isPaid(order)) return err({ _tag: 'OrderAlreadyPaid', orderId: order.id });
  if (payment.cents < order.total.cents) {
    return err({ _tag: 'PaymentTooLow', missingCents: order.total.cents - payment.cents });
  }
  const paid: Order = { ...order, status: 'paid', paidAt: now };
  return ok({ order: paid, event: { _tag: 'OrderPaid', orderId: order.id, paidAt: now } });
}
