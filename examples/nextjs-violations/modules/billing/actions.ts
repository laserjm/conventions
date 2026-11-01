// expect: nextjs/actions-use-commands
// NX-LAYER-11: the module has commands.ts, so the action must not wire the use case itself.
'use server';
import { onOrderPaid } from './application/on-order-paid';

export const onOrderPaidAction = onOrderPaid;
