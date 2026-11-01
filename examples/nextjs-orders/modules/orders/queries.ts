import 'server-only';
import { unstable_cache as cache } from 'next/cache';
import { getRequester } from '@/lib/auth/requester';
import type { OrderSummaryDto } from './contracts';
import { orderRepository } from './infra/order.repository';
import { OrderId } from './domain/order-id';

// NX-CACHE-02: tags are exported constants.
export const ORDER_TAGS = {
  all: 'orders',
  one: (id: string) => `order:${id}`,
};

export async function getOrder(id: string): Promise<(OrderSummaryDto & { tenantId: string; can: { pay: boolean } }) | null> {
  const requester = await getRequester();
  if (!requester) return null;
  const read = cache(
    async () => orderRepository.findById(requester.tenantId, OrderId(id)),
    ['order', requester.tenantId, id],
    { tags: [ORDER_TAGS.one(id)] },
  );
  const order = await read();
  if (!order) return null;
  return {
    id: order.id,
    tenantId: order.tenantId,
    status: order.status,
    totalCents: order.total.cents,
    paidAt: order.paidAt?.toISOString() ?? null,
    can: { pay: order.status === 'draft' }, // NX-AUTH-07: permissions computed server-side
  };
}
