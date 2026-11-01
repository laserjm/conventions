'use server';

import { revalidateTag } from 'next/cache';
import { memberActionClient } from '@/lib/safe-action';
import { conflict, signedOut } from '@/lib/errors';
import { payOrderInputSchema } from './contracts';
import { payOrder } from './application/pay-order';
import { orderRepository, OrderConstraintViolation } from './infra/order.repository';
import { unitOfWork } from './infra/unit-of-work';
import { ORDER_TAGS } from './queries';
import type { OrderEvent } from './domain/events';

export async function revalidateOrder(id: string) {
  revalidateTag(ORDER_TAGS.one(id));
  revalidateTag(ORDER_TAGS.all);
}

export const payOrderAction = memberActionClient
  .inputSchema(payOrderInputSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (!ctx.requester) return { ok: false as const, error: signedOut() };
    const events: OrderEvent[] = [];
    try {
      const result = await payOrder(parsedInput, {
        requester: ctx.requester,
        orders: orderRepository,
        clock: { now: () => new Date() },
        events: { collect: (e) => events.push(e) },
        uow: unitOfWork,
      });
      if (result.ok) await revalidateOrder(result.value.orderId); // NX-CACHE-04: after ok
      return result;
    } catch (error) {
      if (error instanceof OrderConstraintViolation) return { ok: false as const, error: conflict(error.constraint) };
      throw error; // → Unexpected via handleServerError (NX-NSA-03)
    }
  });
