export type OrderId = string & { readonly __brand: 'OrderId' };
export function OrderId(value: string): OrderId { return value as OrderId; }
