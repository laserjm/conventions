// Starter from @conventions/nextjs — NX-ZOD-05, NX-TYPE-06. The only reader of process.env besides lib/db/client.ts.
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
