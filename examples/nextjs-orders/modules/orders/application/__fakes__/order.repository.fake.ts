import type { Order } from '../../domain/order';
import type { OrderId } from '../../domain/order-id';
import type { OrderRepository } from '../ports';

export class InMemoryOrderRepository implements OrderRepository {
  private readonly rows = new Map<string, Order>();

  constructor(seed: Order[] = []) {
    for (const o of seed) this.rows.set(o.id, o);
  }

  async findById(tenantId: string, id: OrderId): Promise<Order | null> {
    const o = this.rows.get(id);
    return o && o.tenantId === tenantId ? o : null;
  }

  async save(tenantId: string, order: Order): Promise<void> {
    if (order.tenantId !== tenantId) return;
    this.rows.set(order.id, order);
  }
}
