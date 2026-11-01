'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@/components/ui/button';
import { payOrderAction } from '../actions';
import type { OrderSummaryDto } from '../contracts';

export type OrderCardProps = { order: OrderSummaryDto; canPay: boolean; tenantId: string };

// NX-ERR-04: tags map to copy; the raw tag never reaches the UI.
const ERROR_COPY: Record<string, string> = {
  OrderAlreadyPaid: 'This order was already paid.',
  PaymentTooLow: 'The payment does not cover the order total.',
  Forbidden: 'You cannot pay this order.',
  NotFound: 'This order no longer exists.',
  Conflict: 'This order changed in the meantime. Reload and try again.',
};

// NX-NSA-04: what the action client returns instead of running the action.
const SERVER_ERROR_COPY = {
  SignedOut: 'Your session ended. Sign in again to pay.',
  Unexpected: 'Something went wrong. Try again in a moment.',
} as const;

export function OrderCard({ order, canPay, tenantId }: OrderCardProps) {
  const { execute, result, isPending } = useAction(payOrderAction);
  const error = result.serverError
    ? SERVER_ERROR_COPY[result.serverError._tag]
    : result.data && !result.data.ok
      ? ERROR_COPY[result.data.error._tag]
      : undefined;

  function handlePay() {
    execute({ tenantId, orderId: order.id, payment: { cents: order.totalCents, currency: 'EUR' } });
  }

  return (
    <article>
      <h2>Order {order.id}</h2>
      <p>{order.status}</p>
      {error ? <p role="alert">{error}</p> : null}
      <Button disabled={!canPay || isPending} onClick={handlePay}>
        Pay
      </Button>
    </article>
  );
}
