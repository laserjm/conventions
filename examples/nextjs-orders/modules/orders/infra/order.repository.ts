// Repository: defineRepository against the port; tenant id first (NX-AUTH-03); constraint → tagged error (NX-DB-05).
import { and, eq } from 'drizzle-orm';
import { ConstraintViolation, defineRepository, type TenantId } from '@conventions/nextjs/core';
import { violatedConstraint } from '@conventions/nextjs/drizzle';
import { db } from '@/lib/db/client';
import { orders } from '@/lib/db/schema';
import type { Order } from '../domain/order';
import type { OrderId } from '../domain/order-id';
import type { OrderRepository } from '../application/ports';
import { toDomain, toRow } from './order.mapper';

export const orderRepository = defineRepository<OrderRepository>({
  async findById(tenantId: TenantId, id: OrderId): Promise<Order | null> {
    const row = await db().query.orders.findFirst({ where: and(eq(orders.tenantId, tenantId), eq(orders.id, id)) });
    return row ? toDomain(row) : null;
  },

  async save(tenantId: TenantId, order: Order): Promise<void> {
    const row = toRow(order);
    try {
      await db()
        .insert(orders)
        .values({ ...row, tenantId })
        .onConflictDoUpdate({ target: orders.id, set: row, setWhere: eq(orders.tenantId, tenantId) });
    } catch (error) {
      const constraint = violatedConstraint(error);
      if (constraint) throw new ConstraintViolation(constraint, 'orders');
      throw error;
    }
  },
});
