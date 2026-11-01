// expect: @typescript-eslint/naming-convention
import type { Order } from '../domain/order';
export interface IOrderRepository {
  findById(tenantId: string, id: string): Promise<Order | null>;
}
