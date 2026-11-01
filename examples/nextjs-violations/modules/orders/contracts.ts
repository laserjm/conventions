// expect: NX-NAME-60, NX-NAME-61
import { z } from 'zod';
export const payOrderInput = z.object({ orderId: z.string(), tenantId: z.string() });
export type PayOrderInput = z.infer<typeof payOrderInput>;
export type OrderResponse = { id: string };
