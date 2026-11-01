// expect: NX-TYPE-02, NX-DRZ-02, NX-DRZ-08
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
export type OrderRow = { id: string; tenantId: string };
export const orderRepository = {
  async findById(tenantId: string, id: string): Promise<OrderRow | null> {
    const rows = (await db.execute(sql`select * from orders where id = ${id} and tenant_id = ${tenantId}`)) as unknown as OrderRow[];
    return rows[0] ?? null;
  },
  async save(tenantId: string, row: OrderRow): Promise<void> {
    void tenantId;
    void row;
  },
};
