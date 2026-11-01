// expect: NX-LAYER-05, NX-CACHE-01
import { revalidateTag, unstable_cache } from 'next/cache';
import { orderRepository } from './infra/order.repository';
export const ORDER_TAGS = { all: 'orders', one: (id: string) => `order:${id}` };
export async function getOrder(id: string) {
  revalidateTag(ORDER_TAGS.one(id));
  return unstable_cache(() => orderRepository.findById(id), ['order', id])();
}
