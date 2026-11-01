// No expect line: a legacy component keeps its imports (it reaches a module through index.ts).
import { OrderId } from '@/modules/orders/index';
export function OldWidget() { return <div>{OrderId('x')}</div>; }
