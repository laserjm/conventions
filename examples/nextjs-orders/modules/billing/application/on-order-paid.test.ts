import { describe, it, expect } from 'vitest';
import { OrderId } from '@/modules/orders/index';
import { onOrderPaid } from './on-order-paid';

describe('onOrderPaid', () => {
  it('issues an invoice for the paid order', async () => {
    const issued: string[] = [];
    const result = await onOrderPaid(
      { _tag: 'OrderPaid', orderId: OrderId('ord_1'), paidAt: new Date('2026-01-01T00:00:00Z') },
      { issueInvoice: async (orderId) => { issued.push(orderId); } },
    );
    expect(result.ok).toBe(true);
    expect(issued).toEqual(['ord_1']);
  });
});
