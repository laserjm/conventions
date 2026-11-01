// expect: boundaries/element-types
// Legacy keeps its imports but reaches a module only through index.ts/server.ts (NX-LAYER-10).
import { orderRepository } from '@/modules/orders/infra/order.repository';
export const legacyOrders = orderRepository;
