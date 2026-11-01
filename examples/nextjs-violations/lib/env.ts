import { z } from 'zod';
export const env = z.object({ NEXT_PUBLIC_APP_URL: z.string() }).parse(process.env);
