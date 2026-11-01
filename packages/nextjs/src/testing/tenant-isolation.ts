import { expect, it } from 'vitest';
import type { TenantId } from '../core/requester';

type TenantRepository<Row, Id> = {
  findById(tenantId: TenantId, id: Id): Promise<Row | null>;
  save(tenantId: TenantId, row: Row): Promise<void>;
};

export type TenantIsolationCase<Row, Id> = {
  repository: TenantRepository<Row, Id>;
  /** Two distinct tenants. */
  tenantA: TenantId;
  tenantB: TenantId;
  /** The id both tenants will use. */
  id: Id;
  /** Builds the row tenant A owns. */
  row: (tenant: TenantId, id: Id) => Row;
  /** A variant that differs visibly from `row(tenantA, id)`; tenant B tries to write it over A's row. */
  changed: (tenant: TenantId, id: Id) => Row;
};

/**
 * Registers the two tests NX-AUTH-03 requires of every repository on tenant-owned data: another
 * tenant's rows can be neither read nor changed. Call it inside `describeIntegration`.
 */
export function assertTenantIsolation<Row, Id>(c: TenantIsolationCase<Row, Id>): void {
  it('does not return another tenant’s row (NX-AUTH-03)', async () => {
    await c.repository.save(c.tenantA, c.row(c.tenantA, c.id));
    expect(await c.repository.findById(c.tenantB, c.id)).toBeNull();
  });

  it('does not change another tenant’s row (NX-AUTH-03)', async () => {
    await c.repository.save(c.tenantA, c.row(c.tenantA, c.id));
    await c.repository.save(c.tenantB, c.changed(c.tenantB, c.id));
    expect(await c.repository.findById(c.tenantA, c.id)).toEqual(c.row(c.tenantA, c.id));
  });
}
