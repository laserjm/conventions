// expect: NX-STR-03, NX-LAYER-03
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { orderRepository } from '@/modules/orders/infra/order.repository';
export default function Page() { return <pre>{String(eq) + String(db) + String(orderRepository)}</pre>; }
