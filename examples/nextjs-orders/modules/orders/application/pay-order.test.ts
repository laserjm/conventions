import { describe, it, expect } from 'vitest';
import { payOrder } from './pay-order';
import { InMemoryOrderRepository } from './__fakes__/order.repository.fake';
import { aPaidOrder, anOrder, aRequester } from '@/tests/factories/order';
import { money } from '../domain/money';

const fixedClock = { now: () => new Date('2026-01-01T00:00:00Z') };
const noUow = { run: <T>(fn: () => Promise<T>) => fn() };

describe('payOrder', () => {
  it('rejects payment on an already paid order', async () => {
    const orders = new InMemoryOrderRepository([aPaidOrder()]);
    const collected: unknown[] = [];
    const result = await payOrder(
      { tenantId: 'usr_1', orderId: aPaidOrder().id, payment: money(1000) },
      { requester: aRequester(), orders, clock: fixedClock, events: { collect: (e) => collected.push(e) }, uow: noUow },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error._tag).toBe('OrderAlreadyPaid');
    expect(collected).toHaveLength(0);
  });

  it('marks a draft order paid and collects OrderPaid', async () => {
    const orders = new InMemoryOrderRepository([anOrder()]);
    const collected: unknown[] = [];
    const result = await payOrder(
      { tenantId: 'usr_1', orderId: anOrder().id, payment: money(1000) },
      { requester: aRequester(), orders, clock: fixedClock, events: { collect: (e) => collected.push(e) }, uow: noUow },
    );
    expect(result.ok).toBe(true);
    expect(collected).toHaveLength(1);
  });
});
