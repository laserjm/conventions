import { TenantId } from '@conventions/nextjs/core';
import { assertTenantIsolation, describeIntegration } from '@conventions/nextjs/testing';
import { orderRepository } from './order.repository';
import { OrderId } from '../domain/order-id';
import { anOrder } from '@/tests/factories/order';

// NX-AUTH-03 / NX-TEST-02: proves another tenant's rows can be neither read nor changed.
describeIntegration('orderRepository', () => {
  assertTenantIsolation({
    repository: orderRepository,
    tenantA: TenantId('tenant-a'),
    tenantB: TenantId('tenant-b'),
    id: OrderId('ord_iso'),
    row: (tenantId, id) => anOrder({ id, tenantId }),
    changed: (tenantId, id) => anOrder({ id, tenantId, status: 'paid' }),
  });
});
