// Ports carry the business name (NX-NAME-30/31/34). Tenant-owned methods take the tenant id first.
import type { Order } from '../domain/order';
import type { OrderEvent } from '../domain/events';
import type { OrderId } from '../domain/order-id';

export type OrderRepository = {
  findById(tenantId: string, id: OrderId): Promise<Order | null>;
  save(tenantId: string, order: Order): Promise<void>;
};

export type Clock = { now(): Date };

export type EventCollector = { collect(event: OrderEvent): void };

export type UnitOfWork = { run<T>(fn: () => Promise<T>): Promise<T> };
