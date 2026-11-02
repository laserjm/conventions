// Repository on owned data (isolation: tenant): the tenant id comes first and is named in every query (NX-AUTH-03).
import { and, eq } from 'drizzle-orm';
import type { TenantId } from '@conventions/nextjs/core';
import { db } from '@/lib/db/client';
import { invoices } from '@/lib/db/schema';

export const invoiceRepository = {
  async issue(tenantId: TenantId, orderId: string, at: Date): Promise<void> {
    await db().insert(invoices).values({ tenantId, orderId, issuedAt: at }).onConflictDoNothing();
  },

  async findIssuedAt(tenantId: TenantId, orderId: string): Promise<Date | null> {
    const row = await db().query.invoices.findFirst({ where: and(eq(invoices.tenantId, tenantId), eq(invoices.orderId, orderId)) });
    return row?.issuedAt ?? null;
  },
};
