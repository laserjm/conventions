// expect: boundaries/element-types
// NX-LAYER-01: application/ may name another module's public types (import type), never call it.
import { money } from '@/modules/orders/index';

export function callsOtherModule() {
  return money;
}
