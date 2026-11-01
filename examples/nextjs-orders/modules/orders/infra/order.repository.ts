// Repository: plain object implementing the port; tenant id first (NX-AUTH-03); constraint → tagged error (NX-DB-05).
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { violatedConstraint } from '@/lib/db/errors';
import { orders } from '@/lib/db/schema';
import type { Order } from '../domain/order';
import type { OrderId } from '../domain/order-id';
import type { OrderRepository } from '../application/ports';
import { toDomain, toRow } from './order.mapper';

export const orderRepository: OrderRepository = {
  async findById(tenantId: string, id: OrderId): Promise<Order | null> {
    const row = await db().query.orders.findFirst({ where: and(eq(orders.tenantId, tenantId), eq(orders.id, id)) });
    return row ? toDomain(row) : null;
  },

  async save(tenantId: string, order: Order): Promise<void> {
    const row = toRow(order);
    try {
      await db()
        .insert(orders)
        .values({ ...row, tenantId })
        .onConflictDoUpdate({ target: orders.id, set: row, setWhere: eq(orders.tenantId, tenantId) });
    } catch (error) {
      const constraint = violatedConstraint(error);
      if (constraint) throw new OrderConstraintViolation(constraint);
      throw error;
    }
  },
};

/** Translated by the action into `Conflict`; infra may throw, the use case boundary turns it into a value. */
export class OrderConstraintViolation extends Error {
  constructor(public readonly constraint: string) {
    super(`orders: constraint ${constraint} violated`);
  }
}
