import type { TenantId } from '@conventions/nextjs/core';
import { db } from '@/lib/db/client';

export const invoiceRepository = {
  async issue(tenantId: TenantId, orderId: string, at: Date): Promise<void> {
    void db; // the fixture has no invoices table; a real module inserts here
    void tenantId;
    void orderId;
    void at;
  },
};
