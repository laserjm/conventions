import type { Requester } from '@/lib/errors';
import { OrderId, money, type Order } from '@/modules/orders/index';

export function anOrder(overrides: Partial<Order> = {}): Order {
  return { id: OrderId('ord_1'), tenantId: 'usr_1', status: 'draft', total: money(1000), paidAt: null, ...overrides };
}

export function aPaidOrder(overrides: Partial<Order> = {}): Order {
  return anOrder({ status: 'paid', paidAt: new Date('2025-12-31T00:00:00Z'), ...overrides });
}

export function aRequester(overrides: Partial<Requester> = {}): Requester {
  return { userId: 'usr_1', tenantId: 'usr_1', roles: [], ...overrides };
}
