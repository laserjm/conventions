// expect: nextjs/action-suffix, nextjs/no-inline-cache-tags
'use server';
import { revalidateTag } from 'next/cache';
export async function payOrder() {
  revalidateTag('orders');
}
