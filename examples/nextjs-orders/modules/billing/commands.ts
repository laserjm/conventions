import 'server-only';
// billing's use cases, wired (NX-LAYER-11). The event handler is reached through server.ts by
// whoever dispatches the event after the order's transaction committed (NX-XMOD-02).
import type { TenantRequester } from '@conventions/nextjs/core';
import type { OrderPaid } from '@/modules/orders/index';
import { onOrderPaid as handle } from './application/on-order-paid';
import { invoiceRepository } from './infra/invoice.repository';

export function onOrderPaid(requester: TenantRequester, event: OrderPaid) {
  return handle(event, { issueInvoice: (orderId, at) => invoiceRepository.issue(requester.tenantId, orderId, at) });
}
