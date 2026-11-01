// expect: NX-LAYER-05, NX-NAME-52, NX-ERR-04, NX-AUTH-07
'use client';
import { orderRepository } from '../infra/order.repository';
type Props = { error: { _tag: string }; requester: { roles: string[] } };
export function OrderAdminComponent({ error, requester }: Props) {
  return <div hidden={!requester.roles.includes('admin')}>{error._tag}{String(orderRepository)}</div>;
}
