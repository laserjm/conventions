// expect: NX-DB-06, NX-LAYER-07
import { createTransactionRunner } from '@conventions/nextjs/drizzle';
export const usesTransactions = createTransactionRunner;
