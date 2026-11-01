// NX-NAME-22: named for the fact that blocks the action; _tag equals the type name (NX-ERR-02).
import type { OrderId } from './order-id';

export type OrderAlreadyPaid = { readonly _tag: 'OrderAlreadyPaid'; readonly orderId: OrderId };
export type PaymentTooLow = { readonly _tag: 'PaymentTooLow'; readonly missingCents: number };

export type OrderError = OrderAlreadyPaid | PaymentTooLow;
