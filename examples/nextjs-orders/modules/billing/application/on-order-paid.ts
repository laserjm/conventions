// Event handler in the receiving module (NX-XMOD-02). The event type comes from the publisher's
// index.ts, type-only: application/ may name another module's public types, never call it (NX-LAYER-01, -04).
import type { OrderPaid } from '@/modules/orders/index';
import { ok, type Result } from '@/lib/result';

export type OnOrderPaidDeps = { issueInvoice: (orderId: string, at: Date) => Promise<void> };

export async function onOrderPaid(event: OrderPaid, deps: OnOrderPaidDeps): Promise<Result<void, never>> {
  await deps.issueInvoice(event.orderId, event.paidAt);
  return ok(undefined);
}
