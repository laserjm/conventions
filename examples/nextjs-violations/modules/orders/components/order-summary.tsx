// No expect line: this file must be clean. With `legacy: ['components/**']` a module's own
// components/ is still ui, so importing its domain is allowed (legacy globs are anchored).
import type { Order } from '../domain/order';

export function OrderSummary({ order }: { order: Order }) {
  return <p>{order.id}</p>;
}
