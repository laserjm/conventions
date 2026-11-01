// Event handler in the receiving module (NX-XMOD-02). Imports the event type through the other module's index (NX-LAYER-04).
import type { OrderPaid } from '@/modules/orders/index';
import { ok, type Result } from '@/lib/result';

export type OnOrderPaidDeps = { issueInvoice: (orderId: string, at: Date) => Promise<void> };

export async function onOrderPaid(event: OrderPaid, deps: OnOrderPaidDeps): Promise<Result<void, never>> {
  await deps.issueInvoice(event.orderId, event.paidAt);
  return ok(undefined);
}
