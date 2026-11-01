// expect: @typescript-eslint/consistent-type-assertions
import type { Order } from '../domain/order';
export const orderRepository = {
  async findById(tenantId: string, id: string): Promise<Order> {
    return { id, tenantId } as unknown as Order;
  },
};
