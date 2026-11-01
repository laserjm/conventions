/**
 * Declares a repository against its port, so infra must implement exactly the port's methods:
 *
 *   export const orderRepository = defineRepository<OrderRepository>({ async findById(tenantId, id) { … } });
 */
export function defineRepository<Port extends object>(implementation: Port): Port {
  return implementation;
}
