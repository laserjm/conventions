// The only file that knows both OrderRow and Order (NX-NAME-41). Casts are allowed here (NX-TYPE-02).
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { orders } from '@/lib/db/schema';
import type { Order } from '../domain/order';
import { OrderId } from '../domain/order-id';
import { money } from '../domain/money';

export type OrderRow = InferSelectModel<typeof orders>;
export type NewOrderRow = InferInsertModel<typeof orders>;

export function toDomain(row: OrderRow): Order {
  return {
    id: OrderId(row.id),
    tenantId: row.tenantId,
    status: row.status,
    total: money(row.totalCents),
    paidAt: row.paidAt,
  };
}

export function toRow(order: Order): NewOrderRow {
  return {
    id: order.id,
    tenantId: order.tenantId,
    status: order.status,
    totalCents: order.total.cents,
    paidAt: order.paidAt,
  };
}
