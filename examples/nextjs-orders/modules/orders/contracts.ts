// Contract schemas: camelCase + Schema; inferred type without suffix (NX-NAME-60).
import { z } from 'zod';
import { OrderId } from './domain/order-id';

export const orderIdSchema = z.string().min(1).transform(OrderId);

export const moneySchema = z.object({ cents: z.number().int().nonnegative(), currency: z.literal('EUR') });

export const payOrderInputSchema = z.object({
  tenantId: z.string().min(1),
  orderId: orderIdSchema,
  payment: moneySchema,
});
export type PayOrderInput = z.infer<typeof payOrderInputSchema>;

export const orderSummaryDtoSchema = z.object({
  id: z.string(),
  status: z.enum(['draft', 'paid', 'shipped']),
  totalCents: z.number(),
  paidAt: z.string().nullable(),
});
export type OrderSummaryDto = z.infer<typeof orderSummaryDtoSchema>;
