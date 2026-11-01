import { TenantId } from '@conventions/nextjs/core';
import { describeIntegration } from '@conventions/nextjs/testing';
import { it, expect } from 'vitest';
import { invoiceRepository } from './invoice.repository';

// The invoice repository has no read method yet, so NX-AUTH-03's helper does not apply; the
// tenant id is still named in every call (NX-NAME-34).
describeIntegration('invoiceRepository', () => {
  it('issues without throwing', async () => {
    await expect(invoiceRepository.issue(TenantId('tenant-a'), 'ord_1', new Date())).resolves.toBeUndefined();
  });
});
