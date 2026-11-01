// NX-NAME-23: past tense.
import type { OrderId } from './order-id';

export type OrderPaid = { readonly _tag: 'OrderPaid'; readonly orderId: OrderId; readonly paidAt: Date };

export type OrderEvent = OrderPaid;
