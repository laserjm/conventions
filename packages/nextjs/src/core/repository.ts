/**
 * Declares a repository against its port, so infra must implement exactly the port's methods:
 *
 *   export const orderRepository = defineRepository<OrderRepository>({ async findById(tenantId, id) { … } });
 *
 * Methods on owned data take the owner's id first: `TenantId` or `OwnerId`, per the header's
 * `isolation` (NX-NAME-34).
 */
export function defineRepository<Port extends object>(implementation: Port): Port {
  return implementation;
}
