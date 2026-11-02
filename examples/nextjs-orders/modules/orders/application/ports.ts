// Ports carry the business name (NX-NAME-30/31/34). Tenant-owned methods take the TenantId first.
import type { Result, TenantId } from '@conventions/nextjs/core';
import type { Order } from '../domain/order';
import type { OrderEvent } from '../domain/events';
import type { OrderId } from '../domain/order-id';

export type OrderRepository = {
  findById(tenantId: TenantId, id: OrderId): Promise<Order | null>;
  save(tenantId: TenantId, order: Order): Promise<void>;
};

export type Clock = { now(): Date };

export type EventCollector = { collect(event: OrderEvent): void };

/** Runs `fn` in one transaction: commits on `ok`, rolls back on `err` (NX-DB-06). */
export type UnitOfWork = { run<R extends Result<unknown, unknown>>(fn: () => Promise<R>): Promise<R> };
