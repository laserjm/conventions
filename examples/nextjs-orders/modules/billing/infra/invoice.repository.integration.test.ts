import { TenantId } from '@conventions/nextjs/core';
import { assertIsolation, describeIntegration } from '@conventions/nextjs/testing';
import { invoiceRepository } from './invoice.repository';

// NX-AUTH-03 / NX-TEST-02 (isolation: tenant): a repository with no findById/save still proves
// isolation; the helper takes callbacks for whatever its methods are.
describeIntegration('invoiceRepository', () => {
  const orderId = 'ord_invoice_iso';
  assertIsolation({
    name: 'issue, findIssuedAt',
    ownerA: TenantId('tenant-a'),
    ownerB: TenantId('tenant-b'),
    arrange: (tenantId) => invoiceRepository.issue(tenantId, orderId, new Date('2026-01-01T00:00:00Z')),
    read: (tenantId) => invoiceRepository.findIssuedAt(tenantId, orderId),
    change: (tenantId) => invoiceRepository.issue(tenantId, orderId, new Date('2026-02-01T00:00:00Z')),
  });
});
