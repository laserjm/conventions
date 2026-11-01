// expect: nextjs/schema-suffix
import { z } from 'zod';
export const payOrderInput = z.object({ id: z.string() });
