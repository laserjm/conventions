// expect: NX-STR-02
import { orderRepository } from '@/modules/orders/infra/order.repository';
export function OrdersWidget() { return <div>{String(orderRepository)}</div>; }
