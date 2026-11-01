'use server';
// The HTTP edge: validate, call the command with the signed-in requester, revalidate on ok.

import { revalidateTag } from 'next/cache';
import { memberActionClient } from '@/lib/safe-action';
import { payOrderInputSchema } from './contracts';
import { payOrder } from './commands';
import { ORDER_TAGS } from './queries';

export async function revalidateOrder(id: string) {
  revalidateTag(ORDER_TAGS.one(id));
  revalidateTag(ORDER_TAGS.all);
}

export const payOrderAction = memberActionClient
  .inputSchema(payOrderInputSchema)
  .action(async ({ parsedInput, ctx: { requester } }) => {
    const result = await payOrder(requester, parsedInput);
    if (result.ok) await revalidateOrder(result.value.orderId); // NX-CACHE-04: after ok
    return result;
  });
