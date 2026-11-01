import { describe, it, expect } from 'vitest';
import { localStack } from '@/tests/support/local-stack';
import { orderRepository } from './order.repository';
import { OrderId } from '../domain/order-id';
import { anOrder } from '@/tests/factories/order';

// NX-AUTH-03: proves another tenant's rows can be neither read nor changed.
describe.skipIf(!localStack())('orderRepository', () => {
  it('does not return another tenant’s order', async () => {
    await orderRepository.save('tenant-a', anOrder({ id: OrderId('ord_iso'), tenantId: 'tenant-a' }));
    expect(await orderRepository.findById('tenant-b', OrderId('ord_iso'))).toBeNull();
  });

  it('does not overwrite another tenant’s order', async () => {
    await orderRepository.save('tenant-b', anOrder({ id: OrderId('ord_iso'), tenantId: 'tenant-b', status: 'paid' }));
    const row = await orderRepository.findById('tenant-a', OrderId('ord_iso'));
    expect(row?.status).toBe('draft');
  });
});
