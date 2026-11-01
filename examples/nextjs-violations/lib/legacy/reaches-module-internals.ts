// expect: NX-LAYER-10
import { orderRepository } from '@/modules/orders/infra/order.repository';
export const reachesInternals = orderRepository;
