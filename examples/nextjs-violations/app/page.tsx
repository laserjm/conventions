// expect: boundaries/element-types, boundaries/external
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
export default function Page() {
  return <pre>{String(eq) + String(db)}</pre>;
}
