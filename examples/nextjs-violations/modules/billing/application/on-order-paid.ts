// expect: boundaries/element-types
import type { Order } from '@/modules/orders/domain/order';
export async function onOrderPaid(order: Order) {
  return order;
}
