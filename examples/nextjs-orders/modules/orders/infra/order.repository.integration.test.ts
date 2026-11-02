import { TenantId } from '@conventions/nextjs/core';
import { assertIsolation, describeIntegration } from '@conventions/nextjs/testing';
import { orderRepository } from './order.repository';
import { OrderId } from '../domain/order-id';
import { anOrder } from '@/tests/factories/order';

// NX-AUTH-03 / NX-TEST-02 (isolation: tenant): another tenant's rows can be neither read nor changed.
describeIntegration('orderRepository', () => {
  const id = OrderId('ord_iso');
  assertIsolation({
    name: 'findById, save',
    ownerA: TenantId('tenant-a'),
    ownerB: TenantId('tenant-b'),
    arrange: (tenantId) => orderRepository.save(tenantId, anOrder({ id, tenantId })),
    read: (tenantId) => orderRepository.findById(tenantId, id),
    change: (tenantId) => orderRepository.save(tenantId, anOrder({ id, tenantId, status: 'paid' })),
  });
});
