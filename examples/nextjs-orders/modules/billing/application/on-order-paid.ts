// Event handler in the receiving module (NX-XMOD-02). The event type comes from the publisher's
// index.ts, type-only: application/ may name another module's public types, never call it (NX-LAYER-01, -04).
import { defineUseCase, ok } from '@conventions/nextjs/core';
import type { OrderPaid } from '@/modules/orders/index';

export type OnOrderPaidDeps = { issueInvoice: (orderId: string, at: Date) => Promise<void> };

export const onOrderPaid = defineUseCase<OrderPaid, void, never, OnOrderPaidDeps>(async (event, deps) => {
  await deps.issueInvoice(event.orderId, event.paidAt);
  return ok(undefined);
});
