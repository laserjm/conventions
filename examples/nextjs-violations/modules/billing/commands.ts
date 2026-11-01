// expect: nextjs/require-server-only
// NX-LAYER-11: commands.ts reaches the database; without 'server-only' a client import would bundle it.
import { onOrderPaid as handle } from './application/on-order-paid';

export function onOrderPaid() {
  return handle;
}
