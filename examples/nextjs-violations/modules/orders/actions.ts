// expect: NX-NAME-50, NX-CACHE-02, NX-NSA-02, NX-LAYER-11, NX-LAYER-06
'use server';
import { revalidateTag } from 'next/cache';
import { memberActionClient } from '@/lib/safe-action';
import { payOrderInput } from './contracts';
import { payOrder } from '@/modules/orders/application/pay-order';

export const payOrder2Action = async (input: { orderId: string }) => payOrder(input, {});

export const pay = memberActionClient.inputSchema(payOrderInput).action(async ({ parsedInput }) => {
  if (parsedInput.orderId.startsWith('vip')) return { ok: false as const };
  revalidateTag('orders');
  return { ok: true as const };
});
