// expect: boundaries/element-types
import { db } from '@/lib/db/client';
export async function importsDb() {
  return db;
}
